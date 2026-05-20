"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  FolderKanban, CheckCircle2, AlertTriangle, TrendingUp,
  BarChart3, Clock, ChevronLeft, ChevronRight, Zap,
  CalendarDays, Target, ArrowUpRight, Flame,
} from "lucide-react";
import { TaskTrendChart } from "@/frontend/components/dashboard/TaskTrendChart";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

interface DeadlineTask {
  id: string; title: string; status: string;
  priority: string; dueDate: string;
  project: { id: string; name: string };
}

interface DashboardStats {
  projects: { total: number; active: number; completed: number };
  tasks: { total: number; done: number; inProgress: number; overdue: number; completionRate: number };
  recentProjects: { id: string; name: string; status: ProjectStatus; updatedAt: string; _count: { tasks: number } }[];
  tasksByPriority: { priority: string; _count: { priority: number } }[];
  taskTrend: { month: string; created: number; completed: number }[];
  deadlineTasks: DeadlineTask[];
}

const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-500", ON_HOLD: "bg-amber-500",
  COMPLETED: "bg-indigo-500", ARCHIVED: "bg-neutral-400",
};
const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed", ARCHIVED: "Archived",
};
const STATUS_STYLES: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-500", ON_HOLD: "bg-amber-500/10 text-amber-500",
  COMPLETED: "bg-indigo-500/10 text-indigo-500", ARCHIVED: "bg-neutral-500/10 text-neutral-400",
};

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [value, count, rounded]);
  return <span>{display}{suffix}</span>;
}

// ─── Circular Progress ─────────────────────────────────────────────────────────

function CircularProgress({ value, size = 80, stroke = 6, color = "#6366f1" }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} className="text-neutral-100 dark:text-neutral-800" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function Greeting({ name }: { name?: string | null }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
        {greeting}{name ? `, ${name.split(" ")[0]}` : ""}! <span>{emoji}</span>
      </h1>
      <p suppressHydrationWarning className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {time.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        {" · "}
        <span className="text-indigo-500 font-medium">
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </p>
    </motion.div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, suffix = "", sub, icon: Icon, gradient, delay, urgent }: {
  title: string; value: number; suffix?: string; sub?: string;
  icon: React.ElementType; gradient: string; delay: number; urgent?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 200 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 cursor-default"
    >
      {/* Gradient bg on hover */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0`}
        animate={{ opacity: hovered ? 0.05 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Subtle animated orb */}
      <motion.div
        className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`}
        animate={{ scale: hovered ? 1.3 : 1 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-black text-neutral-900 dark:text-white mt-2 tabular-nums">
            <AnimatedNumber value={value} suffix={suffix} />
          </h3>
          {sub && <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{sub}</p>}
        </div>
        <motion.div
          animate={{ rotate: hovered ? 10 : 0, scale: hovered ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {urgent && value > 0 && (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute top-3 left-3 w-2 h-2 rounded-full bg-red-500"
        />
      )}
    </motion.div>
  );
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ deadlineTasks }: { deadlineTasks: DeadlineTask[] }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [selected, setSelected] = useState<string | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  // Build deadline map: "yyyy-m-d" → tasks[]
  const deadlineMap = new Map<string, DeadlineTask[]>();
  for (const t of deadlineTasks) {
    if (!t.dueDate) continue;
    const d = new Date(t.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!deadlineMap.has(key)) deadlineMap.set(key, []);
    deadlineMap.get(key)!.push(t);
  }

  const selectedTasks = selected ? (deadlineMap.get(selected) ?? []) : [];

  const cells: { day: number; key: string; current: boolean }[] = [];
  // prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, key: `prev-${i}`, current: false });
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${year}-${month}-${d}`, current: true });
  }
  // next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, key: `next-${d}`, current: false });
  }

  const getDotColor = (tasks: DeadlineTask[]) => {
    const now = new Date();
    if (tasks.some((t) => t.status !== "DONE" && new Date(t.dueDate) < now)) return "bg-red-500";
    if (tasks.some((t) => t.status === "DONE")) return "bg-emerald-500";
    return "bg-amber-500";
  };

  const monthTasks = deadlineTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Deadline Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 min-w-[80px] text-center">
            {current.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          <button type="button" onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <span className="text-xs text-neutral-400">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{monthTasks.length}</span> deadline{monthTasks.length !== 1 ? "s" : ""} this month
        </span>
        {monthTasks.filter((t) => t.status !== "DONE" && new Date(t.dueDate) < today).length > 0 && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
            {monthTasks.filter((t) => t.status !== "DONE" && new Date(t.dueDate) < today).length} overdue
          </span>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-neutral-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-1 flex-1">
        {cells.map((cell) => {
          const tasks = cell.current ? (deadlineMap.get(cell.key) ?? []) : [];
          const isToday = cell.key === todayStr;
          const isSelected = cell.key === selected;
          const hasTasks = tasks.length > 0;

          return (
            <motion.button
              key={cell.key + cell.day}
              type="button"
              disabled={!cell.current}
              onClick={() => setSelected(isSelected ? null : cell.key)}
              whileHover={cell.current ? { scale: 1.15 } : {}}
              whileTap={cell.current ? { scale: 0.95 } : {}}
              className={`relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors ${
                !cell.current ? "text-neutral-300 dark:text-neutral-700 cursor-default" :
                isSelected ? "bg-indigo-600 text-white" :
                isToday ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold ring-1 ring-indigo-300 dark:ring-indigo-500/30" :
                "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {cell.day}
              {hasTasks && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : getDotColor(tasks)}`} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <AnimatePresence>
        {selected && selectedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 overflow-hidden"
          >
            {selectedTasks.slice(0, 3).map((t) => {
              const overdue = t.status !== "DONE" && new Date(t.dueDate) < today;
              return (
                <Link key={t.id} href={`/dashboard/projects/${t.project.id}`}
                  className="flex items-center gap-2 group">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === "DONE" ? "bg-emerald-500" : overdue ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className={`text-xs truncate flex-1 group-hover:text-indigo-500 transition-colors ${t.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {t.title}
                  </span>
                  <span className="text-[10px] text-neutral-400 flex-shrink-0">{t.project.name.slice(0, 8)}</span>
                </Link>
              );
            })}
            {selectedTasks.length > 3 && (
              <p className="text-[10px] text-neutral-400 pl-3.5">+{selectedTasks.length - 3} more</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl ${className}`} />;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(() => {
    setLoading(true);
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshKey]);

  const today = new Date();
  const todayDeadlines = stats?.deadlineTasks.filter((t) => {
    const d = new Date(t.dueDate);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  }) ?? [];

  const upcomingDeadlines = stats?.deadlineTasks.filter((t) => {
    const d = new Date(t.dueDate);
    const diff = (d.getTime() - today.getTime()) / 86_400_000;
    return t.status !== "DONE" && diff >= 0 && diff <= 7;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) ?? [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <Greeting name={session?.user?.name} />
        <motion.button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl transition-colors flex-shrink-0"
        >
          <Zap className="w-3.5 h-3.5" /> Refresh
        </motion.button>
      </div>

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Projects"   value={stats?.projects.total ?? 0}
            sub={`${stats?.projects.active ?? 0} active · ${stats?.projects.completed ?? 0} done`}
            icon={FolderKanban} gradient="from-indigo-500 to-violet-600" delay={0} />
          <StatCard title="Total Tasks"      value={stats?.tasks.total ?? 0}
            sub={`${stats?.tasks.inProgress ?? 0} in progress`}
            icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" delay={0.07} />
          <StatCard title="Completion Rate"  value={stats?.tasks.completionRate ?? 0} suffix="%"
            sub={`${stats?.tasks.done ?? 0} of ${stats?.tasks.total ?? 0} tasks done`}
            icon={Target} gradient="from-blue-500 to-cyan-500" delay={0.14} />
          <StatCard title="Overdue Tasks"    value={stats?.tasks.overdue ?? 0}
            sub={stats?.tasks.overdue ? "Needs immediate attention" : "All on track ✓"}
            icon={AlertTriangle} gradient="from-red-500 to-rose-600" delay={0.21} urgent />
        </div>
      )}

      {/* ── Progress ring + quick stats ── */}
      {!loading && stats && stats.tasks.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Progress ring */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <CircularProgress value={stats.tasks.completionRate} size={72} stroke={7} color="#6366f1" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {stats.tasks.completionRate}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Overall Progress</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                {stats.tasks.done} <span className="text-neutral-400 font-normal text-sm">/ {stats.tasks.total}</span>
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">tasks completed</p>
            </div>
          </div>

          {/* Today's deadlines */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Due Today</p>
              {todayDeadlines.length > 0 && (
                <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {todayDeadlines.length}
                </span>
              )}
            </div>
            {todayDeadlines.length === 0 ? (
              <p className="text-xs text-neutral-400">No tasks due today 🎉</p>
            ) : (
              <div className="space-y-1.5">
                {todayDeadlines.slice(0, 3).map((t) => (
                  <Link key={t.id} href={`/dashboard/projects/${t.project.id}`}
                    className="flex items-center gap-2 group">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === "DONE" ? "bg-emerald-500" : "bg-orange-500"}`} />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate group-hover:text-indigo-500 transition-colors">{t.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming 7 days */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Next 7 Days</p>
              {upcomingDeadlines.length > 0 && (
                <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {upcomingDeadlines.length}
                </span>
              )}
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-neutral-400">No upcoming deadlines</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingDeadlines.slice(0, 3).map((t) => {
                  const diff = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / 86_400_000);
                  return (
                    <Link key={t.id} href={`/dashboard/projects/${t.project.id}`}
                      className="flex items-center gap-2 group">
                      <span className="text-[10px] font-bold text-blue-500 w-8 flex-shrink-0">
                        {diff === 0 ? "today" : `+${diff}d`}
                      </span>
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1 group-hover:text-indigo-500 transition-colors">{t.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Chart + Calendar row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Task Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="col-span-1 lg:col-span-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col"
          style={{ minHeight: 340 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Task Activity Trend</h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Tasks created vs completed per month — last 6 months.
          </p>
          <div className="flex-1 min-h-0">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <TaskTrendChart data={stats?.taskTrend ?? []} />
            )}
          </div>
        </motion.div>

        {/* Mini Calendar */}
        {loading ? (
          <Skeleton className="rounded-2xl h-80" />
        ) : (
          <MiniCalendar deadlineTasks={stats?.deadlineTasks ?? []} />
        )}
      </div>

      {/* ── Recent Projects + Priority ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="col-span-1 lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Projects</h3>
            </div>
            <Link href="/dashboard/projects"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (stats?.recentProjects.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <FolderKanban className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-400">No projects yet</p>
              <Link href="/dashboard/projects" className="mt-2 text-xs text-indigo-500 hover:underline">Create your first project</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52 + i * 0.06 }}
                >
                  <Link href={`/dashboard/projects/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[p.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.name}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">{p._count.tasks} tasks</span>
                    <span suppressHydrationWarning className="text-[10px] text-neutral-400 flex-shrink-0 hidden sm:block w-16 text-right">
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Priority Breakdown */}
        {stats && (stats.tasks.total > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Active Tasks by Priority</h3>
            </div>
            <div className="space-y-3">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((priority, idx) => {
                const found = stats.tasksByPriority.find((t) => t.priority === priority);
                const count = found?._count.priority ?? 0;
                const max = Math.max(...stats.tasksByPriority.map((t) => t._count.priority), 1);
                const pct = Math.round((count / max) * 100);
                const cfg = {
                  CRITICAL: { bar: "from-red-500 to-rose-600",     text: "text-red-500",    bg: "bg-red-50 dark:bg-red-500/10" },
                  HIGH:     { bar: "from-orange-500 to-amber-500", text: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
                  MEDIUM:   { bar: "from-amber-400 to-yellow-500", text: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-500/10" },
                  LOW:      { bar: "from-neutral-400 to-neutral-500", text: "text-neutral-500", bg: "bg-neutral-50 dark:bg-neutral-800" },
                }[priority];
                return (
                  <motion.div key={priority}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.57 + idx * 0.06 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{priority}</span>
                      <span className={`text-xs font-black tabular-nums ${cfg.text}`}>{count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6 + idx * 0.06, duration: 0.7, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "In Progress", value: stats.tasks.inProgress, color: "text-indigo-500" },
                  { label: "Overdue",     value: stats.tasks.overdue,    color: "text-red-500" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
