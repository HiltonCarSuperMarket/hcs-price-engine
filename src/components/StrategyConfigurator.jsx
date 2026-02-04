"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import { defaultConfig } from "@/lib/defaultConfig";
import AgeBandEditor from "./AgeBandEditor";
import RatingBandEditor from "./RatingBandEditor";
import TargetMatrixEditor from "./TargetMatrixEditor";

export default function StrategyConfigurator({ strategy, onSave, onCancel }) {
  const [config, setConfig] = useState(
    strategy || { ...defaultConfig, name: "New Strategy" },
  );
  const [activeTab, setActiveTab] = useState("basic");

  const handleBasicConfigChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAgeBandsChange = (bands) => {
    setConfig((prev) => ({
      ...prev,
      age_bands: bands,
    }));
  };

  const handleRatingBandsChange = (bands) => {
    setConfig((prev) => ({
      ...prev,
      rating_bands: bands,
    }));
  };

  const handleTargetMatrixChange = (matrix) => {
    setConfig((prev) => ({
      ...prev,
      target_matrix: matrix,
    }));
  };

  const handleSave = () => {
    if (!config.name || config.name.trim() === "") {
      alert("Strategy name is required");
      return;
    }
    
    // Validate age bands
    const ageBands = config.age_bands || [];
    if (ageBands.length > 0) {
      if (ageBands[0].min !== 0) {
        alert("First age band must start at 0");
        return;
      }
      if (ageBands[ageBands.length - 1].max !== undefined) {
        alert("Last age band must be open-ended (no maximum)");
        return;
      }
    }
    
    onSave(config);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          {[
            { id: "basic", label: "Basic Settings" },
            { id: "age", label: "Age Bands" },
            { id: "rating", label: "Rating Bands" },
            { id: "matrix", label: "Target Matrix" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "basic" && (
            <BasicSettings config={config} onChange={handleBasicConfigChange} />
          )}
          {activeTab === "age" && (
            <AgeBandEditor
              bands={config.age_bands}
              onChange={handleAgeBandsChange}
            />
          )}
          {activeTab === "rating" && (
            <RatingBandEditor
              bands={config.rating_bands}
              onChange={handleRatingBandsChange}
            />
          )}
          {activeTab === "matrix" && (
            <TargetMatrixEditor
              matrix={config.target_matrix}
              ageBands={config.age_bands}
              ratingBands={config.rating_bands}
              onChange={handleTargetMatrixChange}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Strategy
        </button>
      </div>
    </div>
  );
}

function BasicSettings({ config, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Strategy Name
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          value={config.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Reference Column
          </label>
          <select
            value={config.reference_column}
            onChange={(e) => onChange("reference_column", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Retail valuation">Retail Valuation</option>
            <option value="Retail price">Retail Price</option>
            <option value="current_price">Current Price</option>
            <option value="SIV">SIV</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tolerance Type
          </label>
          <select
            value={config.tolerance_type}
            onChange={(e) => onChange("tolerance_type", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed Amount (£)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tolerance Value
          </label>
          <input
            type="number"
            value={config.tolerance_value}
            onChange={(e) =>
              onChange("tolerance_value", parseFloat(e.target.value))
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Stale Days Threshold
          </label>
          <input
            type="number"
            value={config.stale_days}
            onChange={(e) => onChange("stale_days", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nudge Type
          </label>
          <select
            value={config.nudge_type}
            onChange={(e) => onChange("nudge_type", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed Amount (£)</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nudge Value
          </label>
          <input
            type="number"
            value={config.nudge_value}
            onChange={(e) =>
              onChange("nudge_value", parseFloat(e.target.value))
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rounding Mode
          </label>
          <select
            value={config.rounding_mode}
            onChange={(e) => onChange("rounding_mode", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="exact">Exact</option>
            <option value="nearest">Nearest</option>
            <option value="49/99">49/99 Pricing</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.weekend_hold}
              onChange={(e) => onChange("weekend_hold", e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-700">
              Hold on Weekends
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
