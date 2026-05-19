"use client";

import { Plus, FolderKanban } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { KanbanTask, TaskStatus, COLUMNS } from "./types";
import { TaskCard } from "./TaskCard";

type ColumnConfig = (typeof COLUMNS)[number];

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
}

export function KanbanColumn({
  column, tasks, isDragOver,
  onAddTask, onStatusChange, onDelete, onEdit, onView,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: KanbanColumnProps) {
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
        <button type="button" onClick={() => onAddTask(column.key)}
          title={`Tambah tugas ke ${column.label}`}
          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-500 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
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
        {tasks.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-10 rounded-xl border border-dashed transition-all duration-200 ${
            isDragOver
              ? `${column.dragBorder} ${column.dragText} font-bold`
              : "border-neutral-200 dark:border-neutral-700"
          }`}>
            {isDragOver ? (
              <p className={`text-sm font-bold ${column.dragText}`}>⬇ Drop di sini!</p>
            ) : (
              <>
                <FolderKanban className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mb-1.5" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Tidak ada tugas</p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
