/** Classify a processed result by price direction */
export function classifyPriceDirection(result) {
  if (result.reason?.includes("Data Error")) return "error";
  const change = result.new_price - result.current_price;
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "none";
}

/** Apply price-direction filter after engine calculation */
export function applyDirectionFilter(result, includePriceUp, includePriceDown) {
  if (result.reason?.startsWith("Data Error")) return result;

  const change = result.new_price - result.current_price;

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

/** Filter results for CSV export based on selected directions */
export function filterResultsForExport(results, options) {
  const { includePriceUp = true, includePriceDown = true } = options;

  if (includePriceUp && includePriceDown) return results;

  return results.filter((r) => {
    const dir = classifyPriceDirection(r);
    if (dir === "up") return includePriceUp;
    if (dir === "down") return includePriceDown;
    return false;
  });
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
