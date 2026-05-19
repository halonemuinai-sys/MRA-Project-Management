"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, CheckCircle2, Loader2, AlertTriangle,
  TrendingUp, BarChart3, Clock,
} from "lucide-react";
import { RevenueChart } from "@/frontend/components/dashboard/RevenueChart";
import Link from "next/link";

type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

interface RecentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  updatedAt: string;
  _count: { tasks: number };
}

interface DashboardStats {
  projects: { total: number; active: number; completed: number };
  tasks: { total: number; done: number; inProgress: number; overdue: number; completionRate: number };
  recentProjects: RecentProject[];
  tasksByPriority: { priority: string; _count: { priority: number } }[];
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  ACTIVE:    "bg-emerald-500/10 text-emerald-500",
  ON_HOLD:   "bg-amber-500/10  text-amber-500",
  COMPLETED: "bg-indigo-500/10 text-indigo-500",
  ARCHIVED:  "bg-neutral-500/10 text-neutral-400",
};

const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE:    "bg-emerald-500",
  ON_HOLD:   "bg-amber-500",
  COMPLETED: "bg-indigo-500",
  ARCHIVED:  "bg-neutral-400",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Aktif", ON_HOLD: "Ditahan", COMPLETED: "Selesai", ARCHIVED: "Arsip",
};

function StatCard({
  title, value, sub, icon: Icon, color, delay,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {sub && (
        <p className="text-sm text-neutral-400 mt-3">{sub}</p>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
          <div className="h-7 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        </div>
        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
      </div>
      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mt-4" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          title: "Total Proyek",
          value: stats.projects.total,
          sub: `${stats.projects.active} aktif · ${stats.projects.completed} selesai`,
          icon: FolderKanban,
          color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        },
        {
          title: "Total Tugas",
          value: stats.tasks.total,
          sub: `${stats.tasks.inProgress} sedang berjalan`,
          icon: CheckCircle2,
          color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        {
          title: "Completion Rate",
          value: `${stats.tasks.completionRate}%`,
          sub: `${stats.tasks.done} dari ${stats.tasks.total} tugas selesai`,
          icon: TrendingUp,
          color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
        },
        {
          title: "Tugas Terlambat",
          value: stats.tasks.overdue,
          sub: stats.tasks.overdue > 0 ? "Perlu perhatian segera" : "Semua on track",
          icon: AlertTriangle,
          color: stats.tasks.overdue > 0
            ? "bg-red-50 dark:bg-red-500/10 text-red-500"
            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-400",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Ikhtisar Bisnis</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Pantau metrik utama performa operasional MRA Retail.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((s, i) => (
              <StatCard key={s.title} {...s} delay={i * 0.08} />
            ))}
      </div>

      {/* Progress bar */}
      {stats && stats.tasks.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Progress Keseluruhan</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.tasks.completionRate}%</span>
          </div>
          <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.tasks.completionRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 lg:col-span-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col h-[420px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Aliran Pendapatan & Pengeluaran</h3>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Ringkasan transaksi dalam jutaan Rupiah (M).</p>
          </div>
          <div className="flex-1">
            <RevenueChart />
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="col-span-1 p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Proyek Terbaru</h3>
            </div>
            <Link href="/dashboard/projects" className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
              Lihat semua
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FolderKanban className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-400">Belum ada proyek</p>
              <Link href="/dashboard/projects" className="mt-2 text-xs text-indigo-500 hover:underline">
                Buat proyek pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-start gap-3 group"
                  >
                    <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[project.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                        <span className="text-[10px] text-neutral-400">{project._count.tasks} tugas</span>
                      </div>
                    </div>
                    <span suppressHydrationWarning className="text-[10px] text-neutral-400 flex-shrink-0 mt-1">
                      {new Date(project.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Task priority breakdown */}
      {stats && stats.tasksByPriority.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">Tugas Aktif per Prioritas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((priority) => {
              const found = stats.tasksByPriority.find((t) => t.priority === priority);
              const count = found?._count.priority ?? 0;
              const styles: Record<string, { bar: string; text: string; bg: string }> = {
                CRITICAL: { bar: "bg-red-500",    text: "text-red-500",    bg: "bg-red-50 dark:bg-red-500/10" },
                HIGH:     { bar: "bg-orange-500", text: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
                MEDIUM:   { bar: "bg-amber-500",  text: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-500/10" },
                LOW:      { bar: "bg-neutral-400", text: "text-neutral-500", bg: "bg-neutral-50 dark:bg-neutral-800" },
              };
              const s = styles[priority];
              return (
                <div key={priority} className={`rounded-xl p-4 ${s.bg}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>{priority}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.text}`}>{count}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">tugas aktif</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
