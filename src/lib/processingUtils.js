export const BLOCKED_REASON = "Blocked as exceeded lower threshold";

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
      "target_percent",
      "target_price",
      "new_price",
      "Amount change",
      "Days in Stock",
      "AT Rating",
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
      "target_percent",
      "target_price",
      "intended_new_price",
      "blocked_amount",
      "Days in Stock",
      "AT Rating",
      "Days since last price change",
      "reason",
    ].join(","),
    ...results.map((r) => [
      r.stock_id,
      Math.round(r.current_price || 0),
      Math.round(r.reference_price || 0),
      `${r.target_percent.toFixed(2)}%`,
      Math.round(r.target_price || 0),
      Math.round(r.blocked_new_price || 0),
      Math.round(r.blocked_amount || 0),
      r.age_days || "",
      r.at_rating || "",
      r.days_since_last_change ?? "",
      `"${r.reason || BLOCKED_REASON}"`,
    ].join(",")),
  ];
  return csvLines.join("\n");
}
