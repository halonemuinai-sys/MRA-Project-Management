"use client";

import { useState, useMemo } from "react";
import { Plus, FolderKanban, ArrowUpDown, Flag, Calendar, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { KanbanTask, TaskStatus, Priority, COLUMNS } from "./types";
import { TaskCard } from "./TaskCard";

type ColumnConfig = (typeof COLUMNS)[number];
type ColumnSort = "default" | "priority" | "due_asc" | "due_desc";

const PRIORITY_WEIGHT: Record<Priority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const SORT_CYCLE: ColumnSort[] = ["default", "priority", "due_asc", "due_desc"];

const SORT_LABELS: Record<ColumnSort, { label: string; icon: React.ElementType }> = {
  default:   { label: "Default",         icon: ArrowUpDown },
  priority:  { label: "Priority ↓",       icon: Flag },
  due_asc:   { label: "Deadline ↑",      icon: Calendar },
  due_desc:  { label: "Deadline ↓",      icon: Clock },
};

function sortColumnTasks(tasks: KanbanTask[], sort: ColumnSort): KanbanTask[] {
  if (sort === "default") return tasks;
  return [...tasks].sort((a, b) => {
    switch (sort) {
      case "priority": return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      case "due_asc":  {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      case "due_desc": {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      default: return 0;
    }
  });
}

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: KanbanTask[];
  isDragOver: boolean;
  onAddTask: (status: TaskStatus) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: KanbanTask) => void;
  onView: (task: KanbanTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  selectedTaskIds?: Set<string>;
  onSelectTask?: (id: string, selected: boolean) => void;
}

export function KanbanColumn({
  column, tasks, isDragOver,
  onAddTask, onStatusChange, onDelete, onEdit, onView,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  selectedTaskIds, onSelectTask,
}: KanbanColumnProps) {
  const [columnSort, setColumnSort] = useState<ColumnSort>("default");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedTasks = useMemo(() => sortColumnTasks(tasks, columnSort), [tasks, columnSort]);

  const SortIcon = SORT_LABELS[columnSort].icon;
  const isCustomSort = columnSort !== "default";

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(columnSort);
    setColumnSort(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{column.label}</h3>
          <span className="text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sort button */}
          <div className="relative">
            <button type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              title={`Sort: ${SORT_LABELS[columnSort].label}`}
              className={`p-1 rounded-lg transition-colors ${
                isCustomSort
                  ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}>
              <SortIcon className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute left-0 top-8 z-20 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
                  onMouseLeave={() => setShowSortMenu(false)}
                >
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 pt-2.5 pb-1">
                    Column Sort
                  </p>
                  {SORT_CYCLE.map((s) => {
                    const Icon = SORT_LABELS[s].icon;
                    return (
                      <button key={s} type="button"
                        onClick={() => { setColumnSort(s); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          columnSort === s
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {SORT_LABELS[s].label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add task button */}
          <button type="button" onClick={() => onAddTask(column.key)}
            title={`Add task to ${column.label}`}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-500 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => onDragOver(e, column.key)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, column.key)}
        className={`flex-1 rounded-2xl border-2 border-t-4 transition-all duration-300 p-3 space-y-3 min-h-[200px] ${
          isDragOver
            ? `${column.dragBorder} ${column.dragBg} scale-[1.02] shadow-xl border-dashed ${column.topBorder}`
            : `border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 ${column.topBorder}`
        }`}
      >
        {sortedTasks.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-10 rounded-xl border border-dashed transition-all duration-200 ${
            isDragOver
              ? `${column.dragBorder} ${column.dragText} font-bold`
              : "border-neutral-200 dark:border-neutral-700"
          }`}>
            {isDragOver ? (
              <p className={`text-sm font-bold ${column.dragText}`}>⬇ Drop here!</p>
            ) : (
              <>
                <FolderKanban className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mb-1.5" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">No tasks</p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                selected={selectedTaskIds?.has(task.id)}
                onSelect={onSelectTask}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
