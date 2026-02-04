import Papa from "papaparse";

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

  isWithinStrategy(price, refPrice, targetPercent) {
    const targetPrice = refPrice * (targetPercent / 100);

    if (this.config.tolerance_type === "percent") {
      const currentPercent = (price / refPrice) * 100;
      const diff = Math.abs(currentPercent - targetPercent);
      return diff <= this.config.tolerance_value;
    } else {
      const diff = Math.abs(price - targetPrice);
      return diff <= this.config.tolerance_value;
    }
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
    } else if (this.config.rounding_mode === "ends_with_4_9") {
      const val = Math.round(price);
      const center = Math.floor(val);
      const candidates = [];

      for (let i = center - 10; i <= center + 10; i++) {
        if (i < 0) continue;
        const s = String(i);
        if (s.endsWith("4") || s.endsWith("9")) {
          candidates.push(i);
        }
      }

      if (candidates.length === 0) return center;
      return candidates.reduce((prev, curr) =>
        Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
      );
    }

    return price;
  }

  calculateNewPrice(stock) {
    try {
      const { refVal, targetPercent, targetPrice } =
        this.calculateTarget(stock);
      const withinStrategy = this.isWithinStrategy(
        stock.current_price,
        refVal,
        targetPercent,
      );

      let finalPrice = stock.current_price;
      let reason = "No change";

      if (withinStrategy) {
        if (stock.days_since_last_change >= this.config.stale_days) {
          const nudgeAmt =
            this.config.nudge_type === "percent"
              ? refVal * (this.config.nudge_value / 100)
              : this.config.nudge_value;

          let lowerLimit, upperLimit;
          if (this.config.tolerance_type === "percent") {
            lowerLimit =
              refVal * ((targetPercent - this.config.tolerance_value) / 100);
            upperLimit =
              refVal * ((targetPercent + this.config.tolerance_value) / 100);
          } else {
            lowerLimit = targetPrice - this.config.tolerance_value;
            upperLimit = targetPrice + this.config.tolerance_value;
          }

          const priceDrop = stock.current_price - nudgeAmt;
          const priceAdd = stock.current_price + nudgeAmt;

          const dropValid = priceDrop >= lowerLimit && priceDrop <= upperLimit;
          const addValid = priceAdd >= lowerLimit && priceAdd <= upperLimit;

          let bestNudge = null;
          const pref = (this.config.nudge_preference || "drop").toLowerCase();

          if (pref === "drop") {
            bestNudge = dropValid ? priceDrop : addValid ? priceAdd : null;
          } else if (pref === "add") {
            bestNudge = addValid ? priceAdd : dropValid ? priceDrop : null;
          } else {
            bestNudge = dropValid ? priceDrop : addValid ? priceAdd : null;
          }

          if (bestNudge) {
            finalPrice = this.applyRounding(bestNudge);
            reason = `Stale nudge (${stock.days_since_last_change} days) - Within strategy`;
          } else {
            reason = `Within strategy (Stale ${stock.days_since_last_change} days but nudge fails tolerance)`;
          }
        } else {
          reason = "Within strategy";
        }
      } else {
        const roundedTarget = this.applyRounding(targetPrice);
        finalPrice = roundedTarget;

        if (finalPrice > stock.current_price) {
          reason = `Increase to target (${targetPercent}%)`;
        } else if (finalPrice < stock.current_price) {
          reason = `Decrease to target (${targetPercent}%)`;
        } else {
          reason = "Price OK (Rounded)";
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

function calculateStatistics(results) {
  const totalStocks = results.length;
  const notChange = results.filter(
    (r) => r.reason === "Within strategy",
  ).length;
  const priceIncrease = results.filter(
    (r) => r.reason && r.reason.includes("Increase to target"),
  ).length;
  const priceDecrease = results.filter(
    (r) => r.reason && r.reason.includes("Decrease to target"),
  ).length;
  const totalWithinStrategy = results.filter(
    (r) => r.reason && r.reason.includes("Within strategy"),
  ).length;
  const increaseWithinStrategy = results.filter(
    (r) =>
      r.reason &&
      r.reason.includes("Stale nudge") &&
      r.new_price - r.current_price > 0,
  ).length;
  const decreaseWithinStrategy = results.filter(
    (r) =>
      r.reason &&
      r.reason.includes("Stale nudge") &&
      r.new_price - r.current_price <= 0,
  ).length;
  const dataIssues = results.filter(
    (r) => r.reason && r.reason.includes("Data Error"),
  ).length;

  const totalIncrement = results.reduce((sum, r) => {
    const change = r.new_price - r.current_price;
    return sum + (change > 0 ? change : 0);
  }, 0);
  const totalDrop = results.reduce((sum, r) => {
    const change = r.new_price - r.current_price;
    return sum + (change < 0 ? -change : 0);
  }, 0);
  const netImpact = totalIncrement - totalDrop;

  return {
    stats: {
      total_drop: totalDrop,
      total_increment: totalIncrement,
      net_impact: netImpact,
    },
    summary: {
      total_stocks: totalStocks,
      within_strategy: notChange,
      optimized: increaseWithinStrategy + decreaseWithinStrategy,
      increases: priceIncrease,
      decreases: priceDecrease,
      data_issues: dataIssues,
      total_within_strategy: totalWithinStrategy,
      increase_within_strategy: increaseWithinStrategy,
      decrease_within_strategy: decreaseWithinStrategy,
      not_change: notChange,
      price_increase: priceIncrease,
      price_decrease: priceDecrease,
    },
    sample_results: results.slice(0, 10),
  };
}
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const configStr = formData.get("config");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const config = JSON.parse(configStr);

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
      const days_since_last_change =
        parseInt(record["Days since last price change"] || 0) || 0;
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

    // Merge with default config if needed
    const fullConfig = {
      ...config[0],
    };

    // console.log(JSON.stringify(fullConfig, null, 2));

    const engine = new PricingEngine(fullConfig);
    const validResults = engine.processStocks(validRecords);

    // Combine valid results with invalid records (marked with data errors)
    const results = [...validResults, ...invalidRecords];

    const count = results.filter(
      (item) =>
        typeof item.reason === "string" && item.reason.startsWith("Data Error"),
    ).length;

    console.log("Data Error count:", count);

    // Convert results to CSV format with all required columns
    const csvLines = [
      [
        "stock_id",
        "current_price",
        "reference_price",
        "target_percent",
        "target_price",
        "new_price",
        "Amount change",
        "Days in Stock",
        "AT Rating",
        "reason",
      ].join(","),
      ...results.map((r) => {
        // Handle data error records that don't have all fields
        if (r.reason && r.reason.startsWith("Data Error")) {
          return [
            r.stock_id || "MISSING",
            r.current_price || "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            `"${r.reason}"`,
          ].join(",");
        }

        const amountChange = r.new_price - r.current_price;
        return [
          r.stock_id,
          Math.round(r.current_price || 0),
          Math.round(r.reference_price || 0),
          `${r.target_percent.toFixed(2)}%`,
          Math.round(r.target_price || 0),
          Math.round(r.new_price || 0),
          amountChange.toFixed(0),
          r.age_days || "",
          r.at_rating || "",
          `"${r.reason || "Unknown"}"`,
        ].join(",");
      }),
    ];
    const csv = csvLines.join("\n");

    const statistics = calculateStatistics(results);

    return Response.json({
      ...statistics,
      csv,
      results,
    });
  } catch (error) {
    console.error("Processing error:", error);
    return Response.json(
      { error: error.message || "Processing failed" },
      { status: 500 },
    );
  }
}
