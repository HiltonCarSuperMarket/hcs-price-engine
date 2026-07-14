import Papa from "papaparse";
import connectDB from "@/lib/mongodb";
import { Configuration } from "@/lib/models";
import { parseRoundingDigits, roundToEndingDigits } from "@/lib/roundingUtils";
import {
  applyDirectionFilter,
  buildCsvFromResults,
  calculateResultStatistics,
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

    const targetPercent = this.config.target_matrix[ageBand][ratingBand];
    const targetPrice = refVal * (targetPercent / 100);

    return { refVal, targetPercent, targetPrice };
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
      const { refVal, targetPercent, targetPrice } =
        this.calculateTarget(stock);

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

      // Try to find rating (Auto Trader Retail Rating is most common, can also use numeric values from Performance rating score)
      let ratingValue =
        record["Auto Trader Retail Rating"] ||
        record["rating"] ||
        record["Rating"] ||
        record["at_rating"];
      let rating = 0;

      if (
        ratingValue !== undefined &&
        ratingValue !== null &&
        ratingValue !== "None" &&
        String(ratingValue).trim() !== ""
      ) {
        const numVal = Number(String(ratingValue).replace(/[,]/g, ""));
        if (!Number.isNaN(numVal)) {
          rating = numVal; // keep original numeric value, no scale change
        }
      }

      // If no rating found from Auto Trader, try Performance rating score
      if (rating === 0) {
        let perfScore = record["Performance rating score"] || 0;
        if (perfScore && String(perfScore).trim() !== "") {
          const numVal = parseFloat(String(perfScore).replace(/[,]/g, ""));
          if (!isNaN(numVal) && numVal > 0) {
            rating = numVal;
          }
        }
      }

      // If still no numeric rating, try to extract from Performance rating text
      if (rating === 0) {
        let perfRating = record["Performance rating"] || "";
        const ratingStr = String(perfRating).toLowerCase();
        if (ratingStr.includes("low") || ratingStr === "poor") rating = 25;
        else if (ratingStr.includes("below average")) rating = 45;
        else if (ratingStr.includes("average") && !ratingStr.includes("above"))
          rating = 50;
        else if (ratingStr.includes("above average")) rating = 70;
        else if (ratingStr.includes("high") || ratingStr.includes("excellent"))
          rating = 90;
      }

      // Validation with more detailed error messages
      const errors = [];
      if (!stockId) errors.push("Missing VRM/ID");
      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0)
        errors.push("Invalid/missing price");
      if (age === 0 || isNaN(age)) errors.push("Invalid/missing age/mileage");
      // Allow rating to be 0 if all other fields are valid (will use default rating band)

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
        days_since_last_change: days_since_last_change,
        reference_price: reference_price,
      });
    }

    const engine = new PricingEngine(fullConfig);
    const validResults = engine
      .processStocks(validRecords)
      .map((result) =>
        applyDirectionFilter(
          result,
          processOptions.includePriceUp,
          processOptions.includePriceDown,
        ),
      );

    // Combine valid results with invalid records (marked with data errors)
    const results = [...validResults, ...invalidRecords];

    const count = results.filter(
      (item) =>
        typeof item.reason === "string" && item.reason.startsWith("Data Error"),
    ).length;

    console.log("Data Error count:", count);

    const exportResults = filterResultsForExport(results, processOptions);
    const csv = buildCsvFromResults(exportResults);

    const statistics = calculateResultStatistics(results);

    return Response.json({
      ...statistics,
      csv,
      results,
      processOptions,
    });
  } catch (error) {
    console.error("Processing error:", error);
    return Response.json(
      { error: error.message || "Processing failed" },
      { status: 500 },
    );
  }
}
