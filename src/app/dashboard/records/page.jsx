"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, LayoutDashboard } from "lucide-react";
import {
  HcsBrandNavbar,
  navActionClass,
  navActionPrimaryClass,
} from "@/components/hcs-brand-navbar";
import { formatCurrency } from "@/lib/logUtils";
import { toastUtils } from "@/lib/utils";

const VIEW_LABELS = {
  all: "Total Units",
  units: "Total Units",
  pc_up: "Price Change Up",
  pc_down: "Price Change Down",
  pr_down: "Price Refresh Down",
  issues: "Data Issues",
  blocked: "Blocked",
  increase: "Total Increase",
  drop: "Total Drop",
  net: "Net Impact",
};

const CATEGORY_LABELS = {
  pc_up: "PC Up",
  pc_down: "PC Down",
  pr_down: "PR Down",
  issue: "Issue",
  blocked: "Blocked",
};

function formatNum(value, digits = 0) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPct(value) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function getInputValue(record, keys) {
  const input = record.input || {};
  for (const key of keys) {
    if (input[key] != null && String(input[key]).trim() !== "") {
      return input[key];
    }
  }
  return null;
}

function RecordsContent() {
  const searchParams = useSearchParams();
  const dateIso = searchParams.get("dateIso") || "";
  const view = searchParams.get("view") || "all";
  const dateStrParam = searchParams.get("dateStr") || "";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const viewLabel = VIEW_LABELS[view] || "Records";
  const showBlockedCols = view === "blocked" || view === "all" || view === "units";

  useEffect(() => {
    if (!dateIso) {
      setError("Missing date");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          detail: "true",
          dateIso,
          view,
        });
        const res = await fetch(`/api/logs?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load records");
        }
        setRecords(json.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load records");
        toastUtils.error(err.message || "Failed to load records");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dateIso, view]);

  const titleDate = useMemo(() => {
    if (dateStrParam) return dateStrParam;
    if (!dateIso) return "";
    return dateIso;
  }, [dateIso, dateStrParam]);

  const exportCSV = () => {
    const headers = [
      "category",
      "stock_id",
      "current_price",
      "reference_price",
      "retail_valuation_input",
      "matrix_percent",
      "live_market_impact",
      "live_market_condition",
      "target_percent",
      "target_price",
      "new_price",
      "amount_change",
      "age_days",
      "at_rating",
      "days_since_last_change",
      "reason",
    ];
    if (showBlockedCols) {
      headers.push("blocked_new_price", "blocked_amount");
    }

    const lines = [
      headers.join(","),
      ...records.map((r) => {
        const retailVal = getInputValue(r, [
          "Retail valuation",
          "benchmark_price",
          "reference_price",
        ]);
        const vals = [
          r.category,
          r.stock_id,
          r.current_price,
          r.reference_price,
          retailVal,
          r.matrix_percent,
          r.live_market_impact,
          r.live_market_condition,
          r.target_percent,
          r.target_price,
          r.new_price,
          r.amount_change,
          r.age_days,
          r.at_rating,
          r.days_since_last_change,
          `"${String(r.reason || "").replace(/"/g, '""')}"`,
        ];
        if (showBlockedCols) {
          vals.push(r.blocked_new_price, r.blocked_amount);
        }
        return vals
          .map((v) => (v == null || Number.isNaN(v) ? "" : v))
          .join(",");
      }),
    ];

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `log_records_${dateIso}_${view}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      <HcsBrandNavbar
        title="Log Records"
        subtitle="HCS Pricing Hub"
        homeHref="/"
        right={
          <>
            <Link href="/dashboard" className={navActionPrimaryClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/" className={navActionClass}>
              <span>Processor</span>
            </Link>
          </>
        }
      />

      <div className="max-w-[95vw] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-50">
              {viewLabel}
              {titleDate ? (
                <span className="text-slate-400 font-medium"> — {titleDate}</span>
              ) : null}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {loading
                ? "Loading records..."
                : `${records.length} record${records.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            disabled={loading || records.length === 0}
            className="flex items-center justify-center gap-2 bg-slate-800 border border-white/10 hover:border-[#00dbcc] text-slate-200 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {error ? (
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No records found for this filter.
          </div>
        ) : (
          <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-xs sm:text-sm min-w-[1100px]">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr>
                    {[
                      "Category",
                      "Stock ID",
                      "Current",
                      "Reference",
                      "Retail Val (input)",
                      "Matrix %",
                      "LM Impact",
                      "Live Market",
                      "Target %",
                      "Target Price",
                      "New Price",
                      "Amount Δ",
                      "Days in Stock",
                      "AT Rating",
                      "Days since change",
                      ...(showBlockedCols
                        ? ["Blocked New", "Blocked Amt"]
                        : []),
                      "Reason",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-[#00dbcc] text-[11px] uppercase tracking-wide font-semibold border-b border-white/10 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const change = Number(r.amount_change) || 0;
                    const retailVal = getInputValue(r, [
                      "Retail valuation",
                      "benchmark_price",
                    ]);
                    return (
                      <tr
                        key={r._id}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950 border border-white/10 text-slate-300">
                            {CATEGORY_LABELS[r.category] || r.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-100 whitespace-nowrap">
                          {r.stock_id || "—"}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          £{formatNum(r.current_price)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          £{formatNum(r.reference_price)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-400">
                          {retailVal != null
                            ? `£${formatNum(
                                String(retailVal).replace(/[£,]/g, ""),
                              )}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {formatPct(r.matrix_percent)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {formatNum(r.live_market_impact, 2)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {r.live_market_condition != null
                            ? formatNum(r.live_market_condition, 2)
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {formatPct(r.target_percent)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          £{formatNum(r.target_price)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                          £{formatNum(r.new_price)}
                        </td>
                        <td
                          className={`px-3 py-2.5 whitespace-nowrap font-semibold ${
                            change > 0
                              ? "text-emerald-400"
                              : change < 0
                                ? "text-red-400"
                                : "text-slate-400"
                          }`}
                        >
                          {formatCurrency(change, true)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {formatNum(r.age_days)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {r.at_rating != null ? r.at_rating : "—"}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {r.days_since_last_change == null ||
                          Number.isNaN(r.days_since_last_change)
                            ? "—"
                            : formatNum(r.days_since_last_change)}
                        </td>
                        {showBlockedCols && (
                          <>
                            <td className="px-3 py-2.5 whitespace-nowrap text-orange-300">
                              {r.blocked_new_price != null
                                ? `£${formatNum(r.blocked_new_price)}`
                                : "—"}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-orange-300">
                              {r.blocked_amount != null
                                ? formatNum(r.blocked_amount)
                                : "—"}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2.5 text-slate-400 max-w-xs break-words">
                          {r.reason || "—"}
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
    </main>
  );
}

export default function DashboardRecordsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
          <p className="text-slate-400">Loading records...</p>
        </main>
      }
    >
      <RecordsContent />
    </Suspense>
  );
}
