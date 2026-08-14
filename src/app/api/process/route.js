import Papa from "papaparse";
import connectDB from "@/lib/mongodb";
import { Configuration } from "@/lib/models";
import { parseRoundingDigits, roundToEndingDigits } from "@/lib/roundingUtils";
import { defaultConfig } from "@/lib/defaultConfig";
import {
  applyDirectionFilter,
  applyLowerThreshold,
  buildBlockedCsvFromResults,
  buildCsvFromResults,
  calculateResultStatistics,
  filterBlockedResults,
  filterResultsForExport,
} from "@/lib/processingUtils";

// Pricing Engine Logic (ported from Python)
class PricingEngine {
  constructor(config) {
    this.config = config;
  }

  getPhase(ageDays) {
    for (const [phaseName, [minDays, maxDays]] of Object.entries(
      this.config.phase_bands,
    )) {
      if (ageDays >= minDays && ageDays <= maxDays) {
        return phaseName;
      }
    }
    return Object.keys(this.config.phase_bands)[
      Object.keys(this.config.phase_bands).length - 1
    ];
  }

  getAgeBand(ageDays) {
    // Handle both string format (legacy) and object format (new)
    const ageBands = this.config.age_bands || [];

    for (const band of ageBands) {
      // New format: object with min/max
      if (typeof band === "object" && band.name) {
        const minVal = band.min !== undefined ? band.min : 0;
        const maxVal = band.max !== undefined ? band.max : Infinity;
        if (ageDays >= minVal && ageDays <= maxVal) {
          return band.name;
        }
      } else if (typeof band === "string") {
        // Legacy format: string like "0-15" or "180+"
        if (band.includes("+")) {
          try {
            const minVal = parseInt(band.replace("+", ""));
            if (ageDays >= minVal) return band;
          } catch (e) {}
        } else if (band.includes("-")) {
          try {
            const [minStr, maxStr] = band.split("-");
            const minVal = parseInt(minStr);
            const maxVal = parseInt(maxStr);
            if (ageDays >= minVal && ageDays <= maxVal) return band;
          } catch (e) {}
        }
      }
    }

    // Return the last band's name as default
    const lastBand = ageBands[ageBands.length - 1];
    return typeof lastBand === "object" ? lastBand.name : lastBand || "180+";
  }

  getRatingBandFromValue(ratingVal) {
    try {
      // First check if it's a direct band name match
      for (const band of this.config.rating_bands) {
        if (String(ratingVal).trim() === band.name) {
          return band.name;
        }
      }

      // Try to parse as numeric score
      const score = parseInt(String(ratingVal).replace("%", "").trim());
      if (!isNaN(score)) {
        for (const band of this.config.rating_bands) {
          const bMin = band.min !== undefined ? band.min : 0;
          const bMax = band.max !== undefined ? band.max : 999;
          if (score >= bMin && score <= bMax) {
            return band.name;
          }
        }
      }
    } catch (e) {}
    return "78+"; // Default to highest band if can't parse
  }

  getLiveMarketImpact(liveMarketValue) {
    const bands = this.config.live_market_bands || [];
    for (const band of bands) {
      const bMin = band.min !== undefined && band.min !== null ? band.min : -Infinity;
      const bMax = band.max !== undefined && band.max !== null ? band.max : Infinity;
      if (liveMarketValue >= bMin && liveMarketValue <= bMax) {
        return {
          impact: Number(band.impact) || 0,
          bandName: band.name,
        };
      }
    }
    throw new Error(
      `Live market condition '${liveMarketValue}' not found in live market bands`,
    );
  }

  calculateTarget(stock) {
    const refCol = this.config.reference_column;
    let refVal;

    if (stock[refCol]) {
      refVal = parseFloat(
        String(stock[refCol]).replace(/,/g, "").replace(/[£$]/g, "").trim(),
      );
    } else if (stock["Retail valuation"]) {
      refVal = parseFloat(
        String(stock["Retail valuation"])
          .replace(/,/g, "")
          .replace(/[£$]/g, "")
          .trim(),
      );
    } else if (stock["benchmark_price"]) {
      refVal = parseFloat(
        String(stock["benchmark_price"])
          .replace(/,/g, "")
          .replace(/[£$]/g, "")
          .trim(),
      );
    } else {
      throw new Error(`Reference column '${refCol}' not found in CSV`);
    }

    const ageBand = this.getAgeBand(stock.age_days);
    const ratingBand = this.getRatingBandFromValue(stock.rating_band);

    if (!this.config.target_matrix[ageBand]) {
      throw new Error(`Age band '${ageBand}' not found in target matrix`);
    }

    if (!this.config.target_matrix[ageBand][ratingBand]) {
      throw new Error(
        `Rating '${stock.rating_band}' not found in matrix for ${ageBand}`,
      );
    }

    const matrixPercent = this.config.target_matrix[ageBand][ratingBand];
    const { impact: liveMarketImpact, bandName: liveMarketBand } =
      this.getLiveMarketImpact(stock.live_market_condition);
    const targetPercent = matrixPercent + liveMarketImpact;
    const targetPrice = refVal * (targetPercent / 100);

    return {
      refVal,
      targetPercent,
      targetPrice,
      matrixPercent,
      liveMarketImpact,
      liveMarketBand,
    };
  }

  getToleranceAbs(refVal) {
    if (this.config.tolerance_type === "percent") {
      return refVal * (this.config.tolerance_value / 100);
    }
    return this.config.tolerance_value;
  }

  getToleranceBounds(refVal, targetPercent, targetPrice) {
    if (this.config.tolerance_type === "percent") {
      return {
        lowerLimit:
          refVal * ((targetPercent - this.config.tolerance_value) / 100),
        upperLimit:
          refVal * ((targetPercent + this.config.tolerance_value) / 100),
      };
    }
    return {
      lowerLimit: targetPrice - this.config.tolerance_value,
      upperLimit: targetPrice + this.config.tolerance_value,
    };
  }

  applyDownNudge(currentPrice, refVal, targetPercent, targetPrice) {
    const nudgeAmt =
      this.config.nudge_type === "percent"
        ? refVal * (this.config.nudge_value / 100)
        : this.config.nudge_value;

    const priceDrop = currentPrice - nudgeAmt;
    const { lowerLimit, upperLimit } = this.getToleranceBounds(
      refVal,
      targetPercent,
      targetPrice,
    );

    if (priceDrop >= lowerLimit && priceDrop <= upperLimit) {
      return priceDrop;
    }
    return null;
  }

  applyRounding(price) {
    if (this.config.rounding_mode === "exact") {
      return Math.round(price * 100) / 100;
    } else if (this.config.rounding_mode === "49/99") {
      const suffixes = [25, 49, 75, 99];
      const century = Math.floor(price / 100) * 100;
      const candidates = [];

      for (let base of [century - 100, century, century + 100]) {
        for (const s of suffixes) {
          const val = base + s;
          if (val > 0) candidates.push(val);
        }
      }

      if (candidates.length === 0) return Math.round(price);
      return candidates.reduce((prev, curr) =>
        Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev,
      );
    } else if (this.config.rounding_mode === "ends_with_digit") {
      const digits = parseRoundingDigits(this.config);
      return roundToEndingDigits(price, digits);
    }

    return price;
  }

  calculateNewPrice(stock) {
    try {
      const {
        refVal,
        targetPercent,
        targetPrice,
        matrixPercent,
        liveMarketImpact,
        liveMarketBand,
      } = this.calculateTarget(stock);

      let finalPrice = stock.current_price;
      let reason = "No change";

      if (targetPrice > stock.current_price) {
        finalPrice = this.applyRounding(targetPrice);
        reason = `Increase to target (${targetPercent}%)`;
      } else if (stock.current_price > targetPrice) {
        const reduction = stock.current_price - targetPrice;
        const toleranceAbs = this.getToleranceAbs(refVal);

        if (reduction > toleranceAbs) {
          finalPrice = this.applyRounding(targetPrice);
          reason = `Decrease to target (${targetPercent}%)`;
        } else {
          const nudgedPrice = this.applyDownNudge(
            stock.current_price,
            refVal,
            targetPercent,
            targetPrice,
          );
          if (nudgedPrice !== null) {
            finalPrice = this.applyRounding(nudgedPrice);
            reason = "Nudge applied - Within strategy";
          } else {
            reason = "Within strategy (nudge exceeds tolerance bounds)";
          }
        }
      } else {
        const nudgedPrice = this.applyDownNudge(
          stock.current_price,
          refVal,
          targetPercent,
          targetPrice,
        );
        if (nudgedPrice !== null) {
          finalPrice = this.applyRounding(nudgedPrice);
          reason = "Nudge applied - Within strategy";
        } else {
          reason = "Within strategy";
        }
      }

      return {
        stock_id: stock.stock_id,
        current_price: stock.current_price,
        reference_price: refVal,
        matrix_percent: matrixPercent,
        live_market_impact: liveMarketImpact,
        live_market_band: liveMarketBand,
        live_market_condition: stock.live_market_condition,
        target_percent: targetPercent,
        target_price: targetPrice,
        new_price: finalPrice,
        reason: reason,
        age_days: stock.age_days,
        at_rating: stock.rating_band,
        days_since_last_change: stock.days_since_last_change,
      };
    } catch (error) {
      return {
        stock_id: stock.stock_id,
        current_price: stock.current_price,
        reference_price: 0,
        matrix_percent: 0,
        live_market_impact: 0,
        live_market_band: "",
        live_market_condition: stock.live_market_condition,
        target_percent: 0,
        target_price: 0,
        new_price: stock.current_price,
        reason: `Data Error: ${error.message}`,
        age_days: stock.age_days,
        at_rating: stock.rating_band,
        days_since_last_change: stock.days_since_last_change,
      };
    }
  }

  processStocks(stocks) {
    return stocks.map((stock) => this.calculateNewPrice(stock));
  }
}

function parseFloat_safe(val) {
  if (!val) return 0;
  try {
    const cleaned = String(val).replace(/,/g, "").replace(/[£$]/g, "").trim();
    return parseFloat(cleaned);
  } catch {
    return 0;
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file");
    const configStr = formData.get("config");
    const optionsStr = formData.get("options");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!configStr) {
      return Response.json(
        { error: "No configuration provided" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const config = JSON.parse(configStr);

    let processOptions = { includePriceUp: true, includePriceDown: true };
    if (optionsStr) {
      try {
        const parsed = JSON.parse(optionsStr);
        processOptions = {
          includePriceUp: parsed.includePriceUp !== false,
          includePriceDown: parsed.includePriceDown !== false,
        };
      } catch {
        return Response.json(
          { error: "Invalid processing options" },
          { status: 400 },
        );
      }
    }

    if (!processOptions.includePriceUp && !processOptions.includePriceDown) {
      return Response.json(
        { error: "Select at least one price direction" },
        { status: 400 },
      );
    }

    const strategyConfig = Array.isArray(config) ? config[0] : config;
    const configItems = await Configuration.find();
    const globalConfig = configItems.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }),
      {},
    );

    const fullConfig = {
      ...strategyConfig,
      ...globalConfig,
      live_market_bands:
        strategyConfig.live_market_bands?.length > 0
          ? strategyConfig.live_market_bands
          : defaultConfig.live_market_bands,
    };

    // Parse CSV using Papa Parse
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    const records = parsed.data.filter((row) =>
      Object.values(row).some((v) => v),
    );

    // Validate and filter records for required fields
    const validRecords = [];
    const invalidRecords = [];

    for (const record of records) {
      // Try to find stock_id (multiple possible column names)
      const stockId =
        record.VRM ||
        record["stock_id"] ||
        record["Stock ID"] ||
        record["SKU"] ||
        record["ID"] ||
        record.id;

      // Try to find current_price (handle £ symbol and commas)
      let priceStr =
        record["Retail price"] ||
        record["current_price"] ||
        record["Current Price"] ||
        record["Price"] ||
        "";
      let currentPrice = 0;
      if (priceStr) {
        // Remove £ symbol and commas, then convert to float
        currentPrice = parseFloat(String(priceStr).replace(/[£,]/g, ""));
      }

      // Try to find age (can be Days in stock, Mileage, age_days, or age)
      let ageValue =
        record["Days in stock"] ||
        record["Mileage"] ||
        record["age_days"] ||
        record["age"] ||
        record["Age Days"] ||
        record["Age"] ||
        0;
      const age = parseFloat(String(ageValue).replace(/[,]/g, "")) || 0;

      // Auto Trader Retail Rating — exact column only, no fallbacks
      const ratingRaw = record["Auto Trader Retail Rating"];
      let rating = null;
      if (
        ratingRaw !== undefined &&
        ratingRaw !== null &&
        String(ratingRaw).trim() !== "" &&
        String(ratingRaw).trim().toLowerCase() !== "nan" &&
        String(ratingRaw).trim() !== "None"
      ) {
        const numVal = Number(String(ratingRaw).replace(/[,]/g, "").trim());
        if (!Number.isNaN(numVal)) {
          rating = numVal;
        }
      }

      // Live market condition — exact column only, strip trailing %
      const liveMarketRaw = record["Live market condition"];
      let liveMarketCondition = null;
      if (
        liveMarketRaw !== undefined &&
        liveMarketRaw !== null &&
        String(liveMarketRaw).trim() !== "" &&
        String(liveMarketRaw).trim().toLowerCase() !== "nan" &&
        String(liveMarketRaw).trim() !== "None"
      ) {
        const numVal = Number(
          String(liveMarketRaw).replace(/%/g, "").replace(/,/g, "").trim(),
        );
        if (!Number.isNaN(numVal)) {
          liveMarketCondition = numVal;
        }
      }

      // Validation with more detailed error messages
      const errors = [];
      if (!stockId) errors.push("Missing VRM/ID");
      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0)
        errors.push("Invalid/missing price");
      if (age === 0 || isNaN(age)) errors.push("Invalid/missing age/mileage");
      if (rating === null)
        errors.push("Invalid/missing Auto Trader Retail Rating");
      if (liveMarketCondition === null)
        errors.push("Invalid/missing Live market condition");

      if (errors.length > 0) {
        invalidRecords.push({
          stock_id: stockId || "MISSING",
          current_price: currentPrice,
          reason: `Data Error: ${errors.join(", ")}`,
        });
        continue;
      }

      // Add defaults for fields used by the pricing engine
      // NaN means new record with no previous price change — these should be processed, not skipped
      const rawDaysValue = record["Days since last price change"];
      const days_since_last_change =
        rawDaysValue != null &&
        String(rawDaysValue).trim() !== "" &&
        String(rawDaysValue).trim().toLowerCase() !== "nan"
          ? parseInt(rawDaysValue) || 0
          : NaN;
      const reference_price = currentPrice; // Will be calculated by engine, use current as fallback

      validRecords.push({
        ...record,
        stock_id: stockId,
        current_price: currentPrice,
        age_days: age,
        rating: rating,
        rating_band: rating, // numeric rating for getRatingBandFromValue to process
        at_rating: rating,
        live_market_condition: liveMarketCondition,
        days_since_last_change: days_since_last_change,
        reference_price: reference_price,
      });
    }

    const lowerThreshold =
      fullConfig.lower_threshold != null
        ? Number(fullConfig.lower_threshold)
        : 400;

    const engine = new PricingEngine(fullConfig);
    const validResults = engine
      .processStocks(validRecords)
      .map((result) =>
        applyDirectionFilter(
          result,
          processOptions.includePriceUp,
          processOptions.includePriceDown,
        ),
      )
      .map((result) => applyLowerThreshold(result, lowerThreshold));

    // Combine valid results with invalid records (marked with data errors)
    const results = [...validResults, ...invalidRecords];

    const count = results.filter(
      (item) =>
        typeof item.reason === "string" && item.reason.startsWith("Data Error"),
    ).length;

    console.log("Data Error count:", count);

    const exportResults = filterResultsForExport(results, processOptions);
    const blockedResults = filterBlockedResults(results);
    const csv = buildCsvFromResults(exportResults);
    const blockedCsv =
      blockedResults.length > 0
        ? buildBlockedCsvFromResults(blockedResults)
        : null;

    const statistics = calculateResultStatistics(results);

    return Response.json({
      ...statistics,
      csv,
      blockedCsv,
      blockedCount: blockedResults.length,
      results,
      processOptions,
      lowerThreshold,
    });
  } catch (error) {
    console.error("Processing error:", error);
    return Response.json(
      { error: error.message || "Processing failed" },
      { status: 500 },
    );
  }
}
2;
