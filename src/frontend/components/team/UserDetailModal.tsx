"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, Mail, Calendar, FolderKanban, CheckCircle2, Users,
  Loader2, Flag, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectMembership {
  role: string;
  joinedAt: string;
  project: { id: string; name: string; status: string };
}

interface AssignedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  projectMembers: ProjectMembership[];
  assignedTasks: AssignedTask[];
  _count: { ownedProjects: number; assignedTasks: number; projectMembers: number };
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  OWNER:  "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  ADMIN:  "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  MEMBER: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400",
  VIEWER: "bg-neutral-100 dark:bg-neutral-700 text-neutral-400",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member", VIEWER: "Viewer",
};

const STATUS_STYLES: Record<string, string> = {
  TODO:        "bg-neutral-100 dark:bg-neutral-700 text-neutral-500",
  IN_PROGRESS: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  IN_REVIEW:   "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW:      "text-neutral-400",
  MEDIUM:   "text-amber-500",
  HIGH:     "text-orange-500",
  CRITICAL: "text-red-500",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed", ARCHIVED: "Archived",
};

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

// ─── Component ──────────────────────────────────────────────────────────────────

interface UserDetailModalProps {
  userId: string;
  gradientIndex: number;
  onClose: () => void;
}

export function UserDetailModal({ userId, gradientIndex, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "tasks">("projects");

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => { setUser(d); setLoading(false); });
  }, [userId]);

  const initials = user
    ? (user.name ?? user.email ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const gradient = AVATAR_GRADIENTS[gradientIndex % AVATAR_GRADIENTS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[85vh]">

        {/* Close */}
        <button type="button" onClick={onClose} title="Close"
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-20 text-neutral-400 text-sm">User not found.</div>
        ) : (
          <>
            {/* Profile header */}
            <div className="p-6 pb-0">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                    {user.name ?? <span className="text-neutral-400 italic">No name</span>}
                  </h2>
                  <p className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {user.email}
                  </p>
                  <p suppressHydrationWarning className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Owned Projects", value: user._count.ownedProjects,  icon: FolderKanban, color: "text-indigo-500" },
                  { label: "Active Tasks",   value: user.assignedTasks.length,  icon: CheckCircle2, color: "text-emerald-500" },
                  { label: "Memberships",    value: user._count.projectMembers, icon: Users,        color: "text-amber-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-center">
                    <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                    <p className="text-base font-bold text-neutral-900 dark:text-white">{s.value}</p>
                    <p className="text-[10px] text-neutral-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-0.5 border-b border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => setTab("projects")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                    tab === "projects"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}>
                  <FolderKanban className="w-3.5 h-3.5" />
                  Projects ({user.projectMembers.length})
                </button>
                <button type="button" onClick={() => setTab("tasks")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                    tab === "tasks"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Tasks ({user.assignedTasks.length})
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "projects" && (
                <div className="space-y-2">
                  {user.projectMembers.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-6">Not yet a member of any project.</p>
                  ) : (
                    user.projectMembers.map((m) => (
                      <div key={m.project.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <FolderKanban className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{m.project.name}</p>
                            <p className="text-[10px] text-neutral-400">{PROJECT_STATUS_LABELS[m.project.status] ?? m.project.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[m.role] ?? ROLE_STYLES.MEMBER}`}>
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                          <Link href={`/dashboard/projects/${m.project.id}`} onClick={onClose}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "tasks" && (
                <div className="space-y-2">
                  {user.assignedTasks.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-6">No active tasks.</p>
                  ) : (
                    user.assignedTasks.map((t) => (
                      <div key={t.id}
                        className="flex items-start justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                        <div className="flex items-start gap-3 min-w-0">
                          <Flag className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${PRIORITY_STYLES[t.priority] ?? ""}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{t.title}</p>
                            <p className="text-[10px] text-neutral-400 truncate">{t.project.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? ""}`}>
                            {t.status.replace("_", " ")}
                          </span>
                          {t.dueDate && (
                            <span suppressHydrationWarning className="text-[10px] text-neutral-400">
                              {new Date(t.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
