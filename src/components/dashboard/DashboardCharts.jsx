"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  Cell,
} from "recharts";

const CHART_COLORS = {
  teal: "#00dbcc",
  green: "#10b981",
  greenLight: "#34d399",
  red: "#ef4444",
  redLight: "#f87171",
  purple: "#914f9e",
  muted: "#94a3b8",
  grid: "rgba(255,255,255,0.05)",
};

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#f8fafc",
};

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2 text-xs">
      <p className="font-semibold text-teal-300 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function NetImpactTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v) =>
                `${v >= 0 ? "+" : "-"}£${Math.abs(v).toLocaleString("en-GB")}`
              }
            />
          }
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
        <Area
          type="monotone"
          dataKey="net"
          name="Net Impact"
          stroke={CHART_COLORS.teal}
          fill="url(#netGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AdjustmentBreakdownChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fill: CHART_COLORS.muted, fontSize: 9 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: CHART_COLORS.muted }}
        />
        <Bar
          dataKey="pcUp"
          name="Price Change Up"
          stackId="a"
          fill={CHART_COLORS.green}
        />
        <Bar
          dataKey="prUp"
          name="Price Refresh Up"
          stackId="a"
          fill={CHART_COLORS.greenLight}
        />
        <Bar
          dataKey="pcDownNeg"
          name="Price Change Down"
          stackId="a"
          fill={CHART_COLORS.red}
        />
        <Bar
          dataKey="prDownNeg"
          name="Price Refresh Down"
          stackId="a"
          fill={CHART_COLORS.redLight}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UnitsTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: "11px", color: CHART_COLORS.muted }} />
        <Line
          type="monotone"
          dataKey="units"
          name="Units Processed"
          stroke={CHART_COLORS.purple}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="modifiedCount"
          name="Modified Items"
          stroke={CHART_COLORS.teal}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function NoChangePctChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />
          }
        />
        <Line
          type="monotone"
          dataKey="noChangePct"
          name="No Change %"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="changeIntensity"
          name="Change Intensity %"
          stroke={CHART_COLORS.red}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CorrelationScatterChart({ data, xKey, yKey, xLabel, yLabel }) {
  const scatterData = data.map((row) => ({
    x: row[xKey],
    y: row[yKey],
    dateStr: row.dateStr,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          label={{
            value: xLabel,
            position: "insideBottom",
            offset: -5,
            fill: CHART_COLORS.muted,
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          label={{
            value: yLabel,
            angle: -90,
            position: "insideLeft",
            fill: CHART_COLORS.muted,
            fontSize: 11,
          }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload;
            return (
              <div style={tooltipStyle} className="px-3 py-2 text-xs">
                <p className="font-semibold text-teal-300 mb-1">
                  {point.dateStr}
                </p>
                <p>
                  {xLabel}: {typeof point.x === "number" ? point.x.toFixed(2) : point.x}
                </p>
                <p>
                  {yLabel}: {typeof point.y === "number" ? point.y.toFixed(2) : point.y}
                </p>
              </div>
            );
          }}
        />
        <Scatter data={scatterData} fill={CHART_COLORS.teal} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function WeekendComparisonChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="label"
          tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          tickFormatter={(v) =>
            `${v >= 0 ? "+" : "-"}£${Math.abs(v).toLocaleString("en-GB")}`
          }
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v) =>
                `${v >= 0 ? "+" : "-"}£${Math.abs(v).toLocaleString("en-GB")}`
              }
            />
          }
        />
        <Bar dataKey="avgNet" name="Avg Net Impact" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.avgNet >= 0 ? CHART_COLORS.green : CHART_COLORS.red}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
