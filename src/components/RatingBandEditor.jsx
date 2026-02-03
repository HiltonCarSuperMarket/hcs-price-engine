"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function RatingBandEditor({ bands, onChange }) {
  const [newBand, setNewBand] = useState({
    name: "",
    min: "",
    max: "",
  });

  const addBand = () => {
    if (newBand.name.trim()) {
      const band = { name: newBand.name.trim() };
      if (newBand.min !== "") band.min = parseInt(newBand.min);
      if (newBand.max !== "") band.max = parseInt(newBand.max);

      onChange([...bands, band]);
      setNewBand({ name: "", min: "", max: "" });
    }
  };

  const removeBand = (bandName) => {
    onChange(bands.filter((b) => b.name !== bandName));
  };

  const updateBand = (index, field, value) => {
    const updated = [...bands];
    if (field === "min" || field === "max") {
      updated[index][field] = value === "" ? undefined : parseInt(value);
    } else {
      updated[index][field] = value;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Rating Bands
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Define rating bands with their score ranges. These bands are used to
          look up target prices in the pricing matrix.
        </p>
      </div>

      <div className="space-y-3">
        {bands.map((band, idx) => (
          <div
            key={band.name}
            className="bg-neutral-50 p-4 rounded-lg border border-neutral-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={band.name}
                    onChange={(e) => updateBand(idx, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Min Score
                  </label>
                  <input
                    type="number"
                    value={band.min !== undefined ? band.min : ""}
                    onChange={(e) => updateBand(idx, "min", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    value={band.max !== undefined ? band.max : ""}
                    onChange={(e) => updateBand(idx, "max", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No maximum"
                  />
                </div>
              </div>
              <button
                onClick={() => removeBand(band.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition mt-6"
                title="Delete band"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={newBand.name}
              onChange={(e) => setNewBand({ ...newBand, name: e.target.value })}
              placeholder="e.g., 78+"
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Min Score
              </label>
              <input
                type="number"
                value={newBand.min}
                onChange={(e) =>
                  setNewBand({ ...newBand, min: e.target.value })
                }
                placeholder="Optional"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Max Score
              </label>
              <input
                type="number"
                value={newBand.max}
                onChange={(e) =>
                  setNewBand({ ...newBand, max: e.target.value })
                }
                placeholder="Optional"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          <button
            onClick={addBand}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Band
          </button>
        </div>
      </div>
    </div>
  );
}
