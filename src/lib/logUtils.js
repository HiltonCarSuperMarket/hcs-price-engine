import { BLOCKED_REASON, getPriceChange, isBlockedResult } from "@/lib/processingUtils";

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

/**
 * Classify a processed result for log storage.
 * Returns null for No Change (and other non-logged outcomes).
 */
export function classifyLogRecord(result) {
  if (!result) return null;
  if (isBlockedResult(result) || result.reason === BLOCKED_REASON) {
    return "blocked";
  }
  if (result.reason?.includes("Data Error")) return "issue";

  const change = getPriceChange(result);
  const reason = result.reason || "";

  if (change > 0) {
    if (
      reason.includes("Increase to target") ||
      reason.includes("Nudge applied")
    ) {
      return "pc_up";
    }
  }

  if (change < 0) {
    if (reason.includes("Decrease to target")) return "pc_down";
    if (reason.includes("Nudge applied")) return "pr_down";
  }

  return null;
}

/** Build persistable log rows from process results (skips No Change) */
export function buildLogRecordsFromResults(results = []) {
  const rows = [];

  for (const r of results) {
    const category = classifyLogRecord(r);
    if (!category) continue;

    const amountChange = getPriceChange(r);
    rows.push({
      category,
      stock_id: r.stock_id || r.input?.stock_id || "",
      current_price: r.current_price ?? null,
      reference_price: r.reference_price ?? null,
      matrix_percent: r.matrix_percent ?? null,
      live_market_impact: r.live_market_impact ?? null,
      live_market_band: r.live_market_band || "",
      live_market_condition: r.live_market_condition ?? null,
      target_percent: r.target_percent ?? null,
      target_price: r.target_price ?? null,
      new_price: r.new_price ?? null,
      amount_change: amountChange,
      age_days: r.age_days ?? null,
      at_rating: r.at_rating ?? null,
      days_since_last_change: Number.isNaN(r.days_since_last_change)
        ? null
        : (r.days_since_last_change ?? null),
      reason: r.reason || "",
      blocked_new_price: r.blocked_new_price ?? null,
      blocked_amount: r.blocked_amount ?? null,
      input: r.input && typeof r.input === "object" ? r.input : {},
    });
  }

  return rows;
}

/** Aggregate stored process records into daily dashboard summaries */
export function deriveDailySummariesFromRecords(records = []) {
  const byDate = new Map();

  for (const r of records) {
    if (!byDate.has(r.dateIso)) {
      byDate.set(r.dateIso, {
        dateIso: r.dateIso,
        dateStr: r.dateStr,
        savedAt: r.savedAt,
        pcUp: 0,
        pcDown: 0,
        prUp: 0,
        prDown: 0,
        issues: 0,
        blocked: 0,
        increase: 0,
        dropAbs: 0,
        units: 0,
      });
    }

    const day = byDate.get(r.dateIso);
    day.units += 1;
    if (r.savedAt && new Date(r.savedAt) > new Date(day.savedAt || 0)) {
      day.savedAt = r.savedAt;
      day.dateStr = r.dateStr || day.dateStr;
    }

    const change = Number(r.amount_change) || 0;

    switch (r.category) {
      case "pc_up":
        day.pcUp += 1;
        if (change > 0) day.increase += change;
        break;
      case "pc_down":
        day.pcDown += 1;
        if (change < 0) day.dropAbs += -change;
        break;
      case "pr_down":
        day.prDown += 1;
        if (change < 0) day.dropAbs += -change;
        break;
      case "issue":
        day.issues += 1;
        break;
      case "blocked":
        day.blocked += 1;
        break;
      default:
        break;
    }
  }

  return Array.from(byDate.values())
    .map((day) => {
      const increase = Math.round(day.increase);
      const dropAbs = Math.round(day.dropAbs);
      return {
        _id: day.dateIso,
        dateIso: day.dateIso,
        dateStr: day.dateStr,
        savedAt: day.savedAt,
        units: day.units,
        pcUp: day.pcUp,
        pcDown: day.pcDown,
        prUp: day.prUp,
        prDown: day.prDown,
        issues: day.issues,
        blocked: day.blocked,
        increase,
        drop: -dropAbs,
        net: increase - dropAbs,
      };
    })
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

export const METRIC_OPTIONS = [
  { key: "units", label: "Total Units" },
  { key: "pcUp", label: "Price Change (Up)" },
  { key: "pcDown", label: "Price Change (Down)" },
  { key: "prUp", label: "Price Refresh (Up)" },
  { key: "prDown", label: "Price Refresh (Down)" },
  { key: "modifiedCount", label: "Total Modified Items" },
  { key: "issues", label: "Data Issues" },
  { key: "blocked", label: "Blocked Decreases" },
  { key: "blockedPct", label: "Blocked %" },
  { key: "drop", label: "Total Price Drop (£)" },
  { key: "increase", label: "Total Price Increase (£)" },
  { key: "net", label: "Net Financial Impact (£)" },
  { key: "changeIntensity", label: "Change Intensity (%)" },
  { key: "refreshRatio", label: "Refresh vs Change Ratio" },
];

export function enrichLog(row) {
  const modifiedCount =
    (row.pcUp || 0) + (row.pcDown || 0) + (row.prUp || 0) + (row.prDown || 0);
  const units = row.units || 0;
  const blocked = row.blocked || 0;
  const changeIntensity = units > 0 ? (modifiedCount / units) * 100 : 0;
  const blockedPct = units > 0 ? (blocked / units) * 100 : 0;
  const priceChangeTotal = (row.pcUp || 0) + (row.pcDown || 0);
  const refreshTotal = (row.prUp || 0) + (row.prDown || 0);
  const refreshRatio =
    priceChangeTotal > 0 ? refreshTotal / priceChangeTotal : refreshTotal;

  const date = new Date(row.dateIso + "T12:00:00");
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    ...row,
    modifiedCount,
    changeIntensity,
    blockedPct,
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
  let totalPCUp = 0;
  let totalPCDown = 0;
  let totalPRUp = 0;
  let totalPRDown = 0;
  let totalDrop = 0;
  let totalIncrease = 0;
  let totalNet = 0;
  let totalIssues = 0;
  let totalBlocked = 0;

  enriched.forEach((row) => {
    totalUnits += row.units || 0;
    totalPCUp += row.pcUp || 0;
    totalPCDown += row.pcDown || 0;
    totalPRUp += row.prUp || 0;
    totalPRDown += row.prDown || 0;
    totalDrop += row.drop || 0;
    totalIncrease += row.increase || 0;
    totalNet += row.net || 0;
    totalIssues += row.issues || 0;
    totalBlocked += row.blocked || 0;
  });

  const weekendLogs = enriched.filter((r) => r.isWeekend);
  const weekdayLogs = enriched.filter((r) => !r.isWeekend);

  const avgNet = (arr) =>
    arr.length ? arr.reduce((s, r) => s + r.net, 0) / arr.length : 0;

  return {
    enriched,
    totals: {
      units: totalUnits,
      pcUp: totalPCUp,
      pcDown: totalPCDown,
      prUp: totalPRUp,
      prDown: totalPRDown,
      drop: totalDrop,
      increase: totalIncrease,
      net: totalNet,
      issues: totalIssues,
      blocked: totalBlocked,
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
