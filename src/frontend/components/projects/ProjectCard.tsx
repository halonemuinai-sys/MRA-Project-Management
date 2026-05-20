"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, Users, Clock, Loader2, Pin, AlertTriangle, CheckCircle2, TrendingUp, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { ProjectListItem, STATUS_LABELS } from "./types";
import { useToast } from "@/frontend/lib/toast";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:    { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", accent: "from-emerald-500 to-emerald-600", glow: "hover:shadow-emerald-500/10" },
  ON_HOLD:   { dot: "bg-amber-500",   badge: "bg-amber-500/10  text-amber-500  dark:text-amber-400  border-amber-500/20",  accent: "from-amber-500 to-amber-600",   glow: "hover:shadow-amber-500/10"   },
  COMPLETED: { dot: "bg-blue-500",    badge: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",   accent: "from-blue-500 to-blue-600",     glow: "hover:shadow-blue-500/10"     },
  ARCHIVED:  { dot: "bg-neutral-400", badge: "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20", accent: "from-neutral-400 to-neutral-500", glow: "hover:shadow-neutral-500/10" },
} as const;

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-700",
  "from-fuchsia-500 to-fuchsia-700",
  "from-teal-500 to-teal-700",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Deadline badge ──────────────────────────────────────────────────────────

function DeadlineBadge({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState("");
  const [cls, setCls] = useState("");

  useEffect(() => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
    if (days < 0)       { setLabel(`${Math.abs(days)}d overdue`); setCls("text-red-500 dark:text-red-400"); }
    else if (days === 0){ setLabel("Today!"); setCls("text-red-500 dark:text-red-400 font-bold"); }
    else if (days <= 7) { setLabel(`${days} day(s) left`); setCls("text-amber-500 dark:text-amber-400"); }
    else                { setLabel(new Date(deadline).toLocaleDateString("en-US", { day: "numeric", month: "short" })); setCls("text-neutral-400 dark:text-neutral-500"); }
  }, [deadline]);

  if (!label) return null;
  return (
    <span className={`flex items-center gap-1 ${cls}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDeleted: (id: string) => void;
  onPinToggle: (id: string, pinned: boolean) => void;
}

export function ProjectCard({ project, onEdit, onDeleted, onPinToggle }: ProjectCardProps) {
  const toast = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const cfg = STATUS_CONFIG[project.status];
  const gradient = getAvatarGradient(project.name);
  const initials = getInitials(project.name);
  const total = project._count.tasks;
  const done = project.doneTasksCount;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const isOverdue = !!project.deadline && new Date(project.deadline) < new Date() && project.status !== "COMPLETED" && project.status !== "ARCHIVED";

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { toast("Failed to delete project.", "error"); return; }
    toast(`Project "${project.name}" deleted.`, "info");
    onDeleted(project.id);
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    const res = await fetch(`/api/projects/${project.id}/save-template`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateName: templateName.trim() || undefined }),
    });
    setSavingTemplate(false);
    setShowTemplateInput(false); setTemplateName(""); setShowMenu(false);
    if (res.ok) toast("Project saved as template.", "success");
    else toast("Failed to save template.", "error");
  };

  const handlePin = async () => {
    setPinning(true);
    setShowMenu(false);
    const res = await fetch(`/api/projects/${project.id}/pin`, { method: "PATCH" });
    setPinning(false);
    if (!res.ok) { toast("Failed to toggle pin.", "error"); return; }
    const { pinned } = await res.json();
    onPinToggle(project.id, pinned);
    toast(pinned ? "Project pinned." : "Project unpinned.", "success");
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-black/30 ${cfg.glow} transition-all duration-200`}
    >
      {/* Top accent strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.accent}`} />

      {/* ── Action menu ── */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button" title="Opsi proyek"
          onClick={(e) => { e.preventDefault(); setShowMenu((v) => !v); setConfirmDelete(false); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              className="absolute right-0 top-9 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden"
              onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
            >
              {confirmDelete ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Delete this project?</p>
                  <p className="text-xs text-neutral-400">All tasks will be deleted too.</p>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center">
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                    </button>
                  </div>
                </div>
              ) : showTemplateInput ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Template Name</p>
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={`Template: ${project.name}`}
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowTemplateInput(false)}
                      className="flex-1 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center">
                      {savingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" onClick={handlePin} disabled={pinning}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60">
                    {pinning
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Pin className={`w-3.5 h-3.5 ${project.pinned ? "text-amber-400 fill-amber-400" : ""}`} />
                    }
                    {project.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button type="button" onClick={() => { onEdit(project); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit Project
                  </button>
                  <button type="button" onClick={() => setShowTemplateInput(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" /> Save as Template
                  </button>
                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2" />
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card body ── */}
      <Link href={`/dashboard/projects/${project.id}`} className="block p-5 pt-4">

        {/* Header: avatar + name + pin */}
        <div className="flex items-start gap-3 pr-8 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {project.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
              <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-[15px]">
                {project.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {STATUS_LABELS[project.status]}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-[13px] text-neutral-300 dark:text-neutral-600 italic mb-4">No description</p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Progress
            </span>
            <span className={`text-[11px] font-bold tabular-nums ${
              progress === 100 ? "text-emerald-500" : progress > 50 ? "text-blue-500" : "text-neutral-400"
            }`}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className={`h-full rounded-full bg-gradient-to-r ${
                progress === 100 ? "from-emerald-400 to-emerald-600" :
                progress > 50   ? `${cfg.accent}` :
                "from-neutral-300 to-neutral-400"
              }`}
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {done} of {total} task(s) completed
          </p>
        </div>

        {/* Footer meta */}
        <div className="flex items-center gap-3 text-[12px] text-neutral-400 dark:text-neutral-500 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
            {total} task(s)
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
            {project._count.members} member(s)
          </span>
          {project.deadline && (
            <DeadlineBadge deadline={project.deadline} />
          )}
          <span className="ml-auto text-[11px] text-neutral-300 dark:text-neutral-600 hidden sm:block" suppressHydrationWarning>
            {new Date(project.updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
