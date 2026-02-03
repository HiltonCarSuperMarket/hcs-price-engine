export default function StatCard({
  label,
  value,
  description,
  icon,
  color = "blue",
}) {
  let colorClass = "bg-blue-50 border-blue-200 text-blue-700";
  let accentClass = "text-blue-600";

  if (color === "green") {
    colorClass = "bg-green-50 border-green-200 text-green-700";
    accentClass = "text-green-600";
  } else if (color === "accent") {
    colorClass = "bg-cyan-50 border-cyan-200 text-cyan-700";
    accentClass = "text-cyan-600";
  } else if (color === "warning") {
    colorClass = "bg-amber-50 border-amber-200 text-amber-700";
    accentClass = "text-amber-600";
  } else if (color === "red") {
    colorClass = "bg-red-50 border-red-200 text-red-700";
    accentClass = "text-red-600";
  }

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${colorClass}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        {icon && <div className={accentClass}>{icon}</div>}
      </div>

      <p className="text-3xl font-bold text-neutral-900 mb-1">{value}</p>

      <p className="text-xs text-neutral-600">{description}</p>
    </div>
  );
}
