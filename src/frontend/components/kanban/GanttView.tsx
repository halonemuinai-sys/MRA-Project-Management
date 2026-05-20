"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GanttChart, AlertCircle } from "lucide-react";
import { KanbanTask, Priority } from "./types";

interface GanttViewProps {
  tasks: KanbanTask[];
  onView: (task: KanbanTask) => void;
  projectName?: string;
}

// ─── Colour maps ───────────────────────────────────────────────────────────────

const PRIORITY_BAR: Record<Priority, string> = {
  LOW:      "bg-neutral-400",
  MEDIUM:   "bg-indigo-500",
  HIGH:     "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const PRIORITY_BAR_HOVER: Record<Priority, string> = {
  LOW:      "hover:bg-neutral-500",
  MEDIUM:   "hover:bg-indigo-600",
  HIGH:     "hover:bg-orange-600",
  CRITICAL: "hover:bg-red-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOf(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GanttView({ tasks, onView }: GanttViewProps) {
  const [tooltip, setTooltip] = useState<{ task: KanbanTask; x: number; y: number } | null>(null);

  const { rangeStart, totalDays, months, rows } = useMemo(() => {
    const withDate = tasks.filter((t) => t.dueDate || t.startDate);

    // Determine chart range
    const allDates: Date[] = [];
    for (const t of tasks) {
      if (t.startDate) allDates.push(new Date(t.startDate));
      if (t.dueDate)   allDates.push(new Date(t.dueDate));
      allDates.push(new Date(t.createdAt));
    }

    const minDate = allDates.length > 0
      ? startOf(new Date(Math.min(...allDates.map((d) => d.getTime()))))
      : startOf(new Date());
    const maxDate = allDates.length > 0
      ? startOf(new Date(Math.max(...allDates.map((d) => d.getTime()))))
      : addDays(minDate, 30);

    // Pad 3 days on each side
    const rangeStart = addDays(minDate, -3);
    const rangeEnd   = addDays(maxDate, 7);
    const totalDays  = Math.max(diffDays(rangeStart, rangeEnd), 14);

    // Build month header markers
    const months: { label: string; offsetDays: number; widthDays: number }[] = [];
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (cursor <= rangeEnd) {
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const start = Math.max(0, diffDays(rangeStart, cursor));
      const end   = Math.min(totalDays, diffDays(rangeStart, nextMonth));
      months.push({ label: monthLabel(cursor), offsetDays: start, widthDays: end - start });
      cursor = nextMonth;
    }

    // Build task rows
    const rows = tasks.map((t) => {
      const taskStart = startOf(new Date(t.startDate ?? t.createdAt));
      const taskEnd   = t.dueDate ? startOf(new Date(t.dueDate)) : addDays(taskStart, 1);
      const offsetDays = Math.max(0, diffDays(rangeStart, taskStart));
      const widthDays  = Math.max(1, diffDays(taskStart, taskEnd));
      const isOverdue  = !!t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
      return { task: t, offsetDays, widthDays, isOverdue, withDate: !!t.dueDate || !!t.startDate };
    });

    // Sort: tasks with dates first, then by start offset
    rows.sort((a, b) => {
      if (a.withDate !== b.withDate) return a.withDate ? -1 : 1;
      return a.offsetDays - b.offsetDays;
    });

    return { rangeStart, totalDays, months, rows, withDate };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <GanttChart className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500">No tasks to display in the Gantt chart</p>
      </motion.div>
    );
  }

  const COL_W = 28;   // px per day
  const ROW_H = 40;   // px per row
  const LABEL_W = 200; // px label column

  const today = startOf(new Date());
  const todayOffset = diffDays(rangeStart, today);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex-wrap">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Gantt Chart</span>
        <div className="flex items-center gap-3 ml-auto">
          {(["LOW","MEDIUM","HIGH","CRITICAL"] as Priority[]).map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className={`w-3 h-2 rounded-sm ${PRIORITY_BAR[p]}`} />{p}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="w-px h-3 bg-red-400" /> Today
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_W + totalDays * COL_W }}>
          {/* Month header */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wide border-r border-neutral-100 dark:border-neutral-800">
              Task
            </div>
            <div className="relative flex-1 h-8">
              {months.map((m) => (
                <div key={m.label + m.offsetDays}
                  className="absolute top-0 h-full flex items-center border-r border-neutral-200 dark:border-neutral-700"
                  style={{ left: m.offsetDays * COL_W, width: m.widthDays * COL_W }}>
                  <span className="text-[10px] font-semibold text-neutral-400 px-2 truncate">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {rows.map(({ task, offsetDays, widthDays, isOverdue }) => (
            <div key={task.id} className="flex border-b border-neutral-50 dark:border-neutral-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors group">
              {/* Label */}
              <div style={{ width: LABEL_W, minWidth: LABEL_W, height: ROW_H }}
                className="flex-shrink-0 px-3 flex items-center gap-2 border-r border-neutral-100 dark:border-neutral-800 cursor-pointer"
                onClick={() => onView(task)}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_BAR[task.priority]}`} />
                <span className={`text-xs truncate ${task.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {task.title}
                </span>
                {isOverdue && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 ml-auto" />}
              </div>

              {/* Bar area */}
              <div className="relative flex-1" style={{ height: ROW_H }}>
                {/* Today line */}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10 pointer-events-none"
                    style={{ left: todayOffset * COL_W }} />
                )}

                {/* Day grid lines */}
                {Array.from({ length: totalDays }, (_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800/60"
                    style={{ left: (i + 1) * COL_W }} />
                ))}

                {/* Task bar */}
                <button
                  type="button"
                  onClick={() => onView(task)}
                  onMouseEnter={(e) => setTooltip({ task, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  className={`absolute top-1/2 -translate-y-1/2 rounded-md text-white text-[10px] font-medium px-2 truncate transition-colors z-20 ${PRIORITY_BAR[task.priority]} ${PRIORITY_BAR_HOVER[task.priority]} ${task.status === "DONE" ? "opacity-50" : ""}`}
                  style={{
                    left: offsetDays * COL_W + 2,
                    width: Math.max(widthDays * COL_W - 4, 8),
                    height: 22,
                    lineHeight: "22px",
                  }}
                >
                  {widthDays * COL_W > 40 ? task.title : ""}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-xl shadow-xl pointer-events-none max-w-[220px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold truncate">{tooltip.task.title}</p>
          <p className="text-neutral-400 dark:text-neutral-500 mt-0.5">
            {tooltip.task.status.replace("_", " ")} · {tooltip.task.priority}
          </p>
          {tooltip.task.dueDate && (
            <p className="text-neutral-400 dark:text-neutral-500">
              Due: {new Date(tooltip.task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
