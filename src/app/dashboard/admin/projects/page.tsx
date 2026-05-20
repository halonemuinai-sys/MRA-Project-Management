"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight, FolderKanban, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/frontend/lib/toast";

interface AdminProject {
  id: string; name: string; status: string; pinned: boolean;
  deadline: string | null; createdAt: string;
  owner: { id: string; name: string | null; email: string | null };
  _count: { tasks: number; members: number };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Active",    cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" },
  ON_HOLD:   { label: "On Hold",   cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" },
  COMPLETED: { label: "Completed", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
  ARCHIVED:  { label: "Archived",  cls: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700" },
};

export default function AdminProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: search, status: statusFilter });
    const res = await fetch(`/api/admin/projects?${params}`);
    if (res.ok) { const d = await res.json(); setProjects(d.projects); setTotal(d.total); setTotalPages(d.totalPages); }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    setDeleting(null); setConfirmDelete(null);
    if (res.ok) { setProjects((prev) => prev.filter((p) => p.id !== id)); toast("Project deleted.", "info"); }
    else toast("Failed to delete project.", "error");
  };

  const statusOptions = ["ALL", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
            className="pl-9 w-full px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-rose-600 text-white" : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-rose-400"}`}>
              {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-400 self-center flex-shrink-0">{total} projects</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-rose-400 animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <FolderKanban className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-400">No projects found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                  {["Project", "Owner", "Status", "Tasks", "Members", "Created", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {projects.map((p, i) => {
                    const sc = STATUS_CONFIG[p.status] ?? { label: p.status, cls: "" };
                    return (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">{p.name}</p>
                          {p.deadline && (
                            <p className="text-[11px] text-neutral-400" suppressHydrationWarning>
                              Deadline: {new Date(p.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[140px]">{p.owner.name ?? p.owner.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-neutral-500 tabular-nums">{p._count.tasks}</td>
                        <td className="py-3.5 px-4 text-sm text-neutral-500 tabular-nums">{p._count.members}</td>
                        <td className="py-3.5 px-4 text-xs text-neutral-400" suppressHydrationWarning>
                          {new Date(p.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3.5 px-4">
                          {confirmDelete === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-500">Sure?</span>
                              <button type="button" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                                className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                                {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                              </button>
                              <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/projects/${p.id}`} target="_blank"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button type="button" onClick={() => setConfirmDelete(p.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
