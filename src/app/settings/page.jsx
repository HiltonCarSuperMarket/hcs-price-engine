"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, X, ArrowLeft, Save } from "lucide-react";
import { Play, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { toastUtils } from "@/lib/utils";
import { ConfigSkeleton } from "@/components/SkeletonLoader";

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
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
        <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ConfigSkeleton />
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-600 font-medium">Failed to load configuration</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-900 to-blue-800 bg-clip-text text-transparent">
                  Configuration
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 mt-1">
                  Configure your pricing strategy parameters
                </p>
              </div>
            </div>
            <Link
              href="/strategy"
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap text-sm sm:text-base font-medium w-full sm:w-auto justify-center"
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Strategy Configuration</span>
              <span className="sm:hidden">Strategy</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Global Configuration Section */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl border border-neutral-200/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                global: !expandedSections.global,
              })
            }
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-neutral-50/50 transition-colors"
          >
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
              Global Settings
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${
                expandedSections.global ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.global && (
            <div className="border-t border-neutral-200 p-4 sm:p-6 space-y-6">
              {/* Tolerance Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-6 border-b border-neutral-200">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-700">
                    Tolerance Type
                  </label>
                  <select
                    value={config.tolerance_type || "percent"}
                    onChange={(e) => {
                      setConfig({ ...config, tolerance_type: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "tolerance_type",
                        config.tolerance_type,
                        "Tolerance Type",
                        "tolerance",
                      )
                    }
                    className="mt-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                  >
                    Save
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-700">
                    Tolerance Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.tolerance_value || 0}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        tolerance_value: parseFloat(e.target.value),
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "tolerance_value",
                        config.tolerance_value,
                        "Tolerance Value",
                        "tolerance",
                      )
                    }
                    className="mt-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Nudge Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nudge Type
                  </label>
                  <select
                    value={config.nudge_type || "percent"}
                    onChange={(e) => {
                      setConfig({ ...config, nudge_type: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                    <option value="auto">Auto</option>
                  </select>
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "nudge_type",
                        config.nudge_type,
                        "Nudge Type",
                        "nudge",
                      )
                    }
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nudge Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.nudge_value || 0}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        nudge_value: parseFloat(e.target.value),
                      });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "nudge_value",
                        config.nudge_value,
                        "Nudge Value",
                        "nudge",
                      )
                    }
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Other Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Rounding Mode
                  </label>
                  <select
                    value={config.rounding_mode || "nearest"}
                    onChange={(e) => {
                      setConfig({ ...config, rounding_mode: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="exact">Exact</option>
                    <option value="nearest">Nearest</option>
                    <option value="49/99">49/99 Pricing</option>
                  </select>
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "rounding_mode",
                        config.rounding_mode,
                        "Rounding Mode",
                        "system",
                      )
                    }
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Stale Days Threshold
                  </label>
                  <input
                    type="number"
                    value={config.stale_days || 7}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        stale_days: parseInt(e.target.value),
                      });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      saveGlobalConfig(
                        "stale_days",
                        config.stale_days,
                        "Stale Days",
                        "system",
                      )
                    }
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Age Bands Section */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl border border-neutral-200/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                age: !expandedSections.age,
              })
            }
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-neutral-50/50 transition-colors"
          >
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
              Age Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${
                expandedSections.age ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.age && (
            <div className="border-t border-neutral-200 p-4 sm:p-6 space-y-4">
              {config.age_bands.map((band, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 p-4 bg-gradient-to-br from-neutral-50 to-neutral-50/50 rounded-lg border border-neutral-200/50"
                >
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Band Name
                    </label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateAgeBand(idx, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Min (Days)
                    </label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateAgeBand(idx, "min", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Max (Days)
                    </label>
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
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <button
                    onClick={() => removeAgeBand(idx)}
                    disabled={config.age_bands.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-2"
                    aria-label="Remove age band"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sm:hidden text-xs">Remove</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addAgeBand}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-200 hover:border-blue-300"
              >
                <Plus className="w-4 h-4" />
                Add Age Band
              </button>
            </div>
          )}
        </div>

        {/* Rating Bands Section */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl border border-neutral-200/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                rating: !expandedSections.rating,
              })
            }
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-neutral-50/50 transition-colors"
          >
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
              Rating Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${
                expandedSections.rating ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.rating && (
            <div className="border-t border-neutral-200 p-4 sm:p-6 space-y-4">
              {config.rating_bands.map((band, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 p-4 bg-gradient-to-br from-neutral-50 to-neutral-50/50 rounded-lg border border-neutral-200/50"
                >
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Band Name
                    </label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateRatingBand(idx, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Min Score
                    </label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateRatingBand(idx, "min", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Max Score
                    </label>
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
                      className="w-full px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <button
                    onClick={() => removeRatingBand(idx)}
                    disabled={config.rating_bands.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-2"
                    aria-label="Remove rating band"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sm:hidden text-xs">Remove</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addRatingBand}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-200 hover:border-blue-300"
              >
                <Plus className="w-4 h-4" />
                Add Rating Band
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-neutral-200">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            className="px-6 sm:px-8 py-3 bg-neutral-200 text-neutral-800 font-medium rounded-lg hover:bg-neutral-300 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
