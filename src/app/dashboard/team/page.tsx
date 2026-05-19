"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FolderKanban, CheckCircle2, Loader2, Mail,
  UserPlus, Search, X, ChevronDown,
} from "lucide-react";
import { InviteUserModal } from "@/frontend/components/team/InviteUserModal";
import { UserDetailModal } from "@/frontend/components/team/UserDetailModal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  _count: { ownedProjects: number; assignedTasks: number; projectMembers: number };
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

type SortKey = "newest" | "oldest" | "name_asc" | "most_projects" | "most_tasks";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",       label: "Terbaru bergabung" },
  { value: "oldest",       label: "Terlama bergabung" },
  { value: "name_asc",     label: "Nama A–Z" },
  { value: "most_projects",label: "Proyek terbanyak" },
  { value: "most_tasks",   label: "Tugas terbanyak" },
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

// ─── MemberCard ─────────────────────────────────────────────────────────────────

function MemberCard({
  member, index, onClick,
}: { member: TeamMember; index: number; onClick: () => void }) {
  const initials = (member.name ?? member.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={`Lihat detail ${member.name ?? member.email ?? "anggota"}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="w-full text-left bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {member.name ?? <span className="text-neutral-400 italic font-normal">Tanpa nama</span>}
          </p>
          <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {member.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Proyek",     value: member._count.ownedProjects,  icon: FolderKanban, color: "text-indigo-500" },
          { label: "Tugas",      value: member._count.assignedTasks,  icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Partisipasi",value: member._count.projectMembers, icon: Users,        color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-2.5 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      <p suppressHydrationWarning className="text-[10px] text-neutral-400 mt-3 text-left">
        Bergabung {new Date(member.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </motion.button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [detailUser, setDetailUser] = useState<{ id: string; index: number } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    const filtered = search.trim()
      ? members.filter((m) => {
          const q = search.toLowerCase();
          return (
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q)
          );
        })
      : members;
    return sortMembers(filtered, sortBy);
  }, [members, search, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Terbaru bergabung";

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
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tim</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Semua anggota yang terdaftar di sistem MRA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {loading ? "–" : members.length} anggota
              </span>
            </div>
            <button type="button" onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" />
              Daftarkan Anggota
            </button>
          </div>
        </div>

        {/* Search + Sort bar */}
        {!loading && members.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <button type="button" onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-indigo-400 transition-colors">
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
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">
                      Urutkan
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
          </div>
        )}

        {/* Result count when searching */}
        {search && !loading && (
          <p className="text-sm text-neutral-500">
            {displayed.length === 0
              ? `Tidak ada anggota dengan kata kunci "${search}"`
              : `Menampilkan ${displayed.length} dari ${members.length} anggota`}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Belum ada anggota tim</h3>
            <p className="text-sm text-neutral-400 mt-1 mb-6">Daftarkan anggota pertama untuk memulai kolaborasi.</p>
            <button type="button" onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <UserPlus className="w-4 h-4" /> Daftarkan Anggota Pertama
            </button>
          </motion.div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm font-medium text-neutral-500">Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
            <button type="button" onClick={() => setSearch("")}
              className="mt-3 text-xs text-indigo-500 hover:underline">Hapus pencarian</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map((member, i) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={members.indexOf(member)}
                  onClick={() => setDetailUser({ id: member.id, index: members.indexOf(member) })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
