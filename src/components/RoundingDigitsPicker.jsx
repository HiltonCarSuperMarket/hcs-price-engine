"use client";

import { ALL_DIGITS, parseRoundingDigits } from "@/lib/roundingUtils";

export default function RoundingDigitsPicker({
  config,
  digits,
  onChange,
  variant = "light",
}) {
  const selected = Array.isArray(digits)
    ? digits
    : parseRoundingDigits(config || {});

  const toggleDigit = (digit) => {
    const next = selected.includes(digit)
      ? selected.filter((d) => d !== digit)
      : [...selected, digit].sort((a, b) => a - b);

    if (next.length === 0) return;
    onChange(next);
  };

  const isDark = variant === "dark";
  const labelClass = isDark
    ? "block text-sm font-semibold text-slate-300 mb-2"
    : "block text-sm font-medium text-neutral-700 mb-2";
  const hintClass = isDark
    ? "text-xs text-slate-400 mt-2"
    : "text-xs text-neutral-500 mt-2";
  const buttonClass = (active) =>
    isDark
      ? `flex items-center justify-center h-10 rounded-lg border text-sm font-semibold transition-all ${
          active
            ? "bg-[#00dbcc] border-[#00dbcc] text-slate-900"
            : "bg-slate-950 border-white/10 text-slate-300 hover:border-[#00dbcc]"
        }`
      : `flex items-center justify-center h-10 rounded-lg border text-sm font-semibold transition-all ${
          active
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white border-neutral-300 text-neutral-700 hover:border-blue-500"
        }`;

  return (
    <div>
      <label className={labelClass}>Ending Digits (0-9)</label>
      <div className="grid grid-cols-5 gap-2">
        {ALL_DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => toggleDigit(digit)}
            className={buttonClass(selected.includes(digit))}
            aria-pressed={selected.includes(digit)}
          >
            {digit}
          </button>
        ))}
      </div>
      <p className={hintClass}>
        Select one or more digits. Prices round to the nearest selected ending.
        Values ending in 99 are kept unchanged.
      </p>
    </div>
  );
}
