const ORDINALS = ["th", "st", "nd", "rd"];

function ordinal(n) {
  const v = n % 100;
  return n + (ORDINALS[(v - 20) % 10] || ORDINALS[v] || ORDINALS[0]);
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Format a Date as display string e.g. "22nd June (Monday)" */
export function formatDateStr(date) {
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const weekday = WEEKDAYS[date.getDay()];
  return `${ordinal(day)} ${month} (${weekday})`;
}

/** Format Date as YYYY-MM-DD in local timezone */
export function toDateIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build a daily summary log payload from processing results */
export function buildLogFromResults(results) {
  const { stats, summary } = results;

  const noChange = summary?.not_change || 0;
  const pcUp = summary?.price_increase || 0;
  const pcDown = summary?.price_decrease || 0;
  const prUp = 0;
  const prDown = summary?.decrease_within_strategy || 0;
  const issues = summary?.data_issues || 0;
  const increase = Math.round(stats?.total_increment || 0);
  const drop = -Math.round(stats?.total_drop || 0);
  const net = Math.round(stats?.net_impact || 0);

  return {
    units: summary?.total_stocks || 0,
    noChange,
    pcUp,
    pcDown,
    prUp,
    prDown,
    issues,
    drop,
    increase,
    net,
  };
}

export const METRIC_OPTIONS = [
  { key: "units", label: "Total Units" },
  { key: "noChange", label: "No Change Count" },
  { key: "noChangePct", label: "No Change %" },
  { key: "pcUp", label: "Price Change (Up)" },
  { key: "pcDown", label: "Price Change (Down)" },
  { key: "prUp", label: "Price Refresh (Up)" },
  { key: "prDown", label: "Price Refresh (Down)" },
  { key: "modifiedCount", label: "Total Modified Items" },
  { key: "issues", label: "Data Issues" },
  { key: "drop", label: "Total Price Drop (£)" },
  { key: "increase", label: "Total Price Increase (£)" },
  { key: "net", label: "Net Financial Impact (£)" },
  { key: "changeIntensity", label: "Change Intensity (%)" },
  { key: "refreshRatio", label: "Refresh vs Change Ratio" },
];

export function enrichLog(row) {
  const modifiedCount = row.pcUp + row.pcDown + row.prUp + row.prDown;
  const noChangePct = row.units > 0 ? (row.noChange / row.units) * 100 : 0;
  const changeIntensity =
    row.units > 0 ? (modifiedCount / row.units) * 100 : 0;
  const priceChangeTotal = row.pcUp + row.pcDown;
  const refreshTotal = row.prUp + row.prDown;
  const refreshRatio =
    priceChangeTotal > 0 ? refreshTotal / priceChangeTotal : refreshTotal;

  const date = new Date(row.dateIso + "T12:00:00");
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    ...row,
    modifiedCount,
    noChangePct,
    changeIntensity,
    refreshRatio,
    isWeekend,
    dayName: WEEKDAYS[dayOfWeek],
  };
}

/** Pearson correlation coefficient between two numeric arrays */
export function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);

  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return null;
  return num / den;
}

export function aggregateLogs(logs) {
  const enriched = logs.map(enrichLog);

  let totalUnits = 0;
  let totalNoChange = 0;
  let totalPCUp = 0;
  let totalPCDown = 0;
  let totalPRUp = 0;
  let totalPRDown = 0;
  let totalDrop = 0;
  let totalIncrease = 0;
  let totalNet = 0;
  let totalIssues = 0;

  enriched.forEach((row) => {
    totalUnits += row.units;
    totalNoChange += row.noChange;
    totalPCUp += row.pcUp;
    totalPCDown += row.pcDown;
    totalPRUp += row.prUp;
    totalPRDown += row.prDown;
    totalDrop += row.drop;
    totalIncrease += row.increase;
    totalNet += row.net;
    totalIssues += row.issues;
  });

  const weekendLogs = enriched.filter((r) => r.isWeekend);
  const weekdayLogs = enriched.filter((r) => !r.isWeekend);

  const avgNet = (arr) =>
    arr.length ? arr.reduce((s, r) => s + r.net, 0) / arr.length : 0;

  return {
    enriched,
    totals: {
      units: totalUnits,
      noChange: totalNoChange,
      noChangePct: totalUnits > 0 ? (totalNoChange / totalUnits) * 100 : 0,
      pcUp: totalPCUp,
      pcDown: totalPCDown,
      prUp: totalPRUp,
      prDown: totalPRDown,
      drop: totalDrop,
      increase: totalIncrease,
      net: totalNet,
      issues: totalIssues,
      modifiedUp: totalPCUp,
      modifiedDown: totalPCDown + totalPRDown,
    },
    weekendAvgNet: avgNet(weekendLogs),
    weekdayAvgNet: avgNet(weekdayLogs),
    weekendCount: weekendLogs.length,
    weekdayCount: weekdayLogs.length,
  };
}

export function formatCurrency(value, signed = false) {
  const abs = Math.abs(Math.round(value));
  const formatted = `£${abs.toLocaleString("en-GB")}`;
  if (!signed) return formatted;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}
