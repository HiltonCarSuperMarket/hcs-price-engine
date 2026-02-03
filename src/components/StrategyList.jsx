"use client";

import { Trash2 } from "lucide-react";

export default function StrategyList({
  strategies,
  selectedStrategy,
  onSelect,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200">
        <h2 className="font-semibold text-neutral-900">Available Strategies</h2>
      </div>

      <div className="divide-y divide-neutral-200 max-h-96 overflow-y-auto">
        {strategies.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500 text-center">
            No strategies found
          </div>
        ) : (
          strategies.map((strategy) => (
            <div
              key={strategy.name}
              className={`p-4 cursor-pointer transition ${
                selectedStrategy?.name === strategy.name
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : "hover:bg-neutral-50"
              }`}
              onClick={() => onSelect(strategy)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900">
                    {strategy.name}
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    {strategy.description}
                  </p>
                </div>
                {strategy.name !== "Default Strategy" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(strategy.name);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete strategy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
