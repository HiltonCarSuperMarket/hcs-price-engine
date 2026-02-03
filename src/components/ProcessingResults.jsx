"use client";

import { Download, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import StatCard from "./StatCard";

export default function ProcessingResults({ results, onDownload, onReset }) {
  if (!results) return null;

  const { stats, summary } = results;

  const formatCurrency = (value) =>
    `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      {/* Header with Reset and Download */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">
            Processing Complete
          </h2>
          <p className="text-neutral-600 mt-1">
            {summary?.total_stocks || 0} stocks processed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-900 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Download CSV
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            New Upload
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Units"
          value={summary?.total_stocks || 0}
          description="Stock items processed"
          color="blue"
        />

        <StatCard
          label="No Change"
          value={summary?.within_strategy || 0}
          description="Within strategy"
          color="green"
        />

        <StatCard
          label="Price Increases"
          value={summary?.increases || 0}
          description="Moving to target"
          icon={<TrendingUp className="w-5 h-5" />}
          color="accent"
        />

        <StatCard
          label="Price Decreases"
          value={summary?.decreases || 0}
          description="Moving to target"
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
      <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">
          Financial Impact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Drop */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm font-medium text-red-600 mb-2">
              Total Price Drop
            </p>
            <p className="text-3xl font-bold text-red-700">
              -{formatCurrency(stats?.total_drop || 0)}
            </p>
            <p className="text-xs text-red-600 mt-2">
              {summary?.decreases} items decreased
            </p>
            <p className="text-xs text-red-500 mt-1">
              Avg: -
              {formatCurrency(
                (stats?.total_drop || 0) / Math.max(summary?.decreases || 1, 1),
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
              {summary?.increases} items increased
            </p>
            <p className="text-xs text-green-500 mt-1">
              Avg: +
              {formatCurrency(
                (stats?.total_increment || 0) /
                  Math.max(summary?.increases || 1, 1),
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
      <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">
          Strategy Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Within Strategy
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.within_strategy || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.within_strategy || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Price Optimization
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.optimized || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{
                    width: `${((summary?.optimized || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Price Increases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.increases || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.increases || 0) / (summary?.total_stocks || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Price Decreases
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {summary?.decreases || 0}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${((summary?.decreases || 0) / (summary?.total_stocks || 1)) * 100}%`,
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
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Data Issues ({summary?.data_issues} records)
          </h3>
          <p className="text-sm text-red-700 mb-4">
            The following records were skipped due to invalid or missing data:
          </p>
          <div className="space-y-2">
            {results.sample_results
              .filter((r) => r.reason && r.reason.startsWith("Data Error"))
              .slice(0, 10)
              .map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-sm bg-white rounded p-3 border border-red-100"
                >
                  <span className="font-medium text-red-900 min-w-fit">
                    {row.stock_id || "MISSING"}
                  </span>
                  <span className="text-red-700 flex-1">{row.reason}</span>
                </div>
              ))}
          </div>
          {summary?.data_issues > 10 && (
            <p className="text-xs text-red-600 mt-3">
              ... and {summary?.data_issues - 10} more issues (see downloaded
              CSV for complete list)
            </p>
          )}
        </div>
      )}

      {/* Sample Results Table */}
      {results.sample_results && results.sample_results.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h3 className="font-semibold text-neutral-900">Sample Results</h3>
            <p className="text-sm text-neutral-600">
              First 10 items from processed data
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    Stock ID
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    Target %
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    New Price
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.sample_results
                  .filter(
                    (r) => !r.reason || !r.reason.startsWith("Data Error"),
                  )
                  .slice(0, 10)
                  .map((row, idx) => {
                    const change = row.new_price - row.current_price;
                    return (
                      <tr
                        key={idx}
                        className="border-b border-neutral-200 hover:bg-neutral-50"
                      >
                        <td className="px-6 py-3 font-medium text-neutral-900">
                          {row.stock_id}
                        </td>
                        <td className="px-6 py-3 text-neutral-700">
                          £{(row.current_price || 0).toFixed(0)}
                        </td>
                        <td className="px-6 py-3 text-neutral-700">
                          {row.target_percent}%
                        </td>
                        <td className="px-6 py-3 font-medium text-neutral-900">
                          £{(row.new_price || 0).toFixed(0)}
                        </td>
                        <td
                          className={`px-6 py-3 font-medium ${
                            change > 0
                              ? "text-green-700"
                              : change < 0
                                ? "text-red-700"
                                : "text-neutral-700"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {(change || 0).toFixed(0)}
                        </td>
                        <td className="px-6 py-3 text-xs text-neutral-600">
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
