export default function StatCard({
  label,
  value,
  description,
  icon,
  color = "default",
}) {
  const borderColors = {
    default: "border-l-[#00dbcc]",
    blue: "border-l-[#00dbcc]",
    green: "border-l-emerald-500",
    accent: "border-l-cyan-400",
    warning: "border-l-amber-500",
    red: "border-l-red-500",
  };

  const accentClass =
    color === "green"
      ? "text-emerald-400"
      : color === "red"
        ? "text-red-400"
        : color === "warning"
          ? "text-amber-400"
          : "text-[#00dbcc]";

  return (
    <div
      className={`bg-slate-800 border border-white/5 rounded-2xl p-4 border-l-4 ${borderColors[color] || borderColors.default} hover:border-teal-400/30 transition-all`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        {icon && <div className={accentClass}>{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-slate-50 mb-1">{value}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}
