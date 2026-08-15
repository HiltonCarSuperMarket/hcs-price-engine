"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { toastUtils } from "@/lib/utils";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HcsBrandNavbar,
  navActionClass,
  navActionPrimaryClass,
} from "@/components/hcs-brand-navbar";

const inputClass =
  "w-full text-center text-sm sm:text-base bg-slate-950 border border-white/10 text-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00dbcc] focus:border-[#00dbcc] transition-all disabled:opacity-50 placeholder:text-slate-500";

function bandName(band) {
  if (band == null) return "";
  if (typeof band === "string") return band;
  return band.name || String(band);
}

function cellValue(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell)) {
    return cell.value ?? "";
  }
  return cell ?? "";
}

function cellAppliesLm(cell) {
  return !!(cell && typeof cell === "object" && cell.applyLiveMarket);
}

export default function TargetMatrixEditor() {
  const [strategyId, setStrategyId] = useState(null);
  const [ageBands, setAgeBands] = useState([]);
  const [ratingBands, setRatingBands] = useState([]);
  const [targetMatrix, setTargetMatrix] = useState({});
  const [liveMarketAge, setLiveMarketAge] = useState({});
  const [liveMarketRating, setLiveMarketRating] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams(window.location.search);
        const id = params.get("id") || "default";
        setStrategyId(id);

        const response = await fetch(`/api/target-matrix?strategyId=${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch data");
        }

        const {
          ageBands: bands,
          ratingBands: ratings,
          targetMatrix: matrix,
          liveMarketAgeBands: savedAgeFlags,
          liveMarketRatingBands: savedRatingFlags,
        } = result.data;

        const ageNames = (bands || []).map(bandName);
        const ratingNames = (ratings || []).map(bandName);

        setAgeBands(ageNames);
        setRatingBands(ratingNames);

        const initialMatrix = {};
        ageNames.forEach((age) => {
          initialMatrix[age] = {};
          ratingNames.forEach((rating) => {
            initialMatrix[age][rating] = cellValue(matrix[age]?.[rating]);
          });
        });
        setTargetMatrix(initialMatrix);

        const hasSavedFlags =
          (savedAgeFlags && Object.keys(savedAgeFlags).length > 0) ||
          (savedRatingFlags && Object.keys(savedRatingFlags).length > 0);

        if (hasSavedFlags) {
          const ageFlags = {};
          const ratingFlags = {};
          ageNames.forEach((age) => {
            ageFlags[age] = !!savedAgeFlags?.[age];
          });
          ratingNames.forEach((rating) => {
            ratingFlags[rating] = !!savedRatingFlags?.[rating];
          });
          setLiveMarketAge(ageFlags);
          setLiveMarketRating(ratingFlags);
        } else {
          const ageFlags = {};
          const ratingFlags = {};
          ageNames.forEach((age) => {
            ageFlags[age] = ratingNames.every((rating) =>
              cellAppliesLm(matrix[age]?.[rating]),
            );
          });
          ratingNames.forEach((rating) => {
            ratingFlags[rating] = ageNames.every((age) =>
              cellAppliesLm(matrix[age]?.[rating]),
            );
          });
          setLiveMarketAge(ageFlags);
          setLiveMarketRating(ratingFlags);
        }
      } catch (err) {
        console.error("Error fetching target matrix:", err);
        toastUtils.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (ageBand, ratingBand, value) => {
    setTargetMatrix((prev) => ({
      ...prev,
      [ageBand]: {
        ...prev[ageBand],
        [ratingBand]: value,
      },
    }));
  };

  const toggleAgeLiveMarket = (ageBand, checked) => {
    setLiveMarketAge((prev) => ({ ...prev, [ageBand]: checked }));
  };

  const toggleRatingLiveMarket = (ratingBand, checked) => {
    setLiveMarketRating((prev) => ({ ...prev, [ratingBand]: checked }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const hasEmptyValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.values(ratingData).some(
            (val) => val === null || val === undefined || val === "",
          ),
      );

      if (hasEmptyValues) {
        toastUtils.error("Please fill in all values before saving");
        setSaving(false);
        return;
      }

      const hasInvalidValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.values(ratingData).some((val) => isNaN(parseFloat(val))),
      );

      if (hasInvalidValues) {
        toastUtils.error("All values must be valid numbers");
        setSaving(false);
        return;
      }

      const matrixToSave = {};
      Object.entries(targetMatrix).forEach(([ageBand, ratingData]) => {
        matrixToSave[ageBand] = {};
        Object.entries(ratingData).forEach(([ratingBand, value]) => {
          matrixToSave[ageBand][ratingBand] = parseFloat(value);
        });
      });

      const loadingToast = toastUtils.loading("Saving target matrix...");

      const response = await fetch("/api/target-matrix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId,
          targetMatrix: matrixToSave,
          liveMarketAgeBands: liveMarketAge,
          liveMarketRatingBands: liveMarketRating,
        }),
      });

      const result = await response.json();

      toastUtils.dismiss(loadingToast);

      if (!result.success) {
        throw new Error(result.error || "Failed to save data");
      }

      toastUtils.success("Target matrix saved successfully!");
    } catch (err) {
      console.error("Error saving target matrix:", err);
      toastUtils.error(err.message || "Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
        <HcsBrandNavbar
          title="Strategy Configuration"
          subtitle="HCS Pricing Hub"
          homeHref="/"
          right={<Skeleton className="h-9 w-40 rounded-lg bg-white/20" />}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 space-y-3">
            <Skeleton className="h-10 w-64 bg-slate-800" />
            <Skeleton className="h-6 w-96 max-w-full bg-slate-800" />
          </div>
          <TableSkeleton rows={8} cols={5} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      <HcsBrandNavbar
        title="Strategy Configuration"
        subtitle="HCS Pricing Hub"
        homeHref="/"
        right={
          <>
            <Link href="/dashboard" className={navActionPrimaryClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/settings" className={navActionClass}>
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
              <span className="sm:hidden">Config</span>
            </Link>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-2">
            Target Matrix Editor
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Configure target values for each age band and rating band combination.
            Tick Live Market on an age row or an AT Rating column to apply Live
            Market impact to that whole band.
          </p>
        </div>

        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-950 border-b border-white/10">
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-sm sm:text-base border-r border-white/10 sticky left-0 bg-slate-950 z-0 text-[#00dbcc]">
                    Age Band
                  </th>
                  {ratingBands.map((rating) => (
                    <th
                      key={rating}
                      className="px-3 sm:px-4 py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/10 last:border-r-0 whitespace-nowrap text-[#00dbcc]"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span>{rating}</span>
                        <label className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!liveMarketRating[rating]}
                            onChange={(e) =>
                              toggleRatingLiveMarket(rating, e.target.checked)
                            }
                            disabled={saving}
                            className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-[#00dbcc] focus:ring-[#00dbcc] focus:ring-offset-0"
                          />
                          LM
                        </label>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageBands.map((ageBand, index) => (
                  <tr
                    key={ageBand}
                    className={`transition-colors border-b border-white/5 ${
                      index % 2 === 0
                        ? "bg-slate-800 hover:bg-slate-800/80"
                        : "bg-slate-900/40 hover:bg-slate-900/60"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base border-r border-white/10 sticky left-0 bg-inherit z-0 text-slate-50 shadow-[2px_0_4px_rgba(0,0,0,0.3)]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!liveMarketAge[ageBand]}
                          onChange={(e) =>
                            toggleAgeLiveMarket(ageBand, e.target.checked)
                          }
                          disabled={saving}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-[#00dbcc] focus:ring-[#00dbcc] focus:ring-offset-0"
                        />
                        <span>{ageBand}</span>
                      </label>
                    </td>
                    {ratingBands.map((ratingName) => {
                      const value = targetMatrix[ageBand]?.[ratingName] ?? "";
                      const isEmpty =
                        value === null || value === undefined || value === "";
                      const lmOn =
                        !!liveMarketAge[ageBand] ||
                        !!liveMarketRating[ratingName];

                      return (
                        <td
                          key={`${ageBand}-${ratingName}`}
                          className={`px-2 sm:px-3 py-3 border-r border-white/5 last:border-r-0 ${
                            lmOn ? "bg-[#00dbcc]/5" : ""
                          }`}
                        >
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={value}
                              onChange={(e) =>
                                handleInputChange(
                                  ageBand,
                                  ratingName,
                                  e.target.value,
                                )
                              }
                              className={`${inputClass} ${
                                isEmpty
                                  ? "border-amber-500/50 bg-amber-950/20 focus:border-amber-400 focus:ring-amber-400/30"
                                  : lmOn
                                    ? "border-[#00dbcc]/40"
                                    : ""
                              }`}
                              disabled={saving}
                            />
                            {isEmpty && (
                              <p className="text-xs text-amber-400 font-medium text-center">
                                Required
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => window.location.reload()}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-white/10 text-slate-400 font-medium rounded-lg hover:border-slate-500 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#00dbcc] text-slate-900 font-semibold rounded-lg hover:bg-teal-400 disabled:bg-teal-800/50 disabled:text-slate-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-800 border border-white/5 rounded-2xl">
          <h3 className="font-semibold mb-3 text-base sm:text-lg text-slate-50">
            Information
          </h3>
          <ul className="text-xs sm:text-sm text-slate-400 space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00dbcc] rounded-full" />
              Total Age Bands:{" "}
              <strong className="text-slate-200">{ageBands.length}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00dbcc] rounded-full" />
              Total Rating Bands:{" "}
              <strong className="text-slate-200">{ratingBands.length}</strong>
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
              All fields marked with &quot;Required&quot; must be filled before
              saving
            </li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 bg-[#00dbcc] rounded-full" />
              Values must be valid numbers
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 bg-[#00dbcc] rounded-full mt-1.5 flex-shrink-0" />
              Tick LM on an age row or an AT Rating column. A cell gets Live
              Market impact if its row or its column is ticked.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
