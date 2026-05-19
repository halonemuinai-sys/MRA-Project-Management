"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, BarChart3, Clock, Tag } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import Link from "next/link";

interface AnalyticsData {
  projectsByStatus: { status: string; _count: { status: number } }[];
  tasksByStatus: { status: string; _count: { status: number } }[];
  tasksByPriority: { priority: string; _count: { priority: number } }[];
  recentTasks: {
    id: string; title: string; status: string; priority: string;
    createdAt: string;
    project: { id: string; name: string };
    assignee: { name: string | null; email: string | null } | null;
  }[];
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif", ON_HOLD: "Ditahan", COMPLETED: "Selesai", ARCHIVED: "Arsip",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

const PROJECT_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#9ca3af"];
const TASK_COLORS   = ["#94a3b8", "#6366f1", "#f59e0b", "#10b981"];
const PRIORITY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#94a3b8"];

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-500 dark:bg-red-500/10",
  HIGH:     "bg-orange-50 text-orange-500 dark:bg-orange-500/10",
  MEDIUM:   "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
  LOW:      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800",
};

const STATUS_BADGE: Record<string, string> = {
  TODO:        "bg-neutral-100 text-neutral-500 dark:bg-neutral-800",
  IN_PROGRESS: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10",
  IN_REVIEW:   "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
  DONE:        "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10",
};

function ChartCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const projectChartData = data.projectsByStatus.map((d) => ({
    name: PROJECT_STATUS_LABELS[d.status] ?? d.status,
    value: d._count.status,
  }));

  const taskChartData = data.tasksByStatus.map((d) => ({
    name: TASK_STATUS_LABELS[d.status] ?? d.status,
    value: d._count.status,
  }));

  const priorityChartData = data.tasksByPriority.map((d) => ({
    name: PRIORITY_LABELS[d.priority] ?? d.priority,
    value: d._count.priority,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analitik</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Visualisasi performa proyek dan tugas Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by status — Pie */}
        <ChartCard title="Distribusi Status Proyek" icon={BarChart3}>
          {projectChartData.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectChartData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  paddingAngle={3} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {projectChartData.map((_, i) => (
                    <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Tasks by status — Bar */}
        <ChartCard title="Tugas per Status" icon={BarChart3}>
          {taskChartData.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tugas" radius={[6, 6, 0, 0]}>
                  {taskChartData.map((_, i) => (
                    <Cell key={i} fill={TASK_COLORS[i % TASK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Tasks by priority — Bar */}
        <ChartCard title="Tugas per Prioritas" icon={Tag}>
          {priorityChartData.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tugas" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((_, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Proyek",     value: data.projectsByStatus.reduce((a, b) => a + b._count.status, 0),  color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Total Tugas",      value: data.tasksByStatus.reduce((a, b) => a + b._count.status, 0),     color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Tugas Selesai",    value: data.tasksByStatus.find((d) => d.status === "DONE")?._count.status ?? 0, color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-500/10" },
          { label: "Tugas Critical",   value: data.tasksByPriority.find((d) => d.priority === "CRITICAL")?._count.priority ?? 0, color: "text-red-500",    bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-2xl p-5 ${s.bg} border border-neutral-200/50 dark:border-white/5`}
          >
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent tasks */}
      <ChartCard title="10 Tugas Terbaru" icon={Clock}>
        {data.recentTasks.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">Belum ada tugas</p>
        ) : (
          <div className="space-y-2">
            {data.recentTasks.map((task, i) => (
              <motion.div key={task.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{task.title}</p>
                  <Link href={`/dashboard/projects/${task.project.id}`}
                    className="text-xs text-indigo-500 hover:underline truncate"
                  >
                    {task.project.name}
                  </Link>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] ?? ""}`}>
                  {PRIORITY_LABELS[task.priority] ?? task.priority}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status] ?? ""}`}>
                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                </span>
                <span suppressHydrationWarning className="text-[10px] text-neutral-400 flex-shrink-0">
                  {new Date(task.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
