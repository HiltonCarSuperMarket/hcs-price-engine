"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    age: true,
    rating: false,
    matrix: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to save configuration");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateAgeBand = (index, field, value) => {
    const updated = [...config.age_bands];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? undefined : value,
    };
    setConfig({ ...config, age_bands: updated });
  };

  const addAgeBand = () => {
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
    if (config.age_bands.length > 1) {
      setConfig({
        ...config,
        age_bands: config.age_bands.filter((_, i) => i !== index),
      });
    }
  };

  const updateRatingBand = (index, field, value) => {
    const updated = [...config.rating_bands];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? undefined : value,
    };
    setConfig({ ...config, rating_bands: updated });
  };

  const addRatingBand = () => {
    setConfig({
      ...config,
      rating_bands: [
        ...config.rating_bands,
        { name: "New Band", min: 0, max: 20 },
      ],
    });
  };

  const removeRatingBand = (index) => {
    if (config.rating_bands.length > 1) {
      setConfig({
        ...config,
        rating_bands: config.rating_bands.filter((_, i) => i !== index),
      });
    }
  };

  const updateMatrixValue = (ageBand, ratingBand, value) => {
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
        <div className="max-w-6xl mx-auto px-6 py-6">
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Configuration saved successfully!
          </div>
        )}

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
              className={`w-5 h-5 text-neutral-600 transition ${expandedSections.age ? "rotate-180" : ""}`}
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
              className={`w-5 h-5 text-neutral-600 transition ${expandedSections.rating ? "rotate-180" : ""}`}
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
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
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
