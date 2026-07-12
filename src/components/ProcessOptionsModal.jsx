"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProcessOptionsModal({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}) {
  const [includePriceUp, setIncludePriceUp] = useState(true);
  const [includePriceDown, setIncludePriceDown] = useState(true);

  const handleConfirm = () => {
    if (!includePriceUp && !includePriceDown) return;
    onConfirm({ includePriceUp, includePriceDown });
  };

  const handleOpenChange = (nextOpen) => {
    if (!isProcessing) {
      if (nextOpen) {
        setIncludePriceUp(true);
        setIncludePriceDown(true);
      }
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={!isProcessing}>
        <DialogHeader>
          <DialogTitle>Processing Options</DialogTitle>
          <DialogDescription>
            Choose which price directions to include in this run. Only selected
            changes will be applied, exported, and saved to logs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              includePriceUp
                ? "border-emerald-500/50 bg-emerald-950/30"
                : "border-white/10 bg-slate-800/50 hover:border-white/20"
            }`}
          >
            <input
              type="checkbox"
              checked={includePriceUp}
              onChange={(e) => setIncludePriceUp(e.target.checked)}
              disabled={isProcessing}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-[#00dbcc] focus:ring-[#00dbcc] focus:ring-offset-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-slate-50">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Price Up
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Apply increases to target price. Excludes decreases and down
                nudges.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              includePriceDown
                ? "border-red-500/50 bg-red-950/30"
                : "border-white/10 bg-slate-800/50 hover:border-white/20"
            }`}
          >
            <input
              type="checkbox"
              checked={includePriceDown}
              onChange={(e) => setIncludePriceDown(e.target.checked)}
              disabled={isProcessing}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-[#00dbcc] focus:ring-[#00dbcc] focus:ring-offset-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-slate-50">
                <TrendingDown className="w-4 h-4 text-red-400" />
                Price Down
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Apply decreases to target and down nudges within tolerance.
                Excludes price increases.
              </p>
            </div>
          </label>
        </div>

        {!includePriceUp && !includePriceDown && (
          <p className="text-xs text-amber-400 mt-2">
            Select at least one direction to continue.
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || (!includePriceUp && !includePriceDown)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#00dbcc] text-slate-900 font-semibold hover:bg-teal-400 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Start Processing"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
