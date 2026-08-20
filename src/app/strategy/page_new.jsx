"use client";

import { useEffect, useMemo, useState } from "react";
import { toastUtils } from "@/lib/utils";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const inputClass =
  "w-full text-center text-sm sm:text-base bg-slate-950 border border-white/10 text-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00dbcc] focus:border-[#00dbcc] transition-all disabled:opacity-50 placeholder:text-slate-500";

function bandName(band) {
  if (band == null) return "";
  if (typeof band === "string") return band;
  return band.name || String(band);
}

function bandBounds(band) {
  const rawMin = band.min;
  const rawMax = band.max;

  const min =
    rawMin === undefined || rawMin === null || rawMin === ""
      ? -Infinity
      : Number(rawMin);
  const max =
    rawMax === undefined || rawMax === null || rawMax === ""
      ? Infinity
      : Number(rawMax);

  return { min, max };
}

function toFloatOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function normalizeCell(cell, liveMarketBands) {
  const impactsDefault = {};
  for (const b of liveMarketBands || []) impactsDefault[b.name] = 0;

  if (cell == null || cell === "") {
    return {
      value: null,
      plusEnabled: false,
      minusEnabled: false,
      plusImpacts: { ...impactsDefault },
      minusImpacts: { ...impactsDefault },
    };
  }

  if (typeof cell === "number") {
    return {
      value: cell,
      plusEnabled: false,
      minusEnabled: false,
      plusImpacts: { ...impactsDefault },
      minusImpacts: { ...impactsDefault },
    };
  }

  const value = toFloatOrNull(cell.value ?? cell.mainPercent ?? cell.main);
  const legacyApply = !!cell.applyLiveMarket;

  const plusEnabled = legacyApply ? true : !!cell.plusEnabled;
  const minusEnabled = legacyApply ? true : !!cell.minusEnabled;

  return {
    value,
    plusEnabled,
    minusEnabled,
    plusImpacts: { ...impactsDefault, ...(cell.plusImpacts || {}) },
    minusImpacts: { ...impactsDefault, ...(cell.minusImpacts || {}) },
  };
}

export default function TargetMatrixEditor() {
  const [strategyId, setStrategyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [ageBands, setAgeBands] = useState([]);
  const [ratingBands, setRatingBands] = useState([]);
  const [liveMarketBands, setLiveMarketBands] = useState([]);
  const [targetMatrix, setTargetMatrix] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { ageBand, ratingBand }
  const [draftCell, setDraftCell] = useState(null);

  // A band can appear in both sections if it spans across 0.
  const positiveBands = useMemo(() => {
    return (liveMarketBands || []).filter((b) => bandBounds(b).max >= 0);
  }, [liveMarketBands]);

  const negativeBands = useMemo(() => {
    return (liveMarketBands || []).filter((b) => bandBounds(b).min < 0);
  }, [liveMarketBands]);

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

        const { ageBands, ratingBands, targetMatrix, liveMarketBands } =
          result.data;

        const ageBandNames = (ageBands || []).map(bandName);
        const ratingBandNames = (ratingBands || []).map(bandName);

        setAgeBands(ageBandNames);
        setRatingBands(ratingBandNames);
        setLiveMarketBands(liveMarketBands || []);

        const normalized = {};
        const bands = liveMarketBands || [];
        for (const ageBand of ageBandNames) {
          normalized[ageBand] = {};
          for (const ratingBand of ratingBandNames) {
            const cell = targetMatrix?.[ageBand]?.[ratingBand];
            normalized[ageBand][ratingBand] = normalizeCell(cell, bands);
          }
        }
        setTargetMatrix(normalized);
      } catch (err) {
        console.error(err);
        toastUtils.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModalFor = (ageBand, ratingBand) => {
    const cell = targetMatrix?.[ageBand]?.[ratingBand];
    if (!cell) return;
    setSelected({ ageBand, ratingBand });
    setDraftCell(JSON.parse(JSON.stringify(cell)));
    setModalOpen(true);
  };

  const updateCell = (ageBand, ratingBand, patch) => {
    setTargetMatrix((prev) => ({
      ...prev,
      [ageBand]: {
        ...prev[ageBand],
        [ratingBand]: {
          ...prev[ageBand][ratingBand],
          ...patch,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = targetMatrix;

      const loadingToast = toastUtils.loading("Saving target matrix...");
      const response = await fetch("/api/target-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId, targetMatrix: payload }),
      });
      const result = await response.json();
      toastUtils.dismiss(loadingToast);
      if (!result.success) throw new Error(result.error || "Failed to save");
      toastUtils.success("Target matrix saved successfully!");
    } catch (err) {
      console.error(err);
      toastUtils.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-2">
            Target Matrix Editor
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Click a matrix value to edit main % and Live Market impact per LM band.
            Use +LM / -LM to enable sign-specific application.
          </p>
        </div>

        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950 border-b border-white/10">
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-sm sm:text-base border-r border-white/10 sticky left-0 bg-slate-950 z-0 text-[#00dbcc]">
                    Age Band
                  </th>
                  {ratingBands.map((band) => (
                    <th
                      key={band}
                      className="px-3 sm:px-4 py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/10 last:border-r-0 whitespace-nowrap text-[#00dbcc]"
                    >
                      {band}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageBands.map((ageBand, rowIndex) => (
                  <tr
                    key={ageBand}
                    className={`transition-colors border-b border-white/5 ${
                      rowIndex % 2 === 0
                        ? "bg-slate-800 hover:bg-slate-800/80"
                        : "bg-slate-900/40 hover:bg-slate-900/60"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base border-r border-white/10 sticky left-0 bg-inherit z-0 text-slate-50 shadow-[2px_0_4px_rgba(0,0,0,0.3)]">
                      {ageBand}
                    </td>
                    {ratingBands.map((ratingBand) => {
                      const cell = targetMatrix?.[ageBand]?.[ratingBand];
                      const value = cell?.value ?? "";
                      return (
                        <td
                          key={`${ageBand}-${ratingBand}`}
                          className="px-2 sm:px-3 py-3 border-r border-white/5 last:border-r-0"
                        >
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => openModalFor(ageBand, ratingBand)}
                              className="w-full"
                              title="Click to edit"
                            >
                              <div
                                className={`${inputClass} flex items-center justify-center cursor-pointer`}
                              >
                                {value}
                              </div>
                            </button>

                            <label className="flex items-center justify-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!cell?.plusEnabled}
                                disabled={saving}
                                onChange={(e) =>
                                  updateCell(ageBand, ratingBand, {
                                    plusEnabled: e.target.checked,
                                  })
                                }
                                className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-[#00dbcc]"
                              />
                              +LM
                            </label>

                            <label className="flex items-center justify-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!cell?.minusEnabled}
                                disabled={saving}
                                onChange={(e) =>
                                  updateCell(ageBand, ratingBand, {
                                    minusEnabled: e.target.checked,
                                  })
                                }
                                className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-[#00dbcc]"
                              />
                              -LM
                            </label>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Live Market Impact (per cell)</DialogTitle>
              <DialogDescription>
                If a sign checkbox is unchecked, the impact for that sign becomes 0 automatically.
              </DialogDescription>
            </DialogHeader>

            {draftCell && selected ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Main Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={draftCell.value ?? ""}
                    onChange={(e) =>
                      setDraftCell((d) => ({
                        ...d,
                        value: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!draftCell.plusEnabled}
                      onChange={(e) =>
                        setDraftCell((d) => ({
                          ...d,
                          plusEnabled: e.target.checked,
                        }))
                      }
                    />
                    +LM enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!draftCell.minusEnabled}
                      onChange={(e) =>
                        setDraftCell((d) => ({
                          ...d,
                          minusEnabled: e.target.checked,
                        }))
                      }
                    />
                    -LM enabled
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-200 mb-3">
                      Positive LM ranges (+)
                    </p>
                    <div className="space-y-2">
                      {positiveBands.map((b) => (
                        <div key={b.name} className="flex items-center gap-3">
                          <div className="text-xs text-slate-400 w-[45%]">
                            {b.name}
                          </div>
                          <input
                            type="number"
                            step="0.1"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-50 text-sm"
                            value={draftCell.plusImpacts?.[b.name] ?? 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDraftCell((d) => ({
                                ...d,
                                plusImpacts: {
                                  ...(d.plusImpacts || {}),
                                  [b.name]: val,
                                },
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-200 mb-3">
                      Negative LM ranges (-)
                    </p>
                    <div className="space-y-2">
                      {negativeBands.map((b) => (
                        <div key={b.name} className="flex items-center gap-3">
                          <div className="text-xs text-slate-400 w-[45%]">
                            {b.name}
                          </div>
                          <input
                            type="number"
                            step="0.1"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-50 text-sm"
                            value={draftCell.minusImpacts?.[b.name] ?? 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDraftCell((d) => ({
                                ...d,
                                minusImpacts: {
                                  ...(d.minusImpacts || {}),
                                  [b.name]: val,
                                },
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 hover:border-[#00dbcc] transition-colors"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#00dbcc] text-slate-900 font-semibold hover:bg-teal-400 transition-colors"
                onClick={() => {
                  if (!draftCell || !selected) return;
                  setTargetMatrix((prev) => ({
                    ...prev,
                    [selected.ageBand]: {
                      ...prev[selected.ageBand],
                      [selected.ratingBand]: draftCell,
                    },
                  }));
                  setModalOpen(false);
                }}
              >
                Apply
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
