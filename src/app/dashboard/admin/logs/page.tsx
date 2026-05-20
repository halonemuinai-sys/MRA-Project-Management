"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface LogEntry {
  id: string; action: string; oldValue: string | null; newValue: string | null; createdAt: string;
  user: { id: string; name: string | null; email: string | null };
  task: { id: string; title: string; project: { id: string; name: string } };
}

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  STATUS:   { label: "Status",   cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
  PRIORITY: { label: "Priority", cls: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20" },
  TITLE:    { label: "Title",    cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" },
  ASSIGNEE: { label: "Assignee", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" },
};

const ALL_ACTIONS = ["ALL", "STATUS", "PRIORITY", "TITLE", "ASSIGNEE"];

function formatChange(action: string, oldVal: string | null, newVal: string | null) {
  if (!oldVal && newVal) return <span className="text-neutral-500">→ <span className="font-medium text-neutral-700 dark:text-neutral-300">{newVal}</span></span>;
  if (oldVal && !newVal) return <span className="text-neutral-500"><span className="line-through">{oldVal}</span> → removed</span>;
  return (
    <span className="text-neutral-500">
      <span className="line-through text-neutral-400">{oldVal}</span>
      <span className="mx-1">→</span>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{newVal}</span>
    </span>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1); const [actionFilter, setActionFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), action: actionFilter });
    const res = await fetch(`/api/admin/logs?${params}`);
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); setTotalPages(d.totalPages); }
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { setPage(1); }, [actionFilter]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {ALL_ACTIONS.map((a) => (
          <button key={a} type="button" onClick={() => setActionFilter(a)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${actionFilter === a ? "bg-rose-600 text-white" : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-rose-400"}`}>
            {a === "ALL" ? "All" : ACTION_LABELS[a]?.label ?? a}
          </button>
        ))}
        <p className="text-sm text-neutral-400 ml-auto">{total} entries</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-rose-400 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <ScrollText className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-400">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
            {logs.map((log, i) => {
              const ac = ACTION_LABELS[log.action] ?? { label: log.action, cls: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200" };
              return (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                  {/* User avatar */}
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {(log.user.name ?? log.user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {log.user.name ?? log.user.email}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ac.cls}`}>{ac.label}</span>
                      <span className="text-xs text-neutral-400">in</span>
                      <Link href={`/dashboard/projects/${log.task.project.id}`}
                        className="text-xs font-medium text-blue-500 hover:underline truncate max-w-[160px]">
                        {log.task.project.name}
                      </Link>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">&quot;{log.task.title}&quot;</span>
                      {" — "}{formatChange(log.action, log.oldValue, log.newValue)}
                    </p>
                  </div>
                  <span suppressHydrationWarning className="text-[11px] text-neutral-400 flex-shrink-0 mt-1">
                    {new Date(log.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </motion.div>
              );
            })}
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
