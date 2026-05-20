"use client";

import { useTheme } from "next-themes";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  month: string;
  created: number;
  completed: number;
}

interface TaskTrendChartProps {
  data: TrendPoint[];
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, isDark }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-4 py-3 rounded-2xl border shadow-xl text-sm ${
      isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"
    }`}>
      <p className={`font-bold mb-2 ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className={`font-bold tabular-nums ${isDark ? "text-white" : "text-neutral-900"}`}>
            {p.value} task(s)
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskTrendChart({ data }: TaskTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor  = isDark ? "#262626" : "#f0f0f0";
  const axisColor  = isDark ? "#525252" : "#a3a3a3";
  const createdColor   = isDark ? "#818cf8" : "#4f46e5";   // indigo
  const completedColor = isDark ? "#34d399" : "#059669";   // emerald

  // If all zeros, show an empty state hint
  const hasData = data.some((d) => d.created > 0 || d.completed > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={createdColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={createdColor} stopOpacity={0.5} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={gridColor}
        />

        <XAxis
          dataKey="month"
          stroke={axisColor}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={6}
        />

        <YAxis
          stroke={axisColor}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
          tickFormatter={(v) => (v === 0 && !hasData ? "" : String(v))}
        />

        <Tooltip
          content={<CustomTooltip isDark={isDark} />}
          cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 8 }}
        />

        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "14px" }}
          formatter={(value) => (
            <span style={{ color: axisColor, fontWeight: 500 }}>{value}</span>
          )}
        />

        {/* Bar — Tasks Created */}
        <Bar
          dataKey="created"
          name="Tasks Created"
          fill="url(#barCreated)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />

        {/* Line — Tasks Completed */}
        <Line
          type="monotone"
          dataKey="completed"
          name="Tasks Completed"
          stroke={completedColor}
          strokeWidth={2.5}
          dot={{ fill: completedColor, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
