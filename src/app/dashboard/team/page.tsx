"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, FolderKanban, CheckCircle2, Loader2, Mail } from "lucide-react";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  _count: {
    ownedProjects: number;
    assignedTasks: number;
    projectMembers: number;
  };
}

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const initials = (member.name ?? member.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "from-indigo-500 to-violet-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
  ];
  const gradient = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-white truncate">
            {member.name ?? "–"}
          </p>
          <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {member.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Proyek", value: member._count.ownedProjects, icon: FolderKanban, color: "text-indigo-500" },
          { label: "Tugas", value: member._count.assignedTasks, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Partisipasi", value: member._count.projectMembers, icon: Users, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-2.5 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      <p suppressHydrationWarning className="text-[10px] text-neutral-400 mt-3">
        Bergabung {new Date(member.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </motion.div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tim</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Semua anggota yang terdaftar di sistem MRA.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
          <Users className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {loading ? "–" : members.length} anggota
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Belum ada anggota tim</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => (
            <MemberCard key={member.id} member={member} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
