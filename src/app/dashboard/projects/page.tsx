"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronDown, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  FolderKanban, CheckCircle2, Clock, Users, Inbox, Rocket, ListTodo,
} from "lucide-react";
import { ProjectCard } from "@/frontend/components/projects/ProjectCard";
import { CreateProjectModal, EditProjectModal } from "@/frontend/components/projects/ProjectFormModal";
import { ProjectListItem, ProjectStatus, STATUS_LABELS } from "@/frontend/components/projects/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "deadline" | "tasks";
const PAGE_SIZE = 9;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",    label: "Newest" },
  { value: "oldest",    label: "Oldest" },
  { value: "name_asc",  label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "deadline",  label: "Nearest Deadline" },
  { value: "tasks",     label: "Most Tasks" },
];

const STATUS_FILTERS: { value: ProjectStatus | "ALL"; label: string }[] = [
  { value: "ALL",       label: "All" },
  { value: "ACTIVE",    label: STATUS_LABELS.ACTIVE },
  { value: "ON_HOLD",   label: STATUS_LABELS.ON_HOLD },
  { value: "COMPLETED", label: STATUS_LABELS.COMPLETED },
  { value: "ARCHIVED",  label: STATUS_LABELS.ARCHIVED },
];

function sortProjects(projects: ProjectListItem[], sortBy: SortKey): ProjectListItem[] {
  return [...projects].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    switch (sortBy) {
      case "newest":   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name_asc": return a.name.localeCompare(b.name);
      case "name_desc":return b.name.localeCompare(a.name);
      case "deadline": {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1; if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      case "tasks":    return b._count.tasks - a._count.tasks;
      default:         return 0;
    }
  });
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, iconColor, loading, delay }: {
  label: string; value: number; icon: React.ElementType;
  iconBg: string; iconColor: string; loading: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: loading ? 0 : 1, y: loading ? 12 : 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        <div className="h-7 w-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Empty State Illustration ──────────────────────────────────────────────────

function EmptyIllustration() {
  return (
    <div className="relative w-52 h-52 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-blue-50 dark:bg-blue-500/10" />
      <div className="absolute inset-8 rounded-full bg-blue-100/60 dark:bg-blue-500/15 flex items-center justify-center">
        <Inbox className="w-16 h-16 text-blue-400 dark:text-blue-500 stroke-[1.2]" />
      </div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        className="absolute -top-2 -right-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-100 dark:border-neutral-700 p-3"
      >
        <ListTodo className="w-5 h-5 text-blue-500" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.4 }}
        className="absolute -bottom-2 -left-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-100 dark:border-neutral-700 p-3"
      >
        <Rocket className="w-5 h-5 text-violet-500" />
      </motion.div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [filterStatus, sortBy]);

  const handlePinToggle = (id: string, pinned: boolean) =>
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, pinned } : p));

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const allDisplayed = useMemo(() => {
    const filtered = filterStatus === "ALL" ? projects : projects.filter((p) => p.status === filterStatus);
    return sortProjects(filtered, sortBy);
  }, [projects, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(allDisplayed.length / PAGE_SIZE));
  const displayed = allDisplayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilter = filterStatus !== "ALL" || sortBy !== "newest";
  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Newest";

  const stats = useMemo(() => ({
    total:    projects.length,
    active:   projects.filter((p) => p.status === "ACTIVE").length,
    onHold:   projects.filter((p) => p.status === "ON_HOLD").length,
    completed:projects.filter((p) => p.status === "COMPLETED").length,
    members:  projects.reduce((s, p) => s + p._count.members, 0),
  }), [projects]);

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} />}
        {editingProject && (
          <EditProjectModal
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onUpdated={(updated) => setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Projects</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 max-w-lg text-sm leading-relaxed">
              Manage all your projects. Track team progress, manage tasks,
              and hit deadlines on time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold rounded-full transition-all shadow-md shadow-blue-600/20 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* ── Stats Row ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Projects"  value={stats.total}     icon={FolderKanban}  iconBg="bg-blue-50 dark:bg-blue-500/10"    iconColor="text-blue-600 dark:text-blue-400"    loading={false} delay={0} />
            <StatCard label="In Progress"     value={stats.active}    icon={Clock}         iconBg="bg-violet-50 dark:bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" loading={false} delay={0.05} />
            <StatCard label="Completed"       value={stats.completed} icon={CheckCircle2}  iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400" loading={false} delay={0.1} />
            <StatCard label="Active Members"  value={stats.members}   icon={Users}         iconBg="bg-sky-50 dark:bg-sky-500/10"       iconColor="text-sky-600 dark:text-sky-400"      loading={false} delay={0.15} />
          </div>
        )}

        {/* ── Filter & Sort bar ── */}
        {!loading && projects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3">

            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} type="button"
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === f.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}>
                  {f.label}
                  {f.value !== "ALL" && (
                    <span className="ml-1.5 opacity-60">{projects.filter((p) => p.status === f.value).length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <button type="button"
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-blue-400 transition-colors">
                  <span>{activeSortLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-11 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden"
                      onMouseLeave={() => setShowSortMenu(false)}
                    >
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Sort By</p>
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button"
                          onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === opt.value
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {hasActiveFilter && (
                <button type="button"
                  onClick={() => { setFilterStatus("ALL"); setSortBy("newest"); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results info */}
        {!loading && projects.length > 0 && filterStatus !== "ALL" && (
          <p className="text-sm text-neutral-500">
            Showing <span className="font-semibold text-neutral-700 dark:text-neutral-300">{allDisplayed.length}</span> of {projects.length} projects
          </p>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>

        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
          >
            <EmptyIllustration />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">No projects yet</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-8">
              You don&apos;t have any active projects right now. Create your first project
              to start managing tasks, collaborating with your team, and tracking
              progress more effectively.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold rounded-full transition-all shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" /> Create First Project
              </button>
            </div>
          </motion.div>

        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <FolderKanban className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No projects match this filter</p>
            <button type="button" onClick={() => setFilterStatus("ALL")}
              className="mt-3 text-xs text-blue-500 hover:underline">
              Clear filter
            </button>
          </motion.div>

        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {displayed.map((project, i) => (
                  <motion.div key={project.id} layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}>
                    <ProjectCard
                      project={project}
                      onEdit={setEditingProject}
                      onDeleted={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))}
                      onPinToggle={handlePinToggle}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => setPage(p)}
                    className={`min-w-[36px] h-9 px-2 rounded-xl text-sm font-medium transition-colors ${
                      p === page ? "bg-blue-600 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}>
                    {p}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-sm text-neutral-400 ml-1">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allDisplayed.length)} of {allDisplayed.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
