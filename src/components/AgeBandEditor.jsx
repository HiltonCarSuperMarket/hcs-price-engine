"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function AgeBandEditor({ bands, onChange }) {
  const [newBand, setNewBand] = useState("");

  const addBand = () => {
    if (newBand.trim() && !bands.includes(newBand.trim())) {
      onChange([...bands, newBand.trim()]);
      setNewBand("");
    }
  };

  const removeBand = (band) => {
    onChange(bands.filter((b) => b !== band));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Age Bands
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Define the age bands (in days) used for pricing decisions. These bands
          will be matched against vehicle mileage/age data.
        </p>
      </div>

      <div className="space-y-3">
        {bands.map((band) => (
          <div
            key={band}
            className="flex items-center justify-between bg-neutral-50 p-4 rounded-lg border border-neutral-200"
          >
            <span className="font-medium text-neutral-900">{band} days</span>
            <button
              onClick={() => removeBand(band)}
              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
              title="Delete band"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newBand}
            onChange={(e) => setNewBand(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") addBand();
            }}
            placeholder="e.g., 200-250 or just a description"
            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            onClick={addBand}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Band
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-sm text-amber-800">
          Note: Make sure the age bands you define here match the ones used in
          the rating bands and target matrix.
        </p>
      </div>
    </div>
  );
}
