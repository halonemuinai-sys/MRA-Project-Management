"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldOff, Trash2, Loader2, ChevronLeft, ChevronRight, Users, Crown } from "lucide-react";
import { useToast } from "@/frontend/lib/toast";

interface AdminUser {
  id: string; name: string | null; email: string | null;
  role: "USER" | "ADMIN"; image: string | null; createdAt: string;
  _count: { ownedProjects: number; assignedTasks: number };
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: search, role: roleFilter });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users); setTotal(d.total); setTotalPages(d.totalPages);
    }
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { setPage(1); }, [search, roleFilter]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setActionLoading(null);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast(`Role changed to ${newRole}.`, "success");
    } else toast("Failed to change role.", "error");
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setActionLoading(null);
    setConfirmDelete(null);
    if (res.ok) { setUsers((prev) => prev.filter((u) => u.id !== userId)); toast("User deleted.", "info"); }
    else toast("Failed to delete user.", "error");
  };

  const inputCls = "px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..."
            className={`${inputCls} pl-9 w-full`} />
        </div>
        <div className="flex gap-2">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${roleFilter === r ? "bg-rose-600 text-white" : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-rose-400"}`}>
              {r === "ALL" ? "All" : r === "ADMIN" ? "Admin" : "User"}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-400 self-center flex-shrink-0">{total} users</p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-rose-400 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                  {["User", "Role", "Projects", "Tasks", "Joined", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {users.map((user, i) => (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{user.name ?? "–"}</p>
                            <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          user.role === "ADMIN"
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                        }`}>
                          {user.role === "ADMIN" ? <Crown className="w-3 h-3" /> : null}
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-neutral-500 tabular-nums">{user._count.ownedProjects}</td>
                      <td className="py-3.5 px-4 text-sm text-neutral-500 tabular-nums">{user._count.assignedTasks}</td>
                      <td className="py-3.5 px-4 text-xs text-neutral-400" suppressHydrationWarning>
                        {new Date(user.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3.5 px-4">
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-neutral-500">Sure?</span>
                            <button type="button" onClick={() => handleDelete(user.id)} disabled={actionLoading === user.id}
                              className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                              {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                            </button>
                            <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.role === "ADMIN" ? (
                              <button type="button" onClick={() => handleRoleChange(user.id, "USER")} disabled={!!actionLoading}
                                title="Revoke admin" className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all disabled:opacity-40">
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleRoleChange(user.id, "ADMIN")} disabled={!!actionLoading}
                                title="Make admin" className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-40">
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button type="button" onClick={() => setConfirmDelete(user.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
