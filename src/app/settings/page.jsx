"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, X, Save, LayoutDashboard } from "lucide-react";
import { Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { toastUtils } from "@/lib/utils";
import { ConfigSkeleton } from "@/components/SkeletonLoader";
import { HcsBrandNavbar } from "@/components/hcs-brand-navbar";

// Helper function to parse age band string and extract min/max values
const parseAgeBand = (bandName) => {
  if (bandName.endsWith("+")) {
    // Handle "181+" format - minimum is the number, maximum is undefined
    const min = parseInt(bandName.replace("+", ""));
    return { min, max: undefined };
  } else if (bandName.includes("-")) {
    // Handle "0-15" format - extract both min and max
    const [minStr, maxStr] = bandName.split("-");
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    return { min, max };
  }
  // Fallback for unexpected format
  return { min: 0, max: undefined };
};

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [globalConfigs, setGlobalConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    age: true,
    rating: false,
    matrix: false,
    global: false,
  });

  useEffect(() => {
    loadConfig();
    loadGlobalConfigs();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/config");
      const data = await response.json();
      if (data.success) {
        const strategies = data.data;
        // Use the first strategy (or default if available)
        let defaultStrategy =
          strategies.find((s) => s.name === "Default Strategy") ||
          strategies[0];

        // Parse age bands to extract min/max from band names
        if (defaultStrategy && defaultStrategy.age_bands) {
          defaultStrategy.age_bands = defaultStrategy.age_bands.map((band) => {
            // If band is a string (e.g., "0-15"), parse it to extract min/max
            if (typeof band === "string") {
              const { min, max } = parseAgeBand(band);
              return { name: band, min, max };
            }
            // If band is already an object with min/max, parse name to ensure consistency
            const { min, max } = parseAgeBand(band.name || band);
            return { name: band.name || band, min, max };
          });
        }

        setConfig(defaultStrategy);
      } else {
        toastUtils.error(data.error || "Failed to load configuration");
      }
    } catch (err) {
      console.error("Load config error:", err);
      toastUtils.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalConfigs = async () => {
    try {
      const response = await fetch("/api/config?type=config");
      const data = await response.json();
      if (data.success) {
        const configMap = {};
        data.data.forEach((item) => {
          configMap[item.key] = item.value;
        });
        setGlobalConfigs(configMap);
      }
    } catch (err) {
      console.error("Load global configs error:", err);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const loadingToast = toastUtils.loading("Saving configuration...");

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          config: config,
        }),
      });

      const data = await response.json();

      toastUtils.dismiss(loadingToast);

      if (data.success) {
        toastUtils.success("Configuration saved successfully!");
      } else {
        toastUtils.error(data.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Save config error:", err);
      toastUtils.error("Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  const saveGlobalConfig = async (key, value, description, category) => {
    try {
      const loadingToast = toastUtils.loading(`Saving ${description}...`);

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveConfig",
          configData: {
            key,
            value,
            description,
            category,
          },
        }),
      });

      const data = await response.json();

      toastUtils.dismiss(loadingToast);

      if (data.success) {
        setGlobalConfigs((prev) => ({
          ...prev,
          [key]: value,
        }));
        toastUtils.success(`${description} saved successfully!`);
      } else {
        toastUtils.error(data.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Save global config error:", err);
      toastUtils.error(`Error saving ${description}`);
    }
  };

  const updateAgeBand = (index, field, value) => {
    if (!config) return;
    const updated = [...config.age_bands];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? undefined : value,
    };
    setConfig({ ...config, age_bands: updated });
  };

  const addAgeBand = () => {
    if (!config) return;
    const lastBand = config.age_bands[config.age_bands.length - 1];
    const newMin = (lastBand.max || 0) + 1;
    setConfig({
      ...config,
      age_bands: [
        ...config.age_bands,
        { name: `${newMin}-${newMin + 14}`, min: newMin, max: newMin + 14 },
      ],
    });
  };

  const removeAgeBand = (index) => {
    if (!config || config.age_bands.length <= 1) return;
    setConfig({
      ...config,
      age_bands: config.age_bands.filter((_, i) => i !== index),
    });
  };

  const updateRatingBand = (index, field, value) => {
    if (!config) return;
    const updated = [...config.rating_bands];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? undefined : value,
    };
    setConfig({ ...config, rating_bands: updated });
  };

  const addRatingBand = () => {
    if (!config) return;
    setConfig({
      ...config,
      rating_bands: [
        ...config.rating_bands,
        { name: "New Band", min: 0, max: 20 },
      ],
    });
  };

  const removeRatingBand = (index) => {
    if (!config || config.rating_bands.length <= 1) return;
    setConfig({
      ...config,
      rating_bands: config.rating_bands.filter((_, i) => i !== index),
    });
  };

  const updateMatrixValue = (ageBand, ratingBand, value) => {
    if (!config) return;
    setConfig({
      ...config,
      target_matrix: {
        ...config.target_matrix,
        [ageBand]: {
          ...config.target_matrix[ageBand],
          [ratingBand]: parseFloat(value) || 0,
        },
      },
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
        <header className="bg-gradient-to-br from-[#300263] to-indigo-950 border-b-2 border-[#00dbcc] sticky top-0 z-10 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <Skeleton className="h-8 w-48 bg-slate-700" />
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ConfigSkeleton />
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-400 font-medium">
            Failed to load configuration
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      <HcsBrandNavbar
        title="Pricing Engine"
        subtitle="Configuration"
        homeHref="/"
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 sm:text-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link
              href="/strategy"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 sm:px-4 sm:text-sm"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Strategy Configuration</span>
              <span className="sm:hidden">Strategy</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Global Configuration Section */}
        <div className={sectionClass}>
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                global: !expandedSections.global,
              })
            }
            className={sectionHeaderClass}
          >
            <h2 className="text-base sm:text-lg font-semibold text-slate-50">
              Global Settings
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                expandedSections.global ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.global && (
            <div className="border-t border-white/10 p-4 sm:p-6 space-y-6">
              {/* Tolerance Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-6 border-b border-white/10">
                <div className="space-y-2">
                  <label className={labelClass}>Tolerance Type</label>
                  <select
                    value={globalConfigs.tolerance_type || "percent"}
                    onChange={(e) => {
                      setGlobalConfigs((prev) => ({
                        ...prev,
                        tolerance_type: e.target.value,
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "tolerance_type",
                        globalConfigs.tolerance_type,
                        "Tolerance Type",
                        "tolerance",
                      )
                    }
                    className={saveBtnClass}
                  >
                    Save
                  </button>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Tolerance Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={globalConfigs.tolerance_value || 0}
                    onChange={(e) => {
                      setGlobalConfigs((prev) => ({
                        ...prev,
                        tolerance_value: parseFloat(e.target.value) || 0,
                      }));
                    }}
                    className={inputClass}
                  />
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "tolerance_value",
                        globalConfigs.tolerance_value,
                        "Tolerance Value",
                        "tolerance",
                      )
                    }
                    className={saveBtnClass}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Nudge Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-white/10">
                <div>
                  <label className={`${labelClass} mb-2`}>Nudge Type</label>
                  <select
                    value={globalConfigs.nudge_type || "percent"}
                    onChange={(e) => {
                      setGlobalConfigs((prev) => ({
                        ...prev,
                        nudge_type: e.target.value,
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                    <option value="auto">Auto</option>
                  </select>
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "nudge_type",
                        globalConfigs.nudge_type,
                        "Nudge Type",
                        "nudge",
                      )
                    }
                    className={saveBtnClass}
                  >
                    Save
                  </button>
                </div>

                <div>
                  <label className={`${labelClass} mb-2`}>Nudge Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={globalConfigs.nudge_value || 0}
                    onChange={(e) => {
                      setGlobalConfigs((prev) => ({
                        ...prev,
                        nudge_value: parseFloat(e.target.value) || 0,
                      }));
                    }}
                    className={inputClass}
                  />
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "nudge_value",
                        globalConfigs.nudge_value,
                        "Nudge Value",
                        "nudge",
                      )
                    }
                    className={saveBtnClass}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Other Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClass} mb-2`}>Rounding Mode</label>
                  <select
                    value={globalConfigs.rounding_mode || "exact"}
                    onChange={(e) => {
                      setGlobalConfigs((prev) => ({
                        ...prev,
                        rounding_mode: e.target.value,
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="exact">Exact</option>
                    <option value="49/99">49/99 Pricing</option>
                    <option value="ends_with_digit">
                      Round to ending digit(s) (0-9)
                    </option>
                  </select>
                  {globalConfigs.rounding_mode === "ends_with_digit" && (
                    <div className="mt-3">
                      <RoundingDigitsPicker
                        variant="dark"
                        digits={parseRoundingDigits(globalConfigs)}
                        onChange={(digits) => {
                          setGlobalConfigs((prev) => ({
                            ...prev,
                            rounding_digits: digits,
                          }));
                        }}
                      />
                      <button
                        onClick={() =>
                          saveGlobalConfig(
                            "rounding_digits",
                            parseRoundingDigits(globalConfigs),
                            "Rounding Digits",
                            "system",
                          )
                        }
                        className={saveBtnClass}
                      >
                        Save Digits
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "rounding_mode",
                        globalConfigs.rounding_mode,
                        "Rounding Mode",
                        "system",
                      )
                    }
                    className={saveBtnClass}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Age Bands Section */}
        <div className={sectionClass}>
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                age: !expandedSections.age,
              })
            }
            className={sectionHeaderClass}
          >
            <h2 className="text-base sm:text-lg font-semibold text-slate-50">
              Age Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                expandedSections.age ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.age && (
            <div className="border-t border-white/10 p-4 sm:p-6 space-y-4">
              {config.age_bands.map((band, idx) => (
                <div key={idx} className={bandRowClass}>
                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Band Name</label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateAgeBand(idx, "name", e.target.value)
                      }
                      className={inputClassSm}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Min (Days)</label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateAgeBand(idx, "min", parseInt(e.target.value))
                      }
                      className={inputClassSm}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Max (Days)</label>
                    <input
                      type="number"
                      value={band.max === undefined ? "" : band.max}
                      onChange={(e) =>
                        updateAgeBand(
                          idx,
                          "max",
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                      placeholder="Open-ended"
                      className={inputClassSm}
                    />
                  </div>

                  <button
                    onClick={() => removeAgeBand(idx)}
                    disabled={config.age_bands.length === 1}
                    className="px-3 py-2 text-red-400 hover:bg-red-950/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-2"
                    aria-label="Remove age band"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sm:hidden text-xs">Remove</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addAgeBand}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[#00dbcc] hover:bg-teal-950/30 rounded-lg transition-colors font-medium border border-[#00dbcc]/30 hover:border-[#00dbcc]"
              >
                <Plus className="w-4 h-4" />
                Add Age Band
              </button>
            </div>
          )}
        </div>

        {/* Rating Bands Section */}
        <div className={sectionClass}>
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                rating: !expandedSections.rating,
              })
            }
            className={sectionHeaderClass}
          >
            <h2 className="text-base sm:text-lg font-semibold text-slate-50">
              Rating Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                expandedSections.rating ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.rating && (
            <div className="border-t border-white/10 p-4 sm:p-6 space-y-4">
              {config.rating_bands.map((band, idx) => (
                <div key={idx} className={bandRowClass}>
                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Band Name</label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateRatingBand(idx, "name", e.target.value)
                      }
                      className={inputClassSm}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Min Score</label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateRatingBand(idx, "min", parseInt(e.target.value))
                      }
                      className={inputClassSm}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className={labelClassSm}>Max Score</label>
                    <input
                      type="number"
                      value={band.max === undefined ? "" : band.max}
                      onChange={(e) =>
                        updateRatingBand(
                          idx,
                          "max",
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                      placeholder="Open-ended"
                      className={inputClassSm}
                    />
                  </div>

                  <button
                    onClick={() => removeRatingBand(idx)}
                    disabled={config.rating_bands.length === 1}
                    className="px-3 py-2 text-red-400 hover:bg-red-950/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-2"
                    aria-label="Remove rating band"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sm:hidden text-xs">Remove</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addRatingBand}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[#00dbcc] hover:bg-teal-950/30 rounded-lg transition-colors font-medium border border-[#00dbcc]/30 hover:border-[#00dbcc]"
              >
                <Plus className="w-4 h-4" />
                Add Rating Band
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-white/10">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-[#00dbcc] text-slate-900 font-semibold rounded-lg hover:bg-teal-400 disabled:bg-teal-800/50 disabled:text-slate-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
          <Link
            href="/"
            className="px-6 sm:px-8 py-3 bg-slate-900 border border-white/10 text-slate-400 font-medium rounded-lg hover:border-slate-500 hover:text-slate-200 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
