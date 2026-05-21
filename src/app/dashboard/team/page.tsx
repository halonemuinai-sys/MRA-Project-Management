"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Users, FolderKanban, CheckCircle2, Mail, UserPlus, Search, X,
  ChevronDown, LayoutGrid, List, Crown, ShieldCheck, Calendar,
  TrendingUp, Activity, ArrowUpRight, Trash2, AlertTriangle, Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { InviteUserModal } from "@/frontend/components/team/InviteUserModal";
import { UserDetailModal } from "@/frontend/components/team/UserDetailModal";
import { useToast } from "@/frontend/lib/toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role?: "USER" | "ADMIN";
  createdAt: string;
  _count: { ownedProjects: number; assignedTasks: number; projectMembers: number };
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  ["from-indigo-500 to-violet-600", "bg-indigo-500/20 ring-indigo-500/30"],
  ["from-emerald-500 to-teal-600",  "bg-emerald-500/20 ring-emerald-500/30"],
  ["from-amber-500 to-orange-600",  "bg-amber-500/20 ring-amber-500/30"],
  ["from-rose-500 to-pink-600",     "bg-rose-500/20 ring-rose-500/30"],
  ["from-cyan-500 to-blue-600",     "bg-cyan-500/20 ring-cyan-500/30"],
  ["from-violet-500 to-purple-600", "bg-violet-500/20 ring-violet-500/30"],
];

type SortKey = "newest" | "oldest" | "name_asc" | "most_projects" | "most_tasks";
type ViewMode = "grid" | "list";
type RoleFilter = "ALL" | "ADMIN" | "USER";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",        label: "Newest member" },
  { value: "oldest",        label: "Oldest member" },
  { value: "name_asc",      label: "Name A–Z" },
  { value: "most_projects", label: "Most projects" },
  { value: "most_tasks",    label: "Most tasks" },
];

function sortMembers(members: TeamMember[], key: SortKey): TeamMember[] {
  return [...members].sort((a, b) => {
    switch (key) {
      case "newest":        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name_asc":      return (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? "");
      case "most_projects": return b._count.ownedProjects - a._count.ownedProjects;
      case "most_tasks":    return b._count.assignedTasks - a._count.assignedTasks;
      default:              return 0;
    }
  });
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, delay, ease: "easeOut" });
    const unsubscribe = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsubscribe(); };
  }, [value, delay, count, rounded]);

  return <span>{display}</span>;
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ members, loading }: { members: TeamMember[]; loading: boolean }) {
  const admins   = members.filter((m) => m.role === "ADMIN").length;
  const tasks    = members.reduce((s, m) => s + m._count.assignedTasks, 0);
  const projects = members.reduce((s, m) => s + m._count.ownedProjects, 0);

  const stats = [
    { label: "Total Members",  value: members.length, icon: Users,        color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10",  ring: "ring-indigo-200 dark:ring-indigo-500/20" },
    { label: "Administrators", value: admins,          icon: ShieldCheck,  color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-500/10",       ring: "ring-rose-200 dark:ring-rose-500/20" },
    { label: "Total Projects", value: projects,        icon: FolderKanban, color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-500/10",   ring: "ring-violet-200 dark:ring-violet-500/20" },
    { label: "Total Tasks",    value: tasks,           icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-200 dark:ring-emerald-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 16 : 0 }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-4`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${s.bg} ${s.ring}`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>
              {loading ? "–" : <AnimatedNumber value={s.value} delay={i * 0.07 + 0.1} />}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ member, onConfirm, onCancel, loading }: {
  member: TeamMember; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Delete Member</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
          Are you sure you want to delete
        </p>
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
          {member.name ?? member.email}
        </p>
        <p className="text-xs text-neutral-400 mb-5">
          This will permanently remove their account, projects, and all associated data.
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Member Card (Grid) ────────────────────────────────────────────────────────

function MemberCard({
  member, index, onClick, canDelete, onDelete,
}: { member: TeamMember; index: number; onClick: () => void; canDelete?: boolean; onDelete?: (e: React.MouseEvent) => void }) {
  const initials = (member.name ?? member.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const [grad, ring] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const maxTasks = 20;
  const taskPct = Math.min(100, Math.round((member._count.assignedTasks / maxTasks) * 100));
  const isAdmin = member.role === "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 transition-all group"
    >
      {/* Delete button — always visible for admin */}
      {canDelete && (
        <motion.button
          type="button"
          onClick={onDelete}
          title="Delete member"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      )}

      <button type="button" onClick={onClick} className="w-full text-left">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform`}>
              {initials}
            </div>
            {isAdmin && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-neutral-900">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-neutral-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                {member.name ?? <span className="text-neutral-400 italic font-normal">No name</span>}
              </p>
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              {member.email}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <ShieldCheck className="w-2.5 h-2.5" /> Admin
              </span>
            )}
          </div>
          <ArrowUpRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Projects",      value: member._count.ownedProjects,  icon: FolderKanban, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
            { label: "Tasks",         value: member._count.assignedTasks,  icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "Participation", value: member._count.projectMembers, icon: Users,        color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.bg}`}>
              <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
              <p className={`text-base font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Task workload bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Workload</span>
            <span className="text-[10px] font-bold text-neutral-500">{taskPct}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskPct}%` }}
              transition={{ delay: Math.min(index * 0.04, 0.3) + 0.3, duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${grad}`}
            />
          </div>
        </div>

        {/* Joined date */}
        <p suppressHydrationWarning className="text-[10px] text-neutral-400 mt-3 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Joined {new Date(member.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </button>
    </motion.div>
  );
}

// ─── Member Row (List view) ────────────────────────────────────────────────────

function MemberRow({
  member, index, onClick, canDelete, onDelete,
}: { member: TeamMember; index: number; onClick: () => void; canDelete?: boolean; onDelete?: (e: React.MouseEvent) => void }) {
  const initials = (member.name ?? member.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const [grad] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const isAdmin = member.role === "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group"
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow group-hover:scale-105 transition-transform`}>
        {initials}
      </div>

      {/* Name + email — clickable */}
      <button type="button" onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {member.name ?? <span className="italic text-neutral-400 font-normal">No name</span>}
          </p>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-200 dark:border-rose-500/20 flex-shrink-0">
              <Crown className="w-2.5 h-2.5" /> Admin
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 truncate">{member.email}</p>
      </button>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{member._count.ownedProjects}</p>
          <p className="text-[10px] text-neutral-400">Projects</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{member._count.assignedTasks}</p>
          <p className="text-[10px] text-neutral-400">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{member._count.projectMembers}</p>
          <p className="text-[10px] text-neutral-400">In Projects</p>
        </div>
      </div>

      {/* Joined */}
      <p suppressHydrationWarning className="hidden lg:block text-xs text-neutral-400 flex-shrink-0 w-28 text-right">
        {new Date(member.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button type="button" onClick={onClick} title="View details"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </button>
        {canDelete && (
          <button type="button" onClick={onDelete} title="Delete member"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onInvite, isSearch, searchQuery }: { onInvite?: () => void; isSearch?: boolean; searchQuery?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      {isSearch ? (
        <>
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-5"
          >
            <Search className="w-8 h-8 text-neutral-400" />
          </motion.div>
          <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300 mb-1">No results found</h3>
          <p className="text-sm text-neutral-400">No members match &ldquo;{searchQuery}&rdquo;</p>
        </>
      ) : (
        <>
          <motion.div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25"
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-indigo-400"
                animate={{
                  x: [0, (i - 1) * 40],
                  y: [0, -30 + i * 10],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.4, ease: "easeOut" }}
                style={{ top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
              />
            ))}
          </motion.div>
          <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-2">No team members yet</h3>
          <p className="text-sm text-neutral-400 max-w-xs leading-relaxed mb-6">
            Invite your first team member to start collaborating on projects together.
          </p>
          {onInvite && (
            <motion.button
              type="button"
              onClick={onInvite}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-colors shadow-lg shadow-indigo-600/25"
            >
              <UserPlus className="w-4 h-4" /> Invite First Member
            </motion.button>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const currentUserId = session?.user?.id;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [detailUser, setDetailUser] = useState<{ id: string; index: number } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const searchRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${confirmDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(null);
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== confirmDelete.id));
      toast(`${confirmDelete.name ?? confirmDelete.email} has been removed.`, "info");
    } else {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "Failed to delete member.", "error");
    }
  };

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    let filtered = members;
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) =>
        m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
      );
    }
    return sortMembers(filtered, sortBy);
  }, [members, search, sortBy, roleFilter]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Newest member";

  return (
    <>
      <AnimatePresence>
        {showInvite && (
          <InviteUserModal
            onClose={() => setShowInvite(false)}
            onInvited={(user) => setMembers((prev) => [user, ...prev])}
          />
        )}
        {detailUser && (
          <UserDetailModal
            userId={detailUser.id}
            gradientIndex={detailUser.index}
            onClose={() => setDetailUser(null)}
          />
        )}
        {confirmDelete && (
          <DeleteConfirmModal
            member={confirmDelete}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Team</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
              {loading ? "Loading members..." : `${members.length} member${members.length !== 1 ? "s" : ""} registered in MRA`}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => setShowInvite(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-colors shadow-md shadow-indigo-600/20 flex-shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </motion.button>
        </motion.div>

        {/* ── Stats Bar ── */}
        <StatsBar members={members} loading={loading} />

        {/* ── Toolbar ── */}
        {!loading && members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2 py-1.5">
              {(["ALL", "ADMIN", "USER"] as RoleFilter[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    roleFilter === r
                      ? r === "ADMIN" ? "bg-rose-500 text-white" : "bg-indigo-600 text-white"
                      : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  {r === "ALL" ? "All" : r === "ADMIN" ? "Admins" : "Members"}
                  {r !== "ALL" && (
                    <span className={`ml-1.5 opacity-70 text-[10px]`}>
                      {members.filter((m) => m.role === r).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-indigo-400 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-neutral-400" />
                <span>{activeSortLabel}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-12 z-20 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden"
                    onMouseLeave={() => setShowSortMenu(false)}
                  >
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Sort By</p>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === opt.value
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 flex-shrink-0">
              {([{ mode: "grid", Icon: LayoutGrid }, { mode: "list", Icon: List }] as const).map(({ mode, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === mode
                      ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Results info ── */}
        <AnimatePresence>
          {(search || roleFilter !== "ALL") && !loading && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-neutral-500"
            >
              Showing{" "}
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{displayed.length}</span>{" "}
              of {members.length} members
              {(search || roleFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setRoleFilter("ALL"); }}
                  className="ml-2 text-xs text-indigo-500 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-50 dark:divide-neutral-800"
          }>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={viewMode === "grid"
                ? "h-60 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
                : "h-16 bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              } />
            ))}
          </div>

        ) : members.length === 0 ? (
          <EmptyState onInvite={() => setShowInvite(true)} />

        ) : displayed.length === 0 ? (
          <EmptyState isSearch searchQuery={search} />

        ) : viewMode === "grid" ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map((member, i) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={i}
                  onClick={() => setDetailUser({ id: member.id, index: members.indexOf(member) })}
                  canDelete={member.id !== currentUserId}
                  onDelete={(e) => { e.stopPropagation(); setConfirmDelete(member); }}
                />
              ))}
            </AnimatePresence>
          </motion.div>

        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
          >
            {/* List header */}
            <div className="flex items-center gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-10 flex-shrink-0" />
              <div className="flex-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Member</div>
              <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                {["Projects", "Tasks", "In Projects"].map((h) => (
                  <div key={h} className="w-12 text-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</span>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block w-28 text-right text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex-shrink-0">Joined</div>
              <div className="flex-shrink-0 w-16" />
            </div>
            <AnimatePresence mode="popLayout">
              {displayed.map((member, i) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  index={i}
                  onClick={() => setDetailUser({ id: member.id, index: members.indexOf(member) })}
                  canDelete={member.id !== currentUserId}
                  onDelete={(e) => { e.stopPropagation(); setConfirmDelete(member); }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Footer summary ── */}
        {!loading && displayed.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between text-xs text-neutral-400 pt-2"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {displayed.reduce((s, m) => s + m._count.assignedTasks, 0)} total tasks across {displayed.length} members
              </span>
            </div>
            <span>{displayed.length} of {members.length} shown</span>
          </motion.div>
        )}
      </div>
    </>
  );
}
