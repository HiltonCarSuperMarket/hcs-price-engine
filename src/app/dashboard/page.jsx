"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import {
  NetImpactTrendChart,
  AdjustmentBreakdownChart,
  UnitsTrendChart,
  NoChangePctChart,
  CorrelationScatterChart,
  WeekendComparisonChart,
} from "@/components/dashboard/DashboardCharts";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  aggregateLogs,
  enrichLog,
  formatCurrency,
  METRIC_OPTIONS,
  pearsonCorrelation,
} from "@/lib/logUtils";
import { toastUtils } from "@/lib/utils";

function KpiCard({ label, value, sub, variant = "default" }) {
  const borderColors = {
    default: "border-l-[#00dbcc]",
    increase: "border-l-emerald-500",
    drop: "border-l-red-500",
    positive: "border-l-[#00dbcc]",
    negative: "border-l-red-500",
  };

  return (
    <div
      className={`bg-slate-800 border border-white/5 rounded-2xl p-5 border-l-4 ${borderColors[variant]} hover:border-teal-400/30 hover:-translate-y-1 transition-all`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function correlationLabel(r) {
  if (r === null) return "Insufficient data";
  const abs = Math.abs(r);
  let strength = "Weak";
  if (abs >= 0.7) strength = "Strong";
  else if (abs >= 0.4) strength = "Moderate";

  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "none";
  return `${strength} ${direction} (r = ${r.toFixed(3)})`;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("all");
  const [corrX, setCorrX] = useState("units");
  const [corrY, setCorrY] = useState("net");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await fetch("/api/logs/seed", { method: "POST" });
      await fetchLogs();
    }
    init();
  }, [fetchLogs]);

  useEffect(() => {
    if (logs.length > 0 && !startDate) {
      setStartDate(logs[0].dateIso);
      setEndDate(logs[logs.length - 1].dateIso);
    }
  }, [logs, startDate]);

  const filteredLogs = useMemo(() => {
    if (!startDate || !endDate) return logs.map(enrichLog);
    return logs
      .filter((r) => r.dateIso >= startDate && r.dateIso <= endDate)
      .map(enrichLog);
  }, [logs, startDate, endDate]);

  const { totals, weekendAvgNet, weekdayAvgNet, weekendCount, weekdayCount } =
    useMemo(() => aggregateLogs(filteredLogs), [filteredLogs]);

  const chartData = useMemo(
    () =>
      filteredLogs.map((row) => ({
        ...row,
        pcDownNeg: -row.pcDown,
        prDownNeg: -row.prDown,
      })),
    [filteredLogs],
  );

  const correlationMatrix = useMemo(() => {
    const keys = METRIC_OPTIONS.map((m) => m.key);
    const matrix = {};

    keys.forEach((xKey) => {
      matrix[xKey] = {};
      keys.forEach((yKey) => {
        const xs = filteredLogs.map((r) => r[xKey] ?? 0);
        const ys = filteredLogs.map((r) => r[yKey] ?? 0);
        matrix[xKey][yKey] = pearsonCorrelation(xs, ys);
      });
    });
    return matrix;
  }, [filteredLogs]);

  const selectedCorrelation = correlationMatrix[corrX]?.[corrY] ?? null;

  const xLabel = METRIC_OPTIONS.find((m) => m.key === corrX)?.label || corrX;
  const yLabel = METRIC_OPTIONS.find((m) => m.key === corrY)?.label || corrY;

  const weekendData = [
    { label: "Weekday", avgNet: Math.round(weekdayAvgNet), count: weekdayCount },
    { label: "Weekend", avgNet: Math.round(weekendAvgNet), count: weekendCount },
  ];

  const applyFilters = () => {
    setActivePreset("custom");
  };

  const setPreset = (preset) => {
    setActivePreset(preset);
    if (logs.length === 0) return;

    const min = logs[0].dateIso;
    const max = logs[logs.length - 1].dateIso;

    let start = min;
    let end = max;

    if (preset === "may") {
      start = "2026-05-01";
      end = "2026-05-31";
    } else if (preset === "june") {
      start = "2026-06-01";
      end = max;
    } else if (preset === "last7") {
      const last7 = logs.slice(-7);
      if (last7.length) {
        start = last7[0].dateIso;
        end = last7[last7.length - 1].dateIso;
      }
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleDeleteLog = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/logs?id=${deleteTarget._id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete log");
      }

      setLogs((prev) =>
        prev.filter((log) => String(log._id) !== String(deleteTarget._id)),
      );
      setDeleteTarget(null);
      toastUtils.success("Log deleted successfully");
    } catch (err) {
      console.error("Failed to delete log:", err);
      toastUtils.error(err.message || "Failed to delete log");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    const header =
      "Date,Total Units,No Change,Price Change Up,Price Change Down,Price Refresh Down,Data Issues,Total Price Drop,Total Price Increase,Net Financial Impact,Saved At\r\n";
    const rows = filteredLogs
      .map(
        (row) =>
          `${row.dateStr},${row.units},${row.noChange},${row.pcUp},${row.pcDown},${row.prDown},${row.issues},${row.drop},${row.increase},${row.net},${row.savedAt || ""}`,
      )
      .join("\r\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HCS_Price_Changes_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const netVariant = totals.net >= 0 ? "positive" : "negative";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#300263] to-indigo-950 border-b-2 border-[#00dbcc] sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-1">
                <img src="/logo-hilton.svg" alt="Hilton logo" width={180} height={28} />
              </Link>
              <p className="text-[10px] font-bold tracking-[3px] text-purple-300 uppercase">
                Supermarket
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#00dbcc]" />
                <h1 className="text-lg font-semibold">Pricing Engine Analysis</h1>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00dbcc] text-slate-900 rounded-lg hover:bg-teal-400 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap text-sm sm:text-base font-semibold"
                >
                  <span>Processor</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-white/10 text-slate-200 rounded-lg hover:border-[#00dbcc] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap text-sm sm:text-base font-medium"
                >
                  <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Configuration</span>
                  <span className="sm:hidden">Config</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Filters */}
        <div className="bg-slate-800 border border-white/5 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[#00dbcc] uppercase tracking-wide">
              Filter Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-white/10 text-white px-3 py-2 rounded-lg text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-white/10 text-white px-3 py-2 rounded-lg text-sm"
            />
            <button
              onClick={applyFilters}
              className="bg-[#00dbcc] hover:bg-teal-400 text-slate-900 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              Apply
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#00dbcc] uppercase tracking-wide mr-1">
              Presets:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "may", label: "May 2026" },
              { id: "june", label: "June 2026" },
              { id: "last7", label: "Last 7 Days" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activePreset === p.id
                    ? "bg-[#00dbcc] text-slate-950"
                    : "bg-slate-950 border border-white/10 text-slate-300 hover:border-[#00dbcc]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading dashboard...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No log data for the selected range. Process a file and click &quot;Save
            Log&quot; to add entries.
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Units Processed"
                value={totals.units.toLocaleString()}
                sub="Total stock items analyzed"
              />
              <KpiCard
                label="No Change"
                value={totals.noChange.toLocaleString()}
                sub={`${totals.noChangePct.toFixed(1)}% of portfolio`}
              />
              <KpiCard
                label="Total Price Increases"
                value={formatCurrency(totals.increase, true)}
                sub={`${totals.modifiedUp} items increased`}
                variant="increase"
              />
              <KpiCard
                label="Total Price Drops"
                value={formatCurrency(totals.drop, true)}
                sub={`${totals.modifiedDown} items decreased`}
                variant="drop"
              />
              <KpiCard
                label="Net Financial Impact"
                value={formatCurrency(totals.net, true)}
                sub="Combined value adjustment"
                variant={netVariant}
              />
            </div>

            {/* Primary charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Net Financial Impact Trend (£)
                </h2>
                <NetImpactTrendChart data={chartData} />
              </div>
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Price Adjustments vs Refreshes
                </h2>
                <AdjustmentBreakdownChart data={chartData} />
              </div>
            </div>

            {/* Secondary trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Portfolio Volume & Activity
                </h2>
                <UnitsTrendChart data={chartData} />
              </div>
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Stability vs Change Intensity
                </h2>
                <NoChangePctChart data={chartData} />
              </div>
            </div>

            {/* Correlation analysis */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-[#00dbcc]" />
                    Correlation Analysis
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Explore relationships between pricing metrics across selected
                    dates
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={corrX}
                    onChange={(e) => setCorrX(e.target.value)}
                    className="bg-slate-950 border border-white/10 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    {METRIC_OPTIONS.map((m) => (
                      <option key={m.key} value={m.key}>
                        X: {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={corrY}
                    onChange={(e) => setCorrY(e.target.value)}
                    className="bg-slate-950 border border-white/10 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    {METRIC_OPTIONS.map((m) => (
                      <option key={m.key} value={m.key}>
                        Y: {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CorrelationScatterChart
                    data={filteredLogs}
                    xKey={corrX}
                    yKey={corrY}
                    xLabel={xLabel}
                    yLabel={yLabel}
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-xl p-4 border border-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                      Pearson Correlation
                    </p>
                    <p className="text-xl font-bold text-[#00dbcc]">
                      {selectedCorrelation !== null
                        ? selectedCorrelation.toFixed(3)
                        : "N/A"}
                    </p>
                    <p className="text-sm text-slate-300 mt-2">
                      {correlationLabel(selectedCorrelation)}
                    </p>
                  </div>

                  <div className="bg-slate-950 rounded-xl p-4 border border-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                      Key Insights
                    </p>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        Weekend avg net:{" "}
                        {formatCurrency(Math.round(weekendAvgNet), true)} (
                        {weekendCount} days)
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        Weekday avg net:{" "}
                        {formatCurrency(Math.round(weekdayAvgNet), true)} (
                        {weekdayCount} days)
                      </li>
                      <li className="text-slate-400">
                        Data issues in range: {totals.issues} total across{" "}
                        {filteredLogs.length} processing days
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-950 rounded-xl p-4 border border-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                      Weekend vs Weekday Impact
                    </p>
                    <WeekendComparisonChart data={weekendData} />
                  </div>
                </div>
              </div>

              {/* Correlation heatmap table */}
              <div className="mt-6 overflow-x-auto">
                <p className="text-sm font-semibold text-slate-300 mb-3">
                  Correlation Matrix (selected metrics)
                </p>
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[#00dbcc]"></th>
                      {["units", "pcDown", "net", "noChangePct", "issues"].map(
                        (key) => (
                          <th
                            key={key}
                            className="p-2 text-center text-[#00dbcc] font-semibold"
                          >
                            {METRIC_OPTIONS.find((m) => m.key === key)?.label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {["units", "pcDown", "net", "noChangePct", "issues"].map(
                      (rowKey) => (
                        <tr key={rowKey} className="border-t border-white/5">
                          <td className="p-2 font-semibold text-slate-300">
                            {METRIC_OPTIONS.find((m) => m.key === rowKey)?.label}
                          </td>
                          {["units", "pcDown", "net", "noChangePct", "issues"].map(
                            (colKey) => {
                              const r = correlationMatrix[rowKey]?.[colKey];
                              const abs = r !== null ? Math.abs(r) : 0;
                              const bg =
                                r === null
                                  ? "bg-slate-900"
                                  : abs >= 0.7
                                    ? r > 0
                                      ? "bg-emerald-900/60"
                                      : "bg-red-900/60"
                                    : abs >= 0.4
                                      ? r > 0
                                        ? "bg-emerald-900/30"
                                        : "bg-red-900/30"
                                      : "bg-slate-800";
                              return (
                                <td
                                  key={colKey}
                                  className={`p-2 text-center ${bg} ${rowKey === corrX && colKey === corrY ? "ring-2 ring-[#00dbcc]" : ""}`}
                                >
                                  {r !== null ? r.toFixed(2) : "—"}
                                </td>
                              );
                            },
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily summary table */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
                <h2 className="text-lg font-semibold">Daily Summary Log</h2>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 bg-slate-950 border border-white/10 hover:border-[#00dbcc] text-slate-200 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Filtered CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr>
                      {[
                        "Date",
                        "Saved At",
                        "Total Units",
                        "No Change",
                        "PC Up",
                        "PC Down",
                        "PR Down",
                        "Issues",
                        "Total Drop",
                        "Total Increase",
                        "Net Impact",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[#00dbcc] text-xs uppercase tracking-wide font-semibold border-b border-white/10"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((row) => (
                      <tr
                        key={row.dateIso}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 font-semibold">{row.dateStr}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {row.savedAt
                            ? new Date(row.savedAt).toLocaleString("en-GB")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{row.units}</td>
                        <td className="px-4 py-3">{row.noChange}</td>
                        <td className="px-4 py-3">{row.pcUp}</td>
                        <td className="px-4 py-3">{row.pcDown}</td>
                        <td className="px-4 py-3">{row.prDown}</td>
                        <td className="px-4 py-3">{row.issues}</td>
                        <td className="px-4 py-3 text-red-400 font-semibold">
                          {formatCurrency(row.drop, true)}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">
                          {formatCurrency(row.increase, true)}
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold ${row.net >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {formatCurrency(row.net, true)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
        title="Delete Log Entry"
        description={
          deleteTarget
            ? `Are you sure you want to delete the log for ${deleteTarget.dateStr}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteLog}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
