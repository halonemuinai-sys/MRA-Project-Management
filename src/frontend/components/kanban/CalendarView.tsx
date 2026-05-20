"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { KanbanTask } from "./types";

interface CalendarViewProps {
  tasks: KanbanTask[];
  onView: (task: KanbanTask) => void;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const STATUS_DOT: Record<string, string> = {
  TODO:        "bg-neutral-400",
  IN_PROGRESS: "bg-indigo-500",
  IN_REVIEW:   "bg-amber-500",
  DONE:        "bg-emerald-500",
};

export function CalendarView({ tasks, onView }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  // Build calendar grid
  const { days, startPad } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { days: daysInMonth, startPad: firstDay };
  }, [year, month]);

  // Group tasks by date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells = Array.from({ length: startPad + days }, (_, i) => {
    const day = i - startPad + 1;
    if (day < 1) return null;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, dateKey, tasks: tasksByDate[dateKey] ?? [] };
  });

  const tasksWithDue = tasks.filter((t) => t.dueDate);
  const tasksThisMonth = tasksWithDue.filter((t) => {
    const d = new Date(t.dueDate!);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="space-y-4">
      {/* Header navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white min-w-[160px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <button type="button" onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button type="button" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
          <Calendar className="w-3.5 h-3.5" /> Hari Ini
        </button>
      </div>

      {/* Stats for month */}
      {tasksThisMonth.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{tasksThisMonth.length}</span> task(s) due this month
          {tasksThisMonth.filter((t) => t.status !== "DONE" && new Date(t.dueDate!) < now).length > 0 && (
            <span className="text-red-500 font-medium">
              · {tasksThisMonth.filter((t) => t.status !== "DONE" && new Date(t.dueDate!) < now).length} overdue
            </span>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-neutral-800">
          {DAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50" />;
            }
            const isToday = cell.dateKey === todayStr;
            const isPast = new Date(cell.dateKey) < new Date(todayStr) && !isToday;
            const hasOverdue = cell.tasks.some((t) => t.status !== "DONE" && isPast);

            return (
              <motion.div key={cell.dateKey}
                className={`min-h-[90px] p-1.5 border-b border-r border-neutral-100 dark:border-neutral-800 transition-colors ${
                  isToday ? "bg-indigo-50/60 dark:bg-indigo-500/5" : isPast ? "bg-neutral-50/60 dark:bg-neutral-950/30" : ""
                }`}>
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-indigo-600 text-white" : hasOverdue ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"
                }`}>
                  {cell.day}
                </div>
                <div className="space-y-0.5">
                  {cell.tasks.slice(0, 3).map((t) => (
                    <button key={t.id} type="button" onClick={() => onView(t)}
                      className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-left truncate hover:bg-white dark:hover:bg-neutral-800 transition-colors group">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                      <span className={`truncate ${t.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                        {t.title}
                      </span>
                    </button>
                  ))}
                  {cell.tasks.length > 3 && (
                    <p className="text-[10px] text-neutral-400 pl-1.5">+{cell.tasks.length - 3} lainnya</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
        {Object.entries(STATUS_DOT).map(([status, dot]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : status === "IN_REVIEW" ? "In Review" : "Done"}
          </span>
        ))}
      </div>
    </div>
  );
}
