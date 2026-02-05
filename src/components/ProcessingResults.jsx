"use client";

import { Download, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import StatCard from "./StatCard";

export default function ProcessingResults({ results, onDownload, onReset }) {
  if (!results) return null;

  const { stats, summary } = results;

  const formatCurrency = (value) =>
    `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totalIncreaseCount =
    summary.price_increase + summary.increase_within_strategy;
  const totalDecreaseCount =
    summary.price_decrease + summary.decrease_within_strategy;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Reset and Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-900 to-blue-800 bg-clip-text text-transparent">
            Processing Complete
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            {summary?.total_stocks || 0} stocks processed
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={onDownload}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Upload</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Units"
          value={summary?.total_stocks || 0}
          description="Stock items processed"
          color="blue"
        />

        <StatCard
          label="No Change"
          value={summary?.not_change || 0}
          description="Within strategy"
          color="green"
        />

        <StatCard
          label="Target Price Increases"
          value={summary?.price_increase || 0}
          description="Increase to target"
          icon={<TrendingUp className="w-5 h-5" />}
          color="accent"
        />

        <StatCard
          label="Target Price Decreases"
          value={summary?.price_decrease || 0}
          description="Decrease to target"
          icon={<TrendingDown className="w-5 h-5" />}
          color="warning"
        />

        <StatCard
          label="Stale Nudge Increases"
          value={summary?.increase_within_strategy || 0}
          description="Optimized increase"
          icon={<TrendingUp className="w-5 h-5" />}
          color="accent"
        />

        <StatCard
          label="Stale Nudge Decreases"
          value={summary?.decrease_within_strategy || 0}
          description="Optimized decrease"
          icon={<TrendingDown className="w-5 h-5" />}
          color="warning"
        />

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
      <div className="bg-white rounded-xl border border-neutral-200/50 p-4 sm:p-6 lg:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 sm:mb-6">
          Financial Impact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Drop */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm font-medium text-red-600 mb-2">
              Total Price Drop
            </p>
            <p className="text-3xl font-bold text-red-700">
              -{formatCurrency(stats?.total_drop || 0)}
            </p>
            <p className="text-xs text-red-600 mt-2">
              {totalDecreaseCount} items decreased
            </p>
            <p className="text-xs text-red-500 mt-1">
              Avg: -
              {formatCurrency(
                (stats?.total_drop || 0) / Math.max(totalDecreaseCount || 1, 1),
              )}
            </p>
          </div>

          {/* Total Increment */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm font-medium text-green-600 mb-2">
              Total Price Increase
            </p>
            <p className="text-3xl font-bold text-green-700">
              +{formatCurrency(stats?.total_increment || 0)}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {totalIncreaseCount} items increased
            </p>
            <p className="text-xs text-green-500 mt-1">
              Avg: +
              {formatCurrency(
                (stats?.total_increment || 0) /
                  Math.max(totalIncreaseCount || 1, 1),
              )}
            </p>
          </div>

          {/* Net Impact */}
          <div
            className={`rounded-lg p-4 border ${
              (stats?.net_impact || 0) >= 0
                ? "bg-blue-50 border-blue-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                (stats?.net_impact || 0) >= 0
                  ? "text-blue-600"
                  : "text-orange-600"
              }`}
            >
              Net Financial Impact
            </p>
            <p
              className={`text-3xl font-bold ${
                (stats?.net_impact || 0) >= 0
                  ? "text-blue-700"
                  : "text-orange-700"
              }`}
            >
              {(stats?.net_impact || 0) >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(stats?.net_impact || 0))}
            </p>
            <p
              className={`text-xs mt-2 ${
                (stats?.net_impact || 0) >= 0
                  ? "text-blue-600"
                  : "text-orange-600"
              }`}
            >
              Portfolio impact
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200/50 p-4 sm:p-6 lg:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 sm:mb-6">
          Strategy Breakdown
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  No Change
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.not_change || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
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
                <p className="text-sm font-medium text-neutral-700">
                  Target Price Increases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.price_increase || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.price_increase || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Target Price Decreases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.price_decrease || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
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
                <p className="text-sm font-medium text-neutral-700">
                  Stale Nudge Increases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.increase_within_strategy || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.increase_within_strategy || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Stale Nudge Decreases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.decrease_within_strategy || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
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
                  <p className="text-sm font-medium text-neutral-700">
                    Data Issues
                  </p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {summary?.data_issues || 0}
                  </p>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
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
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border-2 border-red-200 p-4 sm:p-6 shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-4">
            Data Issues ({summary?.data_issues} records)
          </h3>

          <div className="space-y-2 sm:space-y-3">
            {results.sample_results
              .filter((r) => r.reason && r.reason.includes("Data Error"))
              .slice(0, 10)
              .map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm bg-white rounded-lg p-3 sm:p-4 border border-red-100 shadow-sm"
                >
                  <span className="font-semibold text-red-900 min-w-fit">
                    {row.stock_id || "MISSING"}
                  </span>
                  <span className="text-red-700 flex-1 break-words">{row.reason}</span>
                </div>
              ))}
          </div>
          {summary?.data_issues > 10 && (
            <p className="text-xs sm:text-sm text-red-700 mt-4 font-medium">
              ... and {summary?.data_issues - 10} more issues (see downloaded
              CSV for complete list)
            </p>
          )}
        </div>
      )}

      {/* Sample Results Table */}
      {results.sample_results && results.sample_results.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200/50 overflow-hidden shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-50/50">
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">Sample Results</h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              First 10 items from processed data
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-50/80 border-b-2 border-neutral-200">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    Stock ID
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    Current
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    Target %
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    New Price
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    Change
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.sample_results
                  .filter((r) => !r.reason || !r.reason.includes("Data Error"))
                  .slice(0, 10)
                  .map((row, idx) => {
                    const change = row.new_price - row.current_price;
                    return (
                      <tr
                        key={idx}
                        className="border-b border-neutral-200 hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 lg:px-6 py-3 font-semibold text-neutral-900">
                          {row.stock_id}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 text-neutral-700">
                          £{(row.current_price || 0).toFixed(0)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 text-neutral-700">
                          {row.target_percent}%
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 font-semibold text-neutral-900">
                          £{(row.new_price || 0).toFixed(0)}
                        </td>
                        <td
                          className={`px-3 sm:px-4 lg:px-6 py-3 font-semibold ${
                            change > 0
                              ? "text-green-700"
                              : change < 0
                                ? "text-red-700"
                                : "text-neutral-700"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          £{(change || 0).toFixed(0)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs text-neutral-600 break-words max-w-xs">
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
