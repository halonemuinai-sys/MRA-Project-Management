"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Priority, KanbanMember } from "./types";

export type TaskSortKey = "newest" | "oldest" | "due_asc" | "due_desc" | "priority_high" | "priority_low";

export interface KanbanFilters {
  priority: Priority | "ALL";
  assigneeId: string | "ALL";
  sortBy: TaskSortKey;
}

const PRIORITY_OPTIONS: { value: Priority | "ALL"; label: string; dot: string }[] = [
  { value: "ALL",      label: "Semua Prioritas", dot: "bg-neutral-300" },
  { value: "CRITICAL", label: "Critical",         dot: "bg-red-500" },
  { value: "HIGH",     label: "High",             dot: "bg-orange-500" },
  { value: "MEDIUM",   label: "Medium",           dot: "bg-amber-500" },
  { value: "LOW",      label: "Low",              dot: "bg-neutral-400" },
];

const SORT_OPTIONS: { value: TaskSortKey; label: string }[] = [
  { value: "newest",        label: "Terbaru dibuat" },
  { value: "oldest",        label: "Terlama dibuat" },
  { value: "due_asc",       label: "Deadline Terdekat" },
  { value: "due_desc",      label: "Deadline Terjauh" },
  { value: "priority_high", label: "Prioritas Tertinggi" },
  { value: "priority_low",  label: "Prioritas Terendah" },
];

const PRIORITY_CHIP_STYLES: Record<Priority | "ALL", string> = {
  ALL:      "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
  CRITICAL: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400",
  HIGH:     "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400",
  MEDIUM:   "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
  LOW:      "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
};

const PRIORITY_ACTIVE_STYLES: Record<Priority | "ALL", string> = {
  ALL:      "bg-indigo-600 text-white",
  CRITICAL: "bg-red-500 text-white",
  HIGH:     "bg-orange-500 text-white",
  MEDIUM:   "bg-amber-500 text-white",
  LOW:      "bg-neutral-500 text-white",
};

interface KanbanFilterBarProps {
  filters: KanbanFilters;
  members: KanbanMember[];
  totalCount: number;
  filteredCount: number;
  onChange: (filters: KanbanFilters) => void;
}

export function KanbanFilterBar({ filters, members, totalCount, filteredCount, onChange }: KanbanFilterBarProps) {
  const [showSort, setShowSort] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);

  const isFiltered = filters.priority !== "ALL" || filters.assigneeId !== "ALL" || filters.sortBy !== "newest";
  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Terbaru";
  const activeAssigneeName = filters.assigneeId === "ALL"
    ? "Semua Assignee"
    : (members.find((m) => m.user.id === filters.assigneeId)?.user.name
      ?? members.find((m) => m.user.id === filters.assigneeId)?.user.email
      ?? "Semua");

  const set = (patch: Partial<KanbanFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-neutral-400 flex-shrink-0" />

        {/* Priority chips */}
        {PRIORITY_OPTIONS.map((opt) => {
          const active = filters.priority === opt.value;
          return (
            <button key={opt.value} type="button"
              onClick={() => set({ priority: opt.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active ? PRIORITY_ACTIVE_STYLES[opt.value] : PRIORITY_CHIP_STYLES[opt.value]
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/80" : opt.dot}`} />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Assignee dropdown */}
        <div className="relative">
          <button type="button"
            onClick={() => { setShowAssignee((v) => !v); setShowSort(false); }}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-colors ${
              filters.assigneeId !== "ALL"
                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-400"
            }`}>
            <span className="max-w-[100px] truncate">{activeAssigneeName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-current opacity-60 transition-transform ${showAssignee ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showAssignee && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-11 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden"
                onMouseLeave={() => setShowAssignee(false)}
              >
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Assignee</p>
                <button type="button" onClick={() => { set({ assigneeId: "ALL" }); setShowAssignee(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filters.assigneeId === "ALL"
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}>
                  Semua Assignee
                </button>
                {members.map((m) => (
                  <button key={m.user.id} type="button"
                    onClick={() => { set({ assigneeId: m.user.id }); setShowAssignee(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                      filters.assigneeId === m.user.id
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}>
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
                    </div>
                    <span className="truncate">{m.user.name ?? m.user.email}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button type="button"
            onClick={() => { setShowSort((v) => !v); setShowAssignee(false); }}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-colors ${
              filters.sortBy !== "newest"
                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-400"
            }`}>
            <span className="max-w-[110px] truncate">{activeSortLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-current opacity-60 transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-11 z-20 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden"
                onMouseLeave={() => setShowSort(false)}
              >
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Urutkan</p>
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { set({ sortBy: opt.value }); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filters.sortBy === opt.value
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

        {/* Reset */}
        {isFiltered && (
          <button type="button"
            onClick={() => onChange({ priority: "ALL", assigneeId: "ALL", sortBy: "newest" })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Active filter info */}
      {isFiltered && filteredCount < totalCount && (
        <p className="text-xs text-neutral-400 sm:hidden">
          {filteredCount} dari {totalCount} tugas
        </p>
      )}
    </div>
  );
}
