"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, X, ArrowLeft, Save } from "lucide-react";
import { Play, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

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
  const [message, setMessage] = useState(null);
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
        setMessage({
          type: "error",
          text: data.error || "Failed to load configuration",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load configuration" });
      console.error("Load config error:", err);
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
      setMessage(null);

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          config: config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Configuration saved successfully!",
        });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save configuration",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error saving configuration" });
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const saveGlobalConfig = async (key, value, description, category) => {
    try {
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

      if (data.success) {
        setGlobalConfigs((prev) => ({
          ...prev,
          [key]: value,
        }));
        setMessage({
          type: "success",
          text: `${description} saved successfully!`,
        });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save configuration",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error saving ${description}`,
      });
      console.error("Save global config error:", err);
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
      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="mt-2 text-neutral-600">Loading configuration...</p>
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <p className="text-red-600">Failed to load configuration</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="flex justify-between max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Configuration
              </h1>
              <p className="text-neutral-600 mt-1">
                Configure your pricing strategy parameters
              </p>
            </div>
          </div>
          <Link
            href="/strategy"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <SettingsIcon className="w-4 h-4" />
            Strategy Configuration
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border transition ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Global Configuration Section */}
        <div className="mb-8 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                global: !expandedSections.global,
              })
            }
            className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              Global Settings
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition ${
                expandedSections.global ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.global && (
            <div className="border-t border-neutral-200 p-6 space-y-6">
              {/* Tolerance Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tolerance Type
                  </label>
                  <select
                    value={config.tolerance_type || "percent"}
                    onChange={(e) => {
                      setConfig({ ...config, tolerance_type: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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
        <div className="mb-8 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                age: !expandedSections.age,
              })
            }
            className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              Age Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition ${
                expandedSections.age ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.age && (
            <div className="border-t border-neutral-200 p-6 space-y-4">
              {config.age_bands.map((band, idx) => (
                <div
                  key={idx}
                  className="flex items-end gap-4 p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Band Name
                    </label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateAgeBand(idx, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Min (Days)
                    </label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateAgeBand(idx, "min", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                      placeholder="Leave empty for open-ended"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => removeAgeBand(idx)}
                    disabled={config.age_bands.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={addAgeBand}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Age Band
              </button>
            </div>
          )}
        </div>

        {/* Rating Bands Section */}
        <div className="mb-8 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSections({
                ...expandedSections,
                rating: !expandedSections.rating,
              })
            }
            className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              Rating Bands
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition ${
                expandedSections.rating ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.rating && (
            <div className="border-t border-neutral-200 p-6 space-y-4">
              {config.rating_bands.map((band, idx) => (
                <div
                  key={idx}
                  className="flex items-end gap-4 p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Band Name
                    </label>
                    <input
                      type="text"
                      value={band.name}
                      onChange={(e) =>
                        updateRatingBand(idx, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Min Score
                    </label>
                    <input
                      type="number"
                      value={band.min || 0}
                      onChange={(e) =>
                        updateRatingBand(idx, "min", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                      placeholder="Leave empty for open-ended"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => removeRatingBand(idx)}
                    disabled={config.rating_bands.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={addRatingBand}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Rating Band
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-neutral-200 text-neutral-800 font-medium rounded-lg hover:bg-neutral-300 transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
