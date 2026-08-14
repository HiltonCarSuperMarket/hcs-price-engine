export const BLOCKED_REASON = "Blocked as exceeded lower threshold";

/** Parse a live-market min/max; blank/null/NaN => open-ended */
export function parseLiveMarketBound(raw, openValue) {
  if (raw === undefined || raw === null || raw === "") return openValue;
  const n = Number(String(raw).replace(/%/g, "").trim());
  return Number.isNaN(n) ? openValue : n;
}

/**
 * Resolve effective [min, max] for a live market band.
 * - Empty bound => open-ended (-∞ / +∞)
 * - Leftover default 0 on the opposite side of a signed bound is treated as open
 *   (e.g. min:0 max:-43 => -∞ .. -43 for "or lower")
 * - Reversed finite bounds are swapped
 */
export function getLiveMarketBandRange(band) {
  let bMin = parseLiveMarketBound(band?.min, -Infinity);
  let bMax = parseLiveMarketBound(band?.max, Infinity);

  // New-band UI used to default min/max to 0. If only one side was edited,
  // the leftover 0 must not close an "or lower" / "or higher" range.
  const minProvided =
    band?.min !== undefined && band?.min !== null && band?.min !== "";
  const maxProvided =
    band?.max !== undefined && band?.max !== null && band?.max !== "";

  if (minProvided && bMin === 0 && maxProvided && bMax < 0) {
    bMin = -Infinity;
  }
  if (maxProvided && bMax === 0 && minProvided && bMin > 0) {
    bMax = Infinity;
  }

  if (bMin > bMax) {
    const tmp = bMin;
    bMin = bMax;
    bMax = tmp;
  }

  return { min: bMin, max: bMax };
}

function formatLiveMarketRange(band) {
  const { min, max } = getLiveMarketBandRange(band);
  const loLabel = min === -Infinity ? "-∞" : min;
  const hiLabel = max === Infinity ? "+∞" : max;
  return `${band.name} [${loLabel} .. ${hiLabel}]`;
}

/** Find Live Market impact for a numeric condition value */
export function resolveLiveMarketImpact(liveMarketValue, bands = []) {
  const value = Number(
    String(liveMarketValue ?? "")
      .replace(/%/g, "")
      .replace(/,/g, "")
      .trim(),
  );
  if (Number.isNaN(value)) {
    throw new Error(`Invalid live market condition '${liveMarketValue}'`);
  }

  for (const band of bands) {
    const { min: bMin, max: bMax } = getLiveMarketBandRange(band);
    if (value >= bMin && value <= bMax) {
      const impactNum = Number(band.impact);
      return {
        impact: Number.isNaN(impactNum) ? 0 : impactNum,
        bandName: band.name,
      };
    }
  }

  const ranges = (bands || []).map(formatLiveMarketRange).join("; ");

  throw new Error(
    `Live market condition '${value}' not found in live market bands (${ranges || "none configured"})`,
  );
}

/** Normalize live market bands before save/process */
export function sanitizeLiveMarketBands(bands = []) {
  return bands.map((b) => {
    const cleaned = { name: b.name || "Band", impact: 0 };
    const impactNum = Number(b.impact);
    cleaned.impact = Number.isNaN(impactNum) ? 0 : impactNum;

    let minNum;
    let maxNum;
    if (b.min !== undefined && b.min !== null && b.min !== "") {
      const n = Number(b.min);
      if (!Number.isNaN(n)) minNum = n;
    }
    if (b.max !== undefined && b.max !== null && b.max !== "") {
      const n = Number(b.max);
      if (!Number.isNaN(n)) maxNum = n;
    }

    // Drop leftover default 0 that closes an open-ended signed range
    if (minNum === 0 && maxNum != null && maxNum < 0) {
      minNum = undefined;
    }
    if (maxNum === 0 && minNum != null && minNum > 0) {
      maxNum = undefined;
    }

    if (minNum !== undefined) cleaned.min = minNum;
    if (maxNum !== undefined) cleaned.max = maxNum;
    return cleaned;
  });
}

/** Read a matrix cell that may be a number (legacy) or { value, applyLiveMarket } */
export function parseMatrixCell(cell) {
  if (cell == null || cell === "") {
    return { value: null, applyLiveMarket: false };
  }

  if (typeof cell === "object" && !Array.isArray(cell)) {
    const raw = cell.value;
    const value =
      raw === null || raw === undefined || raw === ""
        ? null
        : Number(raw);
    return {
      value: value != null && !Number.isNaN(value) ? value : null,
      applyLiveMarket: !!cell.applyLiveMarket,
    };
  }

  const value = Number(cell);
  return {
    value: Number.isNaN(value) ? null : value,
    applyLiveMarket: false,
  };
}

export function getPriceChange(result) {
  return (result.new_price ?? 0) - (result.current_price ?? 0);
}

export function isBlockedResult(result) {
  return result.reason === BLOCKED_REASON;
}

/** Block decreases that exceed the configured lower threshold */
export function applyLowerThreshold(result, lowerThreshold) {
  if (result.reason?.startsWith("Data Error")) return result;
  if (!lowerThreshold || lowerThreshold <= 0) return result;

  const change = getPriceChange(result);
  if (change >= 0) return result;

  const decreaseAmount = -change;
  if (decreaseAmount > lowerThreshold) {
    return {
      ...result,
      blocked_new_price: result.new_price,
      blocked_amount: decreaseAmount,
      new_price: result.current_price,
      reason: BLOCKED_REASON,
    };
  }

  return result;
}

/** Classify a processed result by price direction */
export function classifyPriceDirection(result) {
  if (result.reason?.includes("Data Error")) return "error";
  const change = getPriceChange(result);
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "none";
}

/** Build dashboard statistics aligned with export direction logic */
export function calculateResultStatistics(results) {
  const totalStocks = results.length;

  const dataIssues = results.filter((r) =>
    r.reason?.includes("Data Error"),
  ).length;

  const notChange = results.filter((r) => {
    if (r.reason?.includes("Data Error")) return false;
    if (isBlockedResult(r)) return false;
    return getPriceChange(r) === 0;
  }).length;

  const blocked = results.filter(isBlockedResult).length;

  const priceIncrease = results.filter((r) => {
    const change = getPriceChange(r);
    return change > 0 && r.reason?.includes("Increase to target");
  }).length;

  const priceDecrease = results.filter((r) => {
    const change = getPriceChange(r);
    return change < 0 && r.reason?.includes("Decrease to target");
  }).length;

  const totalWithinStrategy = results.filter((r) =>
    r.reason?.includes("Within strategy"),
  ).length;

  const increaseWithinStrategy = results.filter((r) => {
    const change = getPriceChange(r);
    return change > 0 && r.reason?.includes("Nudge applied");
  }).length;

  const decreaseWithinStrategy = results.filter((r) => {
    const change = getPriceChange(r);
    return change < 0 && r.reason?.includes("Nudge applied");
  }).length;

  const totalIncrement = results.reduce((sum, r) => {
    const change = getPriceChange(r);
    return sum + (change > 0 ? change : 0);
  }, 0);

  const totalDrop = results.reduce((sum, r) => {
    const change = getPriceChange(r);
    return sum + (change < 0 ? -change : 0);
  }, 0);

  const netImpact = totalIncrement - totalDrop;

  const increaseToTargetAmount = results.reduce((sum, r) => {
    if (r.reason?.includes("Increase to target")) {
      return sum + getPriceChange(r);
    }
    return sum;
  }, 0);

  const decreaseToTargetAmount = results.reduce((sum, r) => {
    if (r.reason?.includes("Decrease to target")) {
      return sum + getPriceChange(r);
    }
    return sum;
  }, 0);

  const staleNudgeIncreaseAmount = results.reduce((sum, r) => {
    const change = getPriceChange(r);
    if (r.reason?.includes("Nudge applied") && change > 0) {
      return sum + change;
    }
    return sum;
  }, 0);

  const staleNudgeDecreaseAmount = results.reduce((sum, r) => {
    const change = getPriceChange(r);
    if (r.reason?.includes("Nudge applied") && change < 0) {
      return sum + change;
    }
    return sum;
  }, 0);

  return {
    stats: {
      total_drop: totalDrop,
      total_increment: totalIncrement,
      net_impact: netImpact,
      increase_to_target_amount: increaseToTargetAmount,
      decrease_to_target_amount: decreaseToTargetAmount,
      stale_nudge_increase_amount: staleNudgeIncreaseAmount,
      stale_nudge_decrease_amount: staleNudgeDecreaseAmount,
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
      blocked,
    },
    sample_results: results.slice(0, 10),
  };
}

/** Apply price-direction filter after engine calculation */
export function applyDirectionFilter(result, includePriceUp, includePriceDown) {
  if (result.reason?.startsWith("Data Error")) return result;

  const change = getPriceChange(result);

  if (change > 0 && !includePriceUp) {
    return {
      ...result,
      new_price: result.current_price,
      reason: "Within strategy (price up excluded)",
    };
  }

  if (change < 0 && !includePriceDown) {
    return {
      ...result,
      new_price: result.current_price,
      reason: "Within strategy (price down excluded)",
    };
  }

  return result;
}

/** Filter results for CSV export based on selected directions (excludes blocked) */
export function filterResultsForExport(results, options) {
  const { includePriceUp = true, includePriceDown = true } = options;

  const eligible = results.filter((r) => !isBlockedResult(r));

  if (includePriceUp && includePriceDown) return eligible;

  return eligible.filter((r) => {
    const dir = classifyPriceDirection(r);
    if (dir === "up") return includePriceUp;
    if (dir === "down") return includePriceDown;
    return false;
  });
}

/** Results blocked by lower threshold — for separate download */
export function filterBlockedResults(results) {
  return results.filter(isBlockedResult);
}

export function buildCsvFromResults(results) {
  const csvLines = [
    [
      "stock_id",
      "current_price",
      "reference_price",
      "matrix_percent",
      "live_market_impact",
      "target_percent",
      "target_price",
      "new_price",
      "Amount change",
      "Days in Stock",
      "AT Rating",
      "Live market condition",
      "Days since last price change",
      "reason",
    ].join(","),
    ...results.map((r) => {
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
          "",
          "",
          "",
          "",
          `"${r.reason}"`,
        ].join(",");
      }

      const amountChange = r.new_price - r.current_price;
      const matrixPercent =
        r.matrix_percent != null ? r.matrix_percent : r.target_percent;
      const impact = r.live_market_impact != null ? r.live_market_impact : 0;
      return [
        r.stock_id,
        Math.round(r.current_price || 0),
        Math.round(r.reference_price || 0),
        `${Number(matrixPercent).toFixed(2)}%`,
        Number(impact).toFixed(2),
        `${Number(r.target_percent).toFixed(2)}%`,
        Math.round(r.target_price || 0),
        Math.round(r.new_price || 0),
        amountChange.toFixed(0),
        r.age_days || "",
        r.at_rating || "",
        r.live_market_condition != null ? r.live_market_condition : "",
        r.days_since_last_change ?? "",
        `"${r.reason || "Unknown"}"`,
      ].join(",");
    }),
  ];
  return csvLines.join("\n");
}

export function buildBlockedCsvFromResults(results) {
  const csvLines = [
    [
      "stock_id",
      "current_price",
      "reference_price",
      "matrix_percent",
      "live_market_impact",
      "target_percent",
      "target_price",
      "intended_new_price",
      "blocked_amount",
      "Days in Stock",
      "AT Rating",
      "Live market condition",
      "Days since last price change",
      "reason",
    ].join(","),
    ...results.map((r) => {
      const matrixPercent =
        r.matrix_percent != null ? r.matrix_percent : r.target_percent;
      const impact = r.live_market_impact != null ? r.live_market_impact : 0;
      return [
        r.stock_id,
        Math.round(r.current_price || 0),
        Math.round(r.reference_price || 0),
        `${Number(matrixPercent).toFixed(2)}%`,
        Number(impact).toFixed(2),
        `${Number(r.target_percent).toFixed(2)}%`,
        Math.round(r.target_price || 0),
        Math.round(r.blocked_new_price || 0),
        Math.round(r.blocked_amount || 0),
        r.age_days || "",
        r.at_rating || "",
        r.live_market_condition != null ? r.live_market_condition : "",
        r.days_since_last_change ?? "",
        `"${r.reason || BLOCKED_REASON}"`,
      ].join(",");
    }),
  ];
  return csvLines.join("\n");
}
