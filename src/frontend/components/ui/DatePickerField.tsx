"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerFieldProps {
  value: string;          // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function parseLocal(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function DatePickerField({
  value, onChange, placeholder = "Select date...", minDate, className,
}: DatePickerFieldProps) {
  const selected = parseLocal(value);
  const today    = new Date();

  // viewDate = which month is currently shown in the calendar
  // Persists between open/close — the key fix
  const [viewDate, setViewDate] = useState<Date>(() => selected ?? new Date());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // When value changes externally, jump view to selected month
  useEffect(() => {
    if (selected) setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]); // eslint-disable-line

  // Close on outside click — does NOT reset viewDate
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const prevMonth = useCallback(() =>
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() =>
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1)), []);

  const selectDate = (d: Date) => {
    onChange(toYMD(d));
    setOpen(false);
    // viewDate stays at selected month — does NOT reset
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    // viewDate stays where it is — does NOT reset to today
  };

  // Build grid
  const year     = viewDate.getFullYear();
  const month    = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const daysInP  = new Date(year, month, 0).getDate();

  type Cell = { date: Date; cur: boolean };
  const cells: Cell[] = [];

  // Padding from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInP - i), cur: false });
  }
  // Current month
  for (let d = 1; d <= daysInM; d++) {
    cells.push({ date: new Date(year, month, d), cur: true });
  }
  // Padding to fill 6 rows
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), cur: false });
  }

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm transition-all group ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/30"
            : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500"
        }`}
      >
        <CalendarDays className={`w-4 h-4 flex-shrink-0 transition-colors ${open ? "text-indigo-500" : "text-neutral-400 group-hover:text-indigo-500"}`} />
        <span className={`flex-1 text-left ${selected ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
          {selected ? displayValue : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={clearDate}
            onKeyDown={(e) => { if (e.key === "Enter") clearDate(e as unknown as React.MouseEvent); }}
            className="p-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Calendar popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xl shadow-black/10 dark:shadow-black/40 p-4 left-0"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {MONTHS[month]} {year}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 py-1">{d}</div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell, idx) => {
                const isSelected  = selected && sameDay(cell.date, selected);
                const isToday     = sameDay(cell.date, today);
                const isDisabled  = minDate ? cell.date < minDate : false;

                return (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={!cell.cur || isDisabled}
                    onClick={() => cell.cur && !isDisabled && selectDate(cell.date)}
                    whileHover={cell.cur && !isDisabled ? { scale: 1.15 } : {}}
                    whileTap={cell.cur && !isDisabled ? { scale: 0.9 } : {}}
                    className={`relative flex items-center justify-center h-9 w-full rounded-lg text-sm font-medium transition-colors ${
                      !cell.cur
                        ? "text-neutral-300 dark:text-neutral-700 cursor-default"
                        : isDisabled
                        ? "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold"
                        : isToday
                        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold ring-1 ring-indigo-300 dark:ring-indigo-500/40"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {cell.date.getDate()}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  selectDate(today);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              >
                Today
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
