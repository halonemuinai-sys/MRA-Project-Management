"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Flag, Calendar, Trash2, Pencil, ChevronDown, MessageSquare, ListChecks } from "lucide-react";
import { KanbanTask, TaskStatus, COLUMNS, PRIORITY_STYLES } from "./types";

interface TaskCardProps {
  task: KanbanTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: KanbanTask) => void;
  onView: (task: KanbanTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function TaskCard({ task, onStatusChange, onDelete, onEdit, onView, onDragStart, onDragEnd, selected, onSelect }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    setIsOverdue(!!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE");
  }, [task.dueDate, task.status]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group relative bg-white dark:bg-neutral-800 rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing active:shadow-xl active:scale-[1.01] ${
        selected
          ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/30 dark:bg-indigo-500/5"
          : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-600"
      }`}
    >
      {/* Checkbox for bulk selection — stopPropagation prevents drag from firing on the checkbox */}
      {onSelect && (
        <div
          className="absolute top-3 left-3 z-10"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => onSelect(task.id, e.target.checked)}
            title="Select task"
            className="w-4 h-4 rounded cursor-pointer accent-indigo-600"
          />
        </div>
      )}

      {/* Menu */}
      <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${onSelect ? "z-10" : ""}`}>
        <div className="relative">
          <button type="button" onClick={() => setShowMenu((v) => !v)} title="Task options"
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-7 z-20 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button type="button" onClick={() => { onView(task); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> View Detail
                </button>
                <button type="button" onClick={() => { onEdit(task); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button type="button" onClick={() => { setShowStatusPicker(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" /> Change Status
                </button>
                <button type="button" onClick={() => { onDelete(task.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status picker overlay */}
      <AnimatePresence>
        {showStatusPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-white dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-neutral-500 mb-1">Move to:</p>
            {COLUMNS.map((col) => (
              <button key={col.key} type="button"
                onClick={() => { onStatusChange(task.id, col.key); setShowStatusPicker(false); }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${task.status === col.key
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${col.dot}`} />
                {col.label}
              </button>
            ))}
            <button type="button" onClick={() => setShowStatusPicker(false)}
              className="text-xs text-neutral-400 hover:text-neutral-600 mt-1 text-center">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority + checkbox row */}
      <div className={`flex items-center gap-2 mb-2.5 ${onSelect ? "pl-6" : ""}`}>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
          <Flag className="w-2.5 h-2.5" />{task.priority}
        </span>
      </div>

      {/* Title */}
      <p className={`text-sm font-semibold leading-snug pr-6 ${onSelect ? "pl-6" : ""} ${task.status === "DONE"
        ? "line-through text-neutral-400"
        : "text-neutral-900 dark:text-white"}`}>
        {task.title}
      </p>

      {task.description && (
        <p className={`text-xs text-neutral-400 mt-1.5 line-clamp-2 ${onSelect ? "pl-6" : ""}`}>{task.description}</p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-2 ${onSelect ? "pl-6" : ""}`}>
          {task.labels.map((l) => (
            <span key={l.id} className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: l.color }}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {task._count && task._count.subtasks > 0 && (
        <div className={`mt-2 ${onSelect ? "pl-6" : ""}`}>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-0.5">
            <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" />{task._count.completedSubtasks ?? 0}/{task._count.subtasks}</span>
          </div>
          <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${Math.round(((task._count.completedSubtasks ?? 0) / task._count.subtasks) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 ${onSelect ? "pl-6" : ""}`}>
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(task.assignee.name ?? task.assignee.email ?? "?")[0].toUpperCase()}
            </div>
            <span className="text-xs text-neutral-500 truncate max-w-[80px]">
              {task.assignee.name ?? task.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-xs text-neutral-300 dark:text-neutral-600">No assignee</span>
        )}
        {task.dueDate && (
          <span suppressHydrationWarning
            className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-500" : "text-neutral-400"}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}
