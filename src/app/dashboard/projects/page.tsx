"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ProjectCard } from "@/frontend/components/projects/ProjectCard";
import { CreateProjectModal, EditProjectModal } from "@/frontend/components/projects/ProjectFormModal";
import { ProjectListItem, ProjectStatus, STATUS_LABELS } from "@/frontend/components/projects/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "deadline" | "tasks";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Terbaru" },
  { value: "oldest",     label: "Terlama" },
  { value: "name_asc",   label: "Nama A–Z" },
  { value: "name_desc",  label: "Nama Z–A" },
  { value: "deadline",   label: "Deadline Terdekat" },
  { value: "tasks",      label: "Tugas Terbanyak" },
];

const STATUS_FILTERS: { value: ProjectStatus | "ALL"; label: string }[] = [
  { value: "ALL",       label: "Semua" },
  { value: "ACTIVE",    label: STATUS_LABELS.ACTIVE },
  { value: "ON_HOLD",   label: STATUS_LABELS.ON_HOLD },
  { value: "COMPLETED", label: STATUS_LABELS.COMPLETED },
  { value: "ARCHIVED",  label: STATUS_LABELS.ARCHIVED },
];

// ─── Sort helper ───────────────────────────────────────────────────────────────

function sortProjects(projects: ProjectListItem[], sortBy: SortKey): ProjectListItem[] {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case "newest":    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name_asc":  return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      case "deadline":  {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      case "tasks":     return b._count.tasks - a._count.tasks;
      default:          return 0;
    }
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

  // Filter & sort state
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Computed: filtered + sorted
  const displayed = useMemo(() => {
    const filtered = filterStatus === "ALL"
      ? projects
      : projects.filter((p) => p.status === filterStatus);
    return sortProjects(filtered, sortBy);
  }, [projects, filterStatus, sortBy]);

  const hasActiveFilter = filterStatus !== "ALL" || sortBy !== "newest";
  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Terbaru";

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Proyek</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Kelola semua proyek yang Anda ikuti.</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Proyek Baru
          </button>
        </div>

        {/* Filter & Sort bar */}
        {!loading && projects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3">

            {/* Status filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <SlidersHorizontal className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} type="button"
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === f.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}>
                  {f.label}
                  {f.value !== "ALL" && (
                    <span className="ml-1.5 opacity-70">
                      {projects.filter((p) => p.status === f.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative flex-shrink-0">
              <button type="button"
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-indigo-400 transition-colors">
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
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">
                      Urutkan berdasarkan
                    </p>
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === opt.value
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset filter */}
            {hasActiveFilter && (
              <button type="button"
                onClick={() => { setFilterStatus("ALL"); setSortBy("newest"); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </motion.div>
        )}

        {/* Results info */}
        {!loading && projects.length > 0 && filterStatus !== "ALL" && (
          <p className="text-sm text-neutral-500">
            Menampilkan <span className="font-semibold text-neutral-700 dark:text-neutral-300">{displayed.length}</span> dari {projects.length} proyek
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <FolderKanban className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Belum ada proyek</h3>
            <p className="text-sm text-neutral-500 mt-1 mb-6">Buat proyek pertama Anda untuk mulai mengelola tugas.</p>
            <button type="button" onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Buat Proyek Pertama
            </button>
          </motion.div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Tidak ada proyek dengan filter ini
            </p>
            <button type="button" onClick={() => setFilterStatus("ALL")}
              className="mt-3 text-xs text-indigo-500 hover:underline">
              Hapus filter
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map((project, i) => (
                <motion.div key={project.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}>
                  <ProjectCard
                    project={project}
                    onEdit={setEditingProject}
                    onDeleted={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
