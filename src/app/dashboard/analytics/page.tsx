"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  CheckCircle2, Clock, AlertTriangle, Zap, Timer, Users,
  TrendingUp, Target, Activity, BarChart3, Loader2,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, BarChart, PieChart, Pie, Legend,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KpiSummary {
  completionRate: number; onTimeRate: number; overdueRate: number;
  avgCompletionDays: number; velocityLast30: number; totalTimeTrackedHours: number;
  totalTasks: number; doneTasks: number; overdueTasks: number;
  totalProjects: number; totalMembers: number;
}

interface VelocityPoint  { label: string; completed: number; created: number }
interface ProjectHealth  { id: string; name: string; status: string; total: number; done: number; overdue: number; completionRate: number; onTimeRate: number; healthScore: number }
interface TeamMember     { userId: string; name: string; assigned: number; completed: number }
interface PriorityPoint  { priority: string; total: number; done: number }

interface KpiData {
  summary: KpiSummary;
  velocity: VelocityPoint[];
  projectHealth: ProjectHealth[];
  teamProductivity: TeamMember[];
  priorityBreakdown: PriorityPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function healthColor(score: number) {
  if (score >= 80) return { text: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", bar: "bg-emerald-500", label: "Excellent" };
  if (score >= 60) return { text: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20",       bar: "bg-blue-500",    label: "Good" };
  if (score >= 40) return { text: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20",     bar: "bg-amber-500",   label: "Fair" };
  return               { text: "text-red-500",       bg: "bg-red-500/10 border-red-500/20",         bar: "bg-red-500",     label: "At Risk" };
}

function rateColor(rate: number, inverse = false) {
  const good = inverse ? rate <= 20 : rate >= 80;
  const mid  = inverse ? rate <= 40 : rate >= 60;
  if (good) return "text-emerald-500";
  if (mid)  return "text-amber-500";
  return      "text-red-500";
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, unit = "", sub, icon: Icon, iconBg, iconColor, valueColor, delay }: {
  label: string; value: string | number; unit?: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  valueColor?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-black tabular-nums ${valueColor ?? "text-neutral-900 dark:text-white"}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-neutral-400 font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, isDark }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string; isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3.5 py-2.5 rounded-xl border shadow-xl text-sm ${isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"}`}>
      <p className={`font-bold text-xs mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className={`font-bold text-xs tabular-nums ${isDark ? "text-white" : "text-neutral-900"}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Priority colors ──────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { bar: string; text: string }> = {
  CRITICAL: { bar: "#ef4444", text: "text-red-500" },
  HIGH:     { bar: "#f97316", text: "text-orange-500" },
  MEDIUM:   { bar: "#f59e0b", text: "text-amber-500" },
  LOW:      { bar: "#94a3b8", text: "text-slate-400" },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function KpiPage() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const axisColor  = isDark ? "#525252" : "#a3a3a3";
  const gridColor  = isDark ? "#262626" : "#f0f0f0";

  useEffect(() => {
    fetch("/api/dashboard/kpi")
      .then((r) => {
        if (!r.ok) { setError(`Server error ${r.status}`); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setData(d); } setLoading(false); })
      .catch((e) => { setError(e.message ?? "Failed to load"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-neutral-400">Calculating KPIs...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">Failed to load KPI data</h3>
        <p className="text-sm text-neutral-400 mb-5">{error || "No data available. Please make sure you have projects and tasks."}</p>
        <button type="button" onClick={() => { setError(""); setLoading(true); fetch("/api/dashboard/kpi").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setData(d); setLoading(false); }).catch(() => setLoading(false)); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const { summary, velocity, projectHealth, teamProductivity, priorityBreakdown } = data;

  const completionPie = [
    { name: "Completed", value: summary.doneTasks },
    { name: "Overdue",   value: summary.overdueTasks },
    { name: "Ongoing",   value: summary.totalTasks - summary.doneTasks - summary.overdueTasks },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = ["#22c55e", "#ef4444", "#94a3b8"];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">KPI & Analytics</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Real-time project performance — {summary.totalProjects} projects · {summary.totalMembers} members · {summary.totalTasks} tasks
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Live Data</span>
        </div>
      </div>

      {/* ── KPI Cards Row 1 ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Completion Rate" value={summary.completionRate} unit="%"
          sub={`${summary.doneTasks}/${summary.totalTasks} tasks`}
          icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor={rateColor(summary.completionRate)} delay={0}
        />
        <KpiCard
          label="On-Time Rate" value={summary.onTimeRate} unit="%"
          sub="Tasks completed on time"
          icon={Target} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-600 dark:text-blue-400"
          valueColor={rateColor(summary.onTimeRate)} delay={0.05}
        />
        <KpiCard
          label="Overdue Rate" value={summary.overdueRate} unit="%"
          sub={`${summary.overdueTasks} overdue tasks`}
          icon={AlertTriangle} iconBg="bg-red-50 dark:bg-red-500/10" iconColor="text-red-500 dark:text-red-400"
          valueColor={rateColor(summary.overdueRate, true)} delay={0.1}
        />
        <KpiCard
          label="Velocity (30d)" value={summary.velocityLast30} unit=" tasks"
          sub="Completed this month"
          icon={Zap} iconBg="bg-violet-50 dark:bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400"
          delay={0.15}
        />
        <KpiCard
          label="Avg. Completion" value={summary.avgCompletionDays} unit=" days"
          sub="Average completion time"
          icon={Clock} iconBg="bg-amber-50 dark:bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
          delay={0.2}
        />
        <KpiCard
          label="Time Tracked" value={summary.totalTimeTrackedHours} unit=" hrs"
          sub="Total hours logged"
          icon={Timer} iconBg="bg-cyan-50 dark:bg-cyan-500/10" iconColor="text-cyan-600 dark:text-cyan-400"
          delay={0.25}
        />
      </div>

      {/* ── Velocity + Completion Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity trend */}
        <Section title="Weekly Trend — Created vs Completed" icon={TrendingUp} delay={0.3}>
          <div className="lg:col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={velocity} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={6} />
                <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={(v) => <span style={{ color: axisColor }}>{v}</span>} />
                <Bar dataKey="created"   name="Created"   fill={isDark ? "#3b82f6" : "#2563eb"} fillOpacity={0.7} radius={[4,4,0,0]} maxBarSize={32} />
                <Line dataKey="completed" name="Completed" stroke={isDark ? "#34d399" : "#059669"} strokeWidth={2.5} dot={{ fill: isDark ? "#34d399" : "#059669", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Completion Pie */}
        <Section title="Task Status Distribution" icon={BarChart3} delay={0.35}>
          {completionPie.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-neutral-400">No data yet</p>
            </div>
          ) : (
            <div className="h-56 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionPie} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}
                  >
                    {completionPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: axisColor }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      {/* ── Project Health Table ── */}
      <Section title="Project Health Score" icon={Activity} delay={0.4}>
        {projectHealth.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No projects yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  {["Project", "Total", "Done", "Overdue", "Completion", "On-Time", "Health Score"].map((h) => (
                    <th key={h} className="pb-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectHealth.map((p, i) => {
                  const hc = healthColor(p.healthScore);
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.42 + i * 0.04 }}
                      className="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 pl-0 pr-3">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">{p.name}</p>
                      </td>
                      <td className="py-3 px-3 text-sm text-neutral-500 tabular-nums">{p.total}</td>
                      <td className="py-3 px-3 text-sm font-medium text-emerald-500 tabular-nums">{p.done}</td>
                      <td className="py-3 px-3 text-sm font-medium text-red-500 tabular-nums">{p.overdue}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.completionRate}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums w-8">{p.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-sm font-semibold tabular-nums ${rateColor(p.onTimeRate)}`}>{p.onTimeRate}%</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${hc.bg} ${hc.text}`}>
                            {p.healthScore}
                          </div>
                          <span className={`text-[10px] font-bold ${hc.text}`}>{hc.label}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Team Productivity + Priority Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Team Productivity */}
        <Section title="Team Productivity" icon={Users} delay={0.5}>
          {teamProductivity.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {teamProductivity.slice(0, 8).map((m, i) => {
                const rate = m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0;
                return (
                  <motion.div key={m.userId}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.52 + i * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{m.name}</span>
                        <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">{m.completed}/{m.assigned}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ delay: 0.55 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-bold tabular-nums w-10 text-right flex-shrink-0 ${rateColor(rate)}`}>{rate}%</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Priority Breakdown */}
        <Section title="Completion by Priority" icon={BarChart3} delay={0.55}>
          {priorityBreakdown.every((p) => p.total === 0) ? (
            <p className="text-sm text-neutral-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={priorityBreakdown.map((p) => ({
                  name: p.priority === "CRITICAL" ? "Critical" : p.priority.charAt(0) + p.priority.slice(1).toLowerCase(),
                  Total: p.total,
                  Done: p.done,
                  priority: p.priority,
                }))}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={(v) => <span style={{ color: axisColor }}>{v}</span>} />
                <Bar dataKey="Total" name="Total" maxBarSize={36} radius={[4, 4, 0, 0]}>
                  {priorityBreakdown.map((p, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[p.priority]?.bar ?? "#94a3b8"} fillOpacity={0.3} />
                  ))}
                </Bar>
                <Bar dataKey="Done" name="Done" maxBarSize={36} radius={[4, 4, 0, 0]}>
                  {priorityBreakdown.map((p, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[p.priority]?.bar ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>
    </div>
  );
}
