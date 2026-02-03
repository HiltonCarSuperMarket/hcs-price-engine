"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";

const DEFAULT_CONFIG = {
  tolerance_value: 0.2,
  tolerance_type: "percent",
  stale_days: 7,
  nudge_value: 0.2,
  nudge_type: "percent",
  nudge_preference: "add",
  rounding_mode: "49/99",
  weekend_hold: false,
  reference_column: "Retail valuation",
};

export default function ConfigPanel({
  onConfigSave,
  onProcess,
  isProcessing,
  readyToProcess,
}) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [expandedSections, setExpandedSections] = useState({
    tolerance: true,
    stale: true,
    nudge: true,
    other: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigSave(newConfig);
  };

  const handleProcess = () => {
    onConfigSave(config);
    onProcess();
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Pricing Configuration
        </h2>

        {/* Tolerance Section */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => toggleSection("tolerance")}
            className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <h3 className="font-medium text-neutral-900">Price Tolerance</h3>
            {expandedSections.tolerance ? (
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600" />
            )}
          </button>

          {expandedSections.tolerance && (
            <div className="p-4 space-y-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tolerance Type
                </label>
                <select
                  value={config.tolerance_type}
                  onChange={(e) =>
                    handleConfigChange("tolerance_type", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="value">Fixed Value (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tolerance Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.tolerance_value}
                  onChange={(e) =>
                    handleConfigChange(
                      "tolerance_value",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stale Price Section */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => toggleSection("stale")}
            className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <h3 className="font-medium text-neutral-900">Stale Price Rules</h3>
            {expandedSections.stale ? (
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600" />
            )}
          </button>

          {expandedSections.stale && (
            <div className="p-4 space-y-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Days Until Stale
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.stale_days}
                  onChange={(e) =>
                    handleConfigChange("stale_days", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Nudge Section */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => toggleSection("nudge")}
            className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <h3 className="font-medium text-neutral-900">
              Price Nudge Strategy
            </h3>
            {expandedSections.nudge ? (
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600" />
            )}
          </button>

          {expandedSections.nudge && (
            <div className="p-4 space-y-4 border-t border-neutral-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nudge Type
                  </label>
                  <select
                    value={config.nudge_type}
                    onChange={(e) =>
                      handleConfigChange("nudge_type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="value">Fixed Value (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nudge Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.nudge_value}
                    onChange={(e) =>
                      handleConfigChange(
                        "nudge_value",
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nudge Preference
                </label>
                <select
                  value={config.nudge_preference}
                  onChange={(e) =>
                    handleConfigChange("nudge_preference", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="add">Add (Increase)</option>
                  <option value="drop">Drop (Decrease)</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Other Settings */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-6">
          <button
            onClick={() => toggleSection("other")}
            className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <h3 className="font-medium text-neutral-900">Other Settings</h3>
            {expandedSections.other ? (
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600" />
            )}
          </button>

          {expandedSections.other && (
            <div className="p-4 space-y-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reference Column
                </label>
                <select
                  value={config.reference_column}
                  onChange={(e) =>
                    handleConfigChange("reference_column", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Retail valuation">Retail Valuation</option>
                  <option value="Retail price">Retail Price</option>
                  <option value="current_price">Current Price</option>
                  <option value="SIV">SIV (Market Value)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Rounding Mode
                </label>
                <select
                  value={config.rounding_mode}
                  onChange={(e) =>
                    handleConfigChange("rounding_mode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="exact">Exact</option>
                  <option value="49/99">49/99 Pricing</option>
                  <option value="ends_with_4_9">Ends with 4 or 9</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="weekend_hold"
                  checked={config.weekend_hold}
                  onChange={(e) =>
                    handleConfigChange("weekend_hold", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-neutral-300 accent-primary"
                />
                <label
                  htmlFor="weekend_hold"
                  className="text-sm font-medium text-neutral-700"
                >
                  Hold prices on weekends
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!readyToProcess || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            readyToProcess && !isProcessing
              ? "bg-blue-800 text-white hover:bg-blue-900"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
          }`}
        >
          <Play className="w-5 h-5" />
          {isProcessing ? "Processing..." : "Process File"}
        </button>
      </div>
    </div>
  );
}
