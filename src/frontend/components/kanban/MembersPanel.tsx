"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Crown, ShieldCheck, Eye, X, Loader2 } from "lucide-react";
import { KanbanMember, KanbanUser, MemberRole } from "./types";
import { useToast } from "@/frontend/lib/toast";

const ROLE_CONFIG: Record<MemberRole, { label: string; icon: React.ElementType; color: string }> = {
  OWNER:  { label: "Owner",  icon: Crown,       color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
  ADMIN:  { label: "Admin",  icon: ShieldCheck, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
  MEMBER: { label: "Member", icon: Users,       color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
  VIEWER: { label: "Viewer", icon: Eye,         color: "text-neutral-400 bg-neutral-100 dark:bg-neutral-800" },
};

interface MembersPanelProps {
  projectId: string;
  members: KanbanMember[];
  ownerId: string;
  currentUserId: string;
  onMembersChange: (members: KanbanMember[]) => void;
}

export function MembersPanel({ projectId, members, ownerId, currentUserId, onMembersChange }: MembersPanelProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const isOwner = currentUserId === ownerId;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setAdding(false);
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? "Gagal menambah anggota.", "error");
      return;
    }
    const newMember = await res.json();
    onMembersChange([...members, { user: newMember.user as KanbanUser, role: newMember.role }]);
    toast(`${newMember.user.name ?? newMember.user.email} berhasil ditambahkan.`, "success");
    setEmail(""); setShowForm(false);
  };

  const handleRemove = async (userId: string, userName: string) => {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
    if (!res.ok) { toast("Gagal menghapus anggota.", "error"); return; }
    onMembersChange(members.filter((m) => m.user.id !== userId));
    toast(`${userName} dihapus dari proyek.`, "info");
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Anggota</h3>
          <span className="text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>
        {isOwner && (
          <button type="button" onClick={() => setShowForm((v) => !v)} title="Tambah anggota"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
            <UserPlus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} onSubmit={handleAdd} className="mb-4 overflow-hidden">
            <div className="flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                placeholder="Email anggota baru" title="Email anggota"
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
              <button type="submit" disabled={adding}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70 flex items-center">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {members.map((m) => {
          const role = (m.role as MemberRole) in ROLE_CONFIG ? (m.role as MemberRole) : "MEMBER";
          const cfg = ROLE_CONFIG[role];
          const RoleIcon = cfg.icon;
          const initials = (m.user.name ?? m.user.email ?? "?")[0].toUpperCase();

          return (
            <div key={m.user.id} className="flex items-center gap-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {m.user.name ?? m.user.email}
                </p>
                {m.user.name && <p className="text-[10px] text-neutral-400 truncate">{m.user.email}</p>}
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                <RoleIcon className="w-2.5 h-2.5" /> {cfg.label}
              </span>
              {isOwner && m.user.id !== ownerId && (
                <button type="button"
                  onClick={() => handleRemove(m.user.id, m.user.name ?? m.user.email ?? "Anggota")}
                  title="Hapus anggota"
                  className="p-1 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
