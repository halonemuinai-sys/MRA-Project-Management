"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, Users, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProjectListItem, STATUS_STYLES, STATUS_LABELS } from "./types";
import { useToast } from "@/frontend/lib/toast";

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDeleted: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDeleted }: ProjectCardProps) {
  const toast = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { toast("Gagal menghapus proyek.", "error"); return; }
    toast(`Proyek "${project.name}" dihapus.`, "info");
    onDeleted(project.id);
  };

  return (
    <div className="relative group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
      {/* Action menu */}
      <div className="absolute top-3 right-3 z-10">
        <button type="button" title="Opsi proyek"
          onClick={(e) => { e.preventDefault(); setShowMenu((v) => !v); setConfirmDelete(false); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="absolute right-0 top-8 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
              onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
            >
              {confirmDelete ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Hapus proyek ini?</p>
                  <p className="text-xs text-neutral-400">Semua task ikut terhapus.</p>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      Batal
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center">
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Hapus"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => { onEdit(project); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit Proyek
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link href={`/dashboard/projects/${project.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3 pr-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {project.name}
          </h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4">{project.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{project._count.tasks} tugas</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project._count.members} anggota</span>
          {project.deadline && (
            <span suppressHydrationWarning className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(project.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
