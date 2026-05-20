"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, MessageSquare, Flag, Calendar, Loader2,
  ChevronLeft, ChevronRight, Download, FileText, Sheet,
} from "lucide-react";
import { KanbanTask, TaskStatus, Priority, PRIORITY_STYLES, COLUMNS } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SortCol = "title" | "status" | "priority" | "assignee" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

interface TaskListViewProps {
  tasks: KanbanTask[];
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: string) => void;
  onView: (task: KanbanTask) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  selectedTaskIds?: Set<string>;
  onSelectTask?: (id: string, selected: boolean) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; badge: string }> = {
  TODO:        { label: "To Do",       dot: "bg-neutral-400", badge: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-indigo-500",  badge: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  IN_REVIEW:   { label: "In Review",   dot: "bg-amber-500",   badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  DONE:        { label: "Done",        dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const PRIORITY_WEIGHT: Record<Priority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

// ─── Export helpers ─────────────────────────────────────────────────────────────

function exportCSV(tasks: KanbanTask[]) {
  const headers = ["Title", "Status", "Priority", "Assignee", "Due Date", "Created"];
  const rows = tasks.map((t) => [
    t.title,
    STATUS_CONFIG[t.status]?.label ?? t.status,
    t.priority,
    t.assignee?.name ?? t.assignee?.email ?? "",
    t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US") : "",
    new Date(t.createdAt).toLocaleDateString("en-US"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(tasks: KanbanTask[]) {
  const rows = tasks.map((t) => [
    t.title,
    STATUS_CONFIG[t.status]?.label ?? t.status,
    t.priority,
    t.assignee?.name ?? t.assignee?.email ?? "–",
    t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US") : "–",
  ]);

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>Task List</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,sans-serif;font-size:12px;padding:24px;color:#111}
      h1{font-size:18px;font-weight:700;margin-bottom:4px}
      p.sub{color:#6b7280;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#4f46e5;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
      td{padding:7px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
      tr:nth-child(even) td{background:#f9fafb}
      .done{text-decoration:line-through;color:#9ca3af}
      @media print{body{padding:0}}
    </style>
  </head><body>
    <h1>Task List</h1>
    <p class="sub">Exported ${new Date().toLocaleDateString("en-US", { day:"numeric", month:"long", year:"numeric" })} — ${tasks.length} task(s)</p>
    <table>
      <thead><tr>
        <th style="width:35%">Title</th>
        <th style="width:15%">Status</th>
        <th style="width:12%">Priority</th>
        <th style="width:18%">Assignee</th>
        <th style="width:20%">Due Date</th>
      </tr></thead>
      <tbody>
        ${rows.map(([title, status, priority, assignee, due]) =>
          `<tr>
            <td class="${status === "Done" ? "done" : ""}">${title}</td>
            <td>${status}</td>
            <td>${priority}</td>
            <td>${assignee}</td>
            <td>${due}</td>
          </tr>`
        ).join("")}
      </tbody>
    </table>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=900,height=700");
  if (win) {
    win.addEventListener("load", () => { win.focus(); win.print(); });
  }
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Sort helpers ───────────────────────────────────────────────────────────────

function sortTasks(tasks: KanbanTask[], col: SortCol, dir: SortDir): KanbanTask[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (col) {
      case "title":     cmp = a.title.localeCompare(b.title); break;
      case "status":    cmp = a.status.localeCompare(b.status); break;
      case "priority":  cmp = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]; break;
      case "assignee":  cmp = (a.assignee?.name ?? "").localeCompare(b.assignee?.name ?? ""); break;
      case "dueDate":   {
        if (!a.dueDate && !b.dueDate) cmp = 0;
        else if (!a.dueDate) cmp = 1;
        else if (!b.dueDate) cmp = -1;
        else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      }
      case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Sort indicator icon ────────────────────────────────────────────────────────

function SortIcon({ col, activeCol, dir }: { col: SortCol; activeCol: SortCol; dir: SortDir }) {
  if (col !== activeCol) return <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />;
  return dir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />;
}

// ─── Export dropdown ────────────────────────────────────────────────────────────

function ExportDropdown({ tasks }: { tasks: KanbanTask[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-9 z-30 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => { exportCSV(tasks); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Sheet className="w-4 h-4 text-emerald-500" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => { exportPDF(tasks); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              Export PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Status picker (inline dropdown) ──────────────────────────────────────────

function StatusPicker({ task, onStatusChange }: { task: KanbanTask; onStatusChange: (id: string, s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[task.status];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            className="absolute left-0 top-8 z-30 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
            onMouseLeave={() => setOpen(false)}
          >
            {COLUMNS.map((col) => (
              <button key={col.key} type="button"
                onClick={() => { onStatusChange(task.id, col.key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  task.status === col.key
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                {col.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Overdue hook ───────────────────────────────────────────────────────────────

function useIsOverdue(dueDate: string | null, status: TaskStatus) {
  const [overdue, setOverdue] = useState(false);
  useEffect(() => {
    setOverdue(!!dueDate && new Date(dueDate) < new Date() && status !== "DONE");
  }, [dueDate, status]);
  return overdue;
}

// ─── Task Row ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onEdit, onDelete, onView, onStatusChange, selected, onSelect }: {
  task: KanbanTask;
  onEdit: (t: KanbanTask) => void;
  onDelete: (id: string) => void;
  onView: (t: KanbanTask) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}) {
  const isOverdue = useIsOverdue(task.dueDate, task.status);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
      {/* Checkbox */}
      {onSelect && (
        <td className="py-3 pl-4 pr-2 w-8">
          <input type="checkbox" checked={!!selected}
            onChange={(e) => onSelect(task.id, e.target.checked)}
            title="Select task"
            className="w-4 h-4 rounded cursor-pointer accent-indigo-600"
          />
        </td>
      )}

      {/* Title */}
      <td className="py-3 px-4">
        <button type="button" onClick={() => onView(task)}
          className="text-left group/title flex items-start gap-2 w-full">
          <span className={`text-sm font-medium leading-snug group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors ${
            task.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-800 dark:text-neutral-200"
          }`}>
            {task.title}
          </span>
        </button>
        {task.description && (
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1 pl-0">{task.description}</p>
        )}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusPicker task={task} onStatusChange={onStatusChange} />
      </td>

      {/* Priority */}
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
          <Flag className="w-2.5 h-2.5" />
          {task.priority}
        </span>
      </td>

      {/* Assignee */}
      <td className="py-3 px-4">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {(task.assignee.name ?? task.assignee.email ?? "?")[0].toUpperCase()}
            </div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[100px]">
              {task.assignee.name ?? task.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
        )}
      </td>

      {/* Due date */}
      <td className="py-3 px-4">
        {task.dueDate ? (
          <span suppressHydrationWarning
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              isOverdue ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"
            }`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            {isOverdue && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full ml-1">Overdue</span>}
          </span>
        ) : (
          <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
        )}
      </td>

      {/* Created */}
      <td suppressHydrationWarning className="py-3 px-4 text-xs text-neutral-400 dark:text-neutral-500 hidden lg:table-cell">
        {new Date(task.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onView(task)} title="View details"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onEdit(task)} title="Edit task"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(task.id)} title="Delete task"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function TaskListView({ tasks, onEdit, onDelete, onView, onStatusChange, selectedTaskIds, onSelectTask }: TaskListViewProps) {
  const [sortCol, setSortCol] = useState<SortCol>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Reset to page 1 when tasks/sort changes
  useEffect(() => { setPage(1); }, [tasks, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sorted = sortTasks(tasks, sortCol, sortDir);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const headers: { col: SortCol; label: string; className?: string }[] = [
    { col: "title",     label: "Title",    className: "w-[35%]" },
    { col: "status",    label: "Status",   className: "w-[130px]" },
    { col: "priority",  label: "Priority", className: "w-[110px]" },
    { col: "assignee",  label: "Assignee", className: "w-[150px]" },
    { col: "dueDate",   label: "Due Date", className: "w-[170px]" },
    { col: "createdAt", label: "Created",  className: "w-[90px] hidden lg:table-cell" },
  ];

  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <Loader2 className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No tasks match this filter</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              {onSelectTask && (
                <th className="py-3 pl-4 pr-2 w-8">
                  <input type="checkbox" title="Select all"
                    checked={paginated.length > 0 && paginated.every((t) => selectedTaskIds?.has(t.id))}
                    onChange={(e) => paginated.forEach((t) => onSelectTask(t.id, e.target.checked))}
                    className="w-4 h-4 rounded cursor-pointer accent-indigo-600"
                  />
                </th>
              )}
              {headers.map(({ col, label, className }) => (
                <th key={col} className={`py-3 px-4 text-left ${className ?? ""}`}>
                  <button type="button" onClick={() => handleSort(col)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors uppercase tracking-wide">
                    {label}
                    <SortIcon col={col} activeCol={sortCol} dir={sortDir} />
                  </button>
                </th>
              ))}
              <th className="py-3 px-4 w-[100px]">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginated.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onStatusChange={onStatusChange}
                  selected={selectedTaskIds?.has(task.id)}
                  onSelect={onSelectTask}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: stats + export */}
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs text-neutral-400">
            {tasks.length} task(s)
          </p>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Done: {tasks.filter((t) => t.status === "DONE").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Progress: {tasks.filter((t) => t.status === "IN_PROGRESS").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              To Do: {tasks.filter((t) => t.status === "TODO").length}
            </span>
          </div>
          <ExportDropdown tasks={sorted} />
        </div>

        {/* Right: pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-neutral-400 ml-1">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
