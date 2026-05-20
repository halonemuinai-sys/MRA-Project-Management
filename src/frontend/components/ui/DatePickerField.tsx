"use client";

import DatePicker from "react-datepicker";
import { CalendarDays, X } from "lucide-react";
import { forwardRef } from "react";

interface DatePickerFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  minDate?: Date;
}

// Custom input that matches the project's design system
const CustomInput = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { hasValue: boolean; placeholder: string; onClear: () => void }>(
  ({ value, onClick, hasValue, placeholder, onClear }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm transition-all hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 group"
    >
      <CalendarDays className="w-4 h-4 text-neutral-400 flex-shrink-0 group-hover:text-indigo-500 transition-colors" />
      <span className={`flex-1 text-left ${hasValue ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
        {hasValue ? value : placeholder}
      </span>
      {hasValue && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onClear(); } }}
          className="p-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  )
);
CustomInput.displayName = "CustomInput";

export function DatePickerField({ value, onChange, placeholder = "Select date...", className, minDate }: DatePickerFieldProps) {
  const selected = value ? new Date(value + "T00:00:00") : null;

  const handleChange = (date: Date | null) => {
    if (!date) { onChange(""); return; }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
  };

  return (
    <div className={className}>
      <DatePicker
        selected={selected}
        onChange={handleChange}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholder}
        minDate={minDate}
        todayButton="Today"
        isClearable={false}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        customInput={
          <CustomInput
            hasValue={!!value}
            placeholder={placeholder}
            onClear={() => onChange("")}
          />
        }
        renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
          <div className="flex items-center justify-between px-1 py-1">
            <button
              type="button"
              onClick={decreaseMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={increaseMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              ›
            </button>
          </div>
        )}
      />
    </div>
  );
}
