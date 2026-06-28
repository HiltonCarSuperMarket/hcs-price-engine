"use client";

import { useState } from "react";
import { Download, RotateCcw, Save, Check } from "lucide-react";
import StatCard from "./StatCard";
import { toastUtils } from "@/lib/utils";

export default function ProcessingResults({ results, onDownload, onReset }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!results) return null;

  const { stats, summary } = results;

  const formatCurrency = (value) =>
    `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totalIncreaseCount = summary.price_increase;
  const totalDecreaseCount =
    summary.price_decrease + summary.decrease_within_strategy;

  const handleSaveLog = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, summary }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save log");
      }

      setSaved(true);
      toastUtils.success(
        data.updated
          ? "Daily log updated for today"
          : "Daily log saved successfully",
      );
    } catch (err) {
      toastUtils.error(err.message || "Failed to save log");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Reset and Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-50">
            Processing Complete
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {summary?.total_stocks || 0} stocks processed
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleSaveLog}
            disabled={isSaving || saved}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base disabled:transform-none disabled:shadow-md ${
              saved
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-[#00dbcc] text-slate-900 hover:bg-teal-400"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Log Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Save Log</span>
              </>
            )}
          </button>
          <button
            onClick={onDownload}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-white/10 text-slate-200 rounded-lg hover:border-[#00dbcc] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 border border-white/10 text-slate-400 rounded-lg hover:border-slate-500 hover:text-slate-200 transition-colors font-medium text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Upload</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid - Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Total Units"
          value={summary?.total_stocks || 0}
          description="Stock items processed"
          color="blue"
        />

        <StatCard
          label="No Change"
          value={summary?.not_change || 0}
          description="Within strategy – no price update"
          color="green"
        />

        {/* Price Change Card */}
        <div className="bg-slate-800 border border-white/5 border-l-4 border-l-emerald-500 rounded-2xl p-4 hover:border-teal-400/30 transition-all">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Price Change
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 text-xs font-semibold">↑</span>
              <span className="text-emerald-300 font-bold text-sm">
                {totalIncreaseCount || 0}
              </span>
              <span className="text-emerald-400 text-xs">
                +{formatCurrency(stats?.total_increment || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400 text-xs font-semibold">↓</span>
              <span className="text-red-300 font-bold text-sm">
                {summary?.price_decrease || 0}
              </span>
              <span className="text-red-400 text-xs">
                -{formatCurrency(Math.abs(stats?.decrease_to_target_amount || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Price Refresh Card - down nudge only */}
        <div className="bg-slate-800 border border-white/5 border-l-4 border-l-[#00dbcc] rounded-2xl p-4 hover:border-teal-400/30 transition-all">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Price Refresh
          </p>
          <div className="flex items-center justify-between">
            <span className="text-red-400 text-xs font-semibold">↓</span>
            <span className="text-red-300 font-bold text-sm">
              {summary?.decrease_within_strategy || 0}
            </span>
            <span className="text-red-400 text-xs">
              -{formatCurrency(Math.abs(stats?.stale_nudge_decrease_amount || 0))}
            </span>
          </div>
        </div>

        {summary?.data_issues > 0 && (
          <StatCard
            label="Data Issues"
            value={summary?.data_issues || 0}
            description="Skipped - invalid data"
            color="red"
          />
        )}
      </div>

      {/* Financial Impact Section */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <h3 className="text-lg sm:text-xl font-bold text-slate-50 mb-4 sm:mb-6">
          Financial Impact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Drop */}
          <div className="bg-red-950/40 rounded-xl p-4 border border-red-500/30">
            <p className="text-sm font-medium text-red-400 mb-2">
              Total Price Drop
            </p>
            <p className="text-3xl font-bold text-red-300">
              -{formatCurrency(stats?.total_drop || 0)}
            </p>
            <p className="text-xs text-red-400 mt-2">
              {totalDecreaseCount} items decreased
            </p>
            <p className="text-xs text-red-400/70 mt-1">
              Avg: -
              {formatCurrency(
                (stats?.total_drop || 0) / Math.max(totalDecreaseCount || 1, 1),
              )}
            </p>
          </div>

          {/* Total Increment */}
          <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-sm font-medium text-emerald-400 mb-2">
              Total Price Increase
            </p>
            <p className="text-3xl font-bold text-emerald-300">
              +{formatCurrency(stats?.total_increment || 0)}
            </p>
            <p className="text-xs text-emerald-400 mt-2">
              {totalIncreaseCount} items increased
            </p>
            <p className="text-xs text-emerald-400/70 mt-1">
              Avg: +
              {formatCurrency(
                (stats?.total_increment || 0) /
                  Math.max(totalIncreaseCount || 1, 1),
              )}
            </p>
          </div>

          {/* Net Impact */}
          <div
            className={`rounded-xl p-4 border ${
              (stats?.net_impact || 0) >= 0
                ? "bg-teal-950/40 border-[#00dbcc]/30"
                : "bg-orange-950/40 border-orange-500/30"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                (stats?.net_impact || 0) >= 0
                  ? "text-[#00dbcc]"
                  : "text-orange-400"
              }`}
            >
              Net Financial Impact
            </p>
            <p
              className={`text-3xl font-bold ${
                (stats?.net_impact || 0) >= 0
                  ? "text-teal-300"
                  : "text-orange-300"
              }`}
            >
              {(stats?.net_impact || 0) >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(stats?.net_impact || 0))}
            </p>
            <p
              className={`text-xs mt-2 ${
                (stats?.net_impact || 0) >= 0
                  ? "text-[#00dbcc]"
                  : "text-orange-400"
              }`}
            >
              Portfolio impact
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <h3 className="text-lg sm:text-xl font-bold text-slate-50 mb-4 sm:mb-6">
          Strategy Breakdown
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">No Change</p>
                <p className="text-sm font-semibold text-slate-50">
                  {summary?.not_change || 0}
                </p>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.not_change || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">
                  Price Increases
                </p>
                <p className="text-sm font-semibold text-slate-50">
                  {totalIncreaseCount || 0}
                </p>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${((totalIncreaseCount || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">
                  Target Price Decreases
                </p>
                <p className="text-sm font-semibold text-slate-50">
                  {summary?.price_decrease || 0}
                </p>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.price_decrease || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">
                  Price Refresh Decreases
                </p>
                <p className="text-sm font-semibold text-slate-50">
                  {summary?.decrease_within_strategy || 0}
                </p>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.decrease_within_strategy || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {(summary?.data_issues || 0) > 0 && (
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-400">
                    Data Issues
                  </p>
                  <p className="text-sm font-semibold text-slate-50">
                    {summary?.data_issues || 0}
                  </p>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${((summary?.data_issues || 0) / (summary?.total_stocks || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Issues Section */}
      {summary?.data_issues > 0 && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-4">
            Data Issues ({summary?.data_issues} records)
          </h3>

          <div className="space-y-2 sm:space-y-3">
            {results.sample_results
              .filter((r) => r.reason && r.reason.includes("Data Error"))
              .slice(0, 10)
              .map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm bg-slate-900/60 rounded-lg p-3 sm:p-4 border border-red-500/20"
                >
                  <span className="font-semibold text-red-300 min-w-fit">
                    {row.stock_id || "MISSING"}
                  </span>
                  <span className="text-red-400/90 flex-1 break-words">
                    {row.reason}
                  </span>
                </div>
              ))}
          </div>
          {summary?.data_issues > 10 && (
            <p className="text-xs sm:text-sm text-red-400 mt-4 font-medium">
              ... and {summary?.data_issues - 10} more issues (see downloaded
              CSV for complete list)
            </p>
          )}
        </div>
      )}

      {/* Sample Results Table - Top 10 Data Issues */}
      {results.sample_results &&
        results.sample_results.filter(
          (r) => r.reason && r.reason.includes("Data Error"),
        ).length > 0 && (
          <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-white/10">
              <h3 className="font-bold text-base sm:text-lg text-slate-50">
                Top Data Issues
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Top 10 data issue records from processed data
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead className="bg-slate-950 border-b border-white/10">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      Stock ID
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      Current
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      Target %
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      New Price
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      Change
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-[#00dbcc] whitespace-nowrap">
                      Issue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.sample_results
                    .filter((r) => r.reason && r.reason.includes("Data Error"))
                    .slice(0, 10)
                    .map((row, idx) => {
                      const change = row.new_price - row.current_price;
                      return (
                        <tr
                          key={idx}
                          className="border-b border-white/5 hover:bg-red-950/20 transition-colors"
                        >
                          <td className="px-3 sm:px-4 lg:px-6 py-3 font-semibold text-slate-50">
                            {row.stock_id}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 text-slate-400">
                            £{(row.current_price || 0).toFixed(0)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 text-slate-400">
                            {row.target_percent}%
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 font-semibold text-slate-50">
                            £{(row.new_price || 0).toFixed(0)}
                          </td>
                          <td
                            className={`px-3 sm:px-4 lg:px-6 py-3 font-semibold ${
                              change > 0
                                ? "text-emerald-400"
                                : change < 0
                                  ? "text-red-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {change > 0 ? "+" : ""}£{(change || 0).toFixed(0)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs text-red-400 break-words max-w-xs">
                            {row.reason}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
