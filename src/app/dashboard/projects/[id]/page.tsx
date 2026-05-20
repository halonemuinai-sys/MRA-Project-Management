"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/frontend/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, Users, CheckCircle2, AlertCircle, Loader2, LayoutGrid, List, CalendarDays, GanttChart } from "lucide-react";
import Link from "next/link";

import { KanbanTask, KanbanProject, KanbanMember, TaskStatus, Priority, COLUMNS } from "@/frontend/components/kanban/types";
import { useProjectSync } from "@/frontend/hooks/useProjectSync";
import { useKeyboardShortcuts } from "@/frontend/hooks/useKeyboardShortcuts";
import { ShortcutsModal } from "@/frontend/components/ui/ShortcutsModal";
import { MarkdownRenderer } from "@/frontend/components/ui/MarkdownRenderer";
import { Breadcrumb } from "@/frontend/components/layout/Breadcrumb";
import { KanbanColumn } from "@/frontend/components/kanban/KanbanColumn";
import { AddTaskModal } from "@/frontend/components/kanban/AddTaskModal";
import { EditTaskModal } from "@/frontend/components/kanban/EditTaskModal";
import { TaskDetailModal } from "@/frontend/components/kanban/TaskDetailModal";
import { MembersPanel } from "@/frontend/components/kanban/MembersPanel";
import { KanbanFilterBar, KanbanFilters } from "@/frontend/components/kanban/KanbanFilterBar";
import { TaskListView } from "@/frontend/components/kanban/TaskListView";
import { BulkActionBar } from "@/frontend/components/kanban/BulkActionBar";
import { CalendarView } from "@/frontend/components/kanban/CalendarView";
import { GanttView } from "@/frontend/components/kanban/GanttView";

// ─── Module-level constants ─────────────────────────────────────────────────────

const PROJECT_STATUS_STYLES = {
  ACTIVE:    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ON_HOLD:   "bg-amber-500/10  text-amber-500  border-amber-500/20",
  COMPLETED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  ARCHIVED:  "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
} as const;

const PROJECT_STATUS_LABELS = {
  ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed", ARCHIVED: "Archived",
} as const;

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
};

const PRIORITY_WEIGHT: Record<Priority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  // ── State ────────────────────────────────────────────────────────────────────
  const [project, setProject] = useState<KanbanProject | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [members, setMembers] = useState<KanbanMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [viewingTask, setViewingTask] = useState<KanbanTask | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar" | "gantt">("kanban");
  const [filters, setFilters] = useState<KanbanFilters>({
    priority: "ALL",
    assigneeId: "ALL",
    sortBy: "newest",
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Deadline / overdue — kept in state to avoid hydration mismatch
  const [overdueTasks, setOverdueTasks] = useState<KanbanTask[]>([]);
  const [deadlineDays, setDeadlineDays] = useState<number | null>(null);
  const [deadlineStr, setDeadlineStr] = useState("–");

  // ── Derived data (hooks must all be above early returns) ────────────────────
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.priority !== "ALL") {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.assigneeId !== "ALL") {
      result = result.filter((t) => t.assignee?.id === filters.assigneeId);
    }
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "due_asc":  {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1; if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        case "due_desc": {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1; if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        case "priority_high": return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        case "priority_low":  return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        default:              return 0;
      }
    });
    return result;
  }, [tasks, filters]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    const [projRes, meRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch("/api/users/me"),
    ]);
    if (projRes.status === 404) { setNotFound(true); return; }
    if (!projRes.ok) return;
    const raw = await projRes.json();
    const me = meRes.ok ? await meRes.json() : null;
    // Normalize TaskLabel[] → KanbanLabel[]
    const data: KanbanProject = {
      ...raw,
      tasks: raw.tasks.map((t: KanbanTask & { labels?: { label: { id: string; name: string; color: string } }[]; _count?: { subtasks: number } }) => ({
        ...t,
        labels: (t.labels ?? []).map((tl: { label: { id: string; name: string; color: string } }) => tl.label),
        _count: t._count,
      })),
    };
    setProject(data);
    setTasks(data.tasks);
    setMembers(data.members);
    if (me) setCurrentUserId(me.id);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: "k", description: "Kanban view", ignoreInInputs: true, handler: () => setViewMode("kanban") },
    { key: "l", description: "List view",   ignoreInInputs: true, handler: () => setViewMode("list") },
    { key: "c", description: "Calendar view", ignoreInInputs: true, handler: () => setViewMode("calendar") },
    { key: "g", description: "Gantt view",  ignoreInInputs: true, handler: () => setViewMode("gantt") },
    { key: "n", description: "Create new task", ignoreInInputs: true, handler: () => setAddTaskStatus("TODO") },
    { key: "?", description: "Show shortcuts", ignoreInInputs: true, handler: () => setShowShortcuts(true) },
    { key: "Escape", description: "Close shortcuts", handler: () => setShowShortcuts(false) },
  ]);

  // Real-time sync via SSE — other users' changes reflected instantly
  useProjectSync(id, {
    onTaskCreated: (task) => setTasks((prev) => prev.some((t) => t.id === task.id) ? prev : [task, ...prev]),
    onTaskUpdated: (task) => setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...task } : t)),
    onTaskDeleted: ({ id: taskId }) => setTasks((prev) => prev.filter((t) => t.id !== taskId)),
  });

  useEffect(() => {
    const now = new Date();
    setOverdueTasks(tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"));
    const deadline = project?.deadline;
    if (deadline) {
      setDeadlineDays(Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000));
      setDeadlineStr(new Date(deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }));
    } else {
      setDeadlineDays(null);
      setDeadlineStr("–");
    }
  }, [tasks, project?.deadline]);

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const toggleTask = (taskId: string, sel: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (sel) next.add(taskId); else next.delete(taskId);
      return next;
    });
  };
  const clearSelection = () => setSelectedTaskIds(new Set());

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).style.opacity = "0.4";
    (e.target as HTMLElement).style.transform = "rotate(2deg)";
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    (e.target as HTMLElement).style.transform = "rotate(0deg)";
    setDragOverStatus(null);
  };
  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStatus(null);
  };
  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) handleStatusChange(taskId, newStatus);
  };

  // ── Task actions ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const prev = tasks.find((t) => t.id === taskId);
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast(`Task moved to ${STATUS_LABELS[newStatus]}.`, "success");
    } else {
      setTasks((p) => p.map((t) => t.id === taskId ? { ...t, status: prev!.status } : t));
      toast("Failed to update status.", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const deleted = tasks.find((t) => t.id === taskId);
    setTasks((p) => p.filter((t) => t.id !== taskId));
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      toast(`Task "${deleted?.title}" deleted.`, "info");
    } else {
      if (deleted) setTasks((p) => [deleted, ...p]);
      toast("Failed to delete task.", "error");
    }
  };

  const handleTaskCreated = (task: KanbanTask) => {
    setTasks((p) => [task, ...p]);
    toast(`Task "${task.title}" created successfully.`, "success");
  };

  const handleTaskUpdated = (updated: KanbanTask) => {
    setTasks((p) => p.map((t) => t.id === updated.id ? updated : t));
    toast(`Task "${updated.title}" updated successfully.`, "success");
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    const ids = [...selectedTaskIds];
    await Promise.all(ids.map((tid) =>
      fetch(`/api/tasks/${tid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    ));
    setTasks((p) => p.map((t) => selectedTaskIds.has(t.id) ? { ...t, status } : t));
    toast(`${ids.length} task(s) updated to ${STATUS_LABELS[status]}.`, "success");
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedTaskIds];
    await Promise.all(ids.map((tid) => fetch(`/api/tasks/${tid}`, { method: "DELETE" })));
    setTasks((p) => p.filter((t) => !selectedTaskIds.has(t.id)));
    toast(`${ids.length} task(s) deleted.`, "info");
  };

  // ── Render guards (all hooks above this line) ─────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <AlertCircle className="w-12 h-12 text-neutral-300 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Project not found</h2>
        <Link href="/dashboard/projects" className="mt-4 text-sm text-indigo-500 hover:underline">Back to project list</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  // ── Post-guard computations (not hooks) ────────────────────────────────────────
  const tasksByStatus = (status: TaskStatus) => filteredTasks.filter((t) => t.status === status);
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
        {addTaskStatus && (
          <AddTaskModal projectId={id} members={members} initialStatus={addTaskStatus}
            onClose={() => setAddTaskStatus(null)} onCreated={handleTaskCreated} />
        )}
        {editingTask && (
          <EditTaskModal task={editingTask} members={members}
            onClose={() => setEditingTask(null)} onUpdated={handleTaskUpdated} />
        )}
        {viewingTask && (
          <TaskDetailModal task={viewingTask} currentUserId={currentUserId} projectId={id}
            members={members}
            onClose={() => setViewingTask(null)}
            onTaskUpdated={handleTaskUpdated} />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Breadcrumb + Header */}
        <div>
          <Breadcrumb items={[
            { label: "Projects", href: "/dashboard/projects" },
            { label: project.name },
          ]} />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">{project.name}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${PROJECT_STATUS_STYLES[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
              {project.description && (
                <div className="mt-1.5 max-w-xl">
                  <MarkdownRenderer content={project.description} className="text-neutral-500 dark:text-neutral-400 text-sm" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 gap-0.5">
                <button type="button" onClick={() => setViewMode("kanban")} title="Kanban view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "kanban"
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setViewMode("list")} title="List view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "list"
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <List className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setViewMode("calendar")} title="Calendar view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "calendar"
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <CalendarDays className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setViewMode("gantt")} title="Gantt view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "gantt"
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <GanttChart className="w-4 h-4" />
                </button>
              </div>
              <button type="button" onClick={() => setAddTaskStatus("TODO")}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tasks",  value: tasks.length,                        icon: CheckCircle2, color: "text-indigo-500" },
            { label: "In Progress",  value: tasksByStatus("IN_PROGRESS").length, icon: Loader2,      color: "text-amber-500" },
            { label: "Members",      value: project._count.members,              icon: Users,        color: "text-emerald-500" },
            { label: "Deadline",     value: deadlineStr,                         icon: Clock,        color: "text-rose-500" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Deadline / Overdue warnings */}
        {(deadlineDays !== null && deadlineDays < 0 || deadlineDays !== null && deadlineDays <= 7 || overdueTasks.length > 0) && (
          <div className="space-y-2">
            {deadlineDays !== null && deadlineDays < 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Project deadline was {Math.abs(deadlineDays)} day(s) ago.
                </p>
              </motion.div>
            )}
            {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Project deadline {deadlineDays === 0 ? "is today!" : `in ${deadlineDays} day(s).`}
                </p>
              </motion.div>
            )}
            {overdueTasks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  {overdueTasks.length} overdue task(s): {overdueTasks.slice(0, 2).map((t) => `"${t.title}"`).join(", ")}
                  {overdueTasks.length > 2 && ` and ${overdueTasks.length - 2} more.`}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Overall Progress</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-indigo-600 rounded-full" />
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">{doneCount} of {tasks.length} task(s) completed</p>
          </div>
        )}

        {/* Members */}
        <MembersPanel
          projectId={id}
          members={members}
          ownerId={project.owner.id}
          currentUserId={currentUserId}
          onMembersChange={setMembers}
        />

        {/* Filter bar */}
        {tasks.length > 0 && (
          <KanbanFilterBar
            filters={filters}
            members={members}
            totalCount={tasks.length}
            filteredCount={filteredTasks.length}
            onChange={setFilters}
          />
        )}

        {filteredTasks.length < tasks.length && (
          <p className="text-sm text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{filteredTasks.length}</span>
            {" "}of {tasks.length} task(s)
          </p>
        )}

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedTaskIds.size > 0 && (
            <BulkActionBar
              selectedCount={selectedTaskIds.size}
              onClearSelection={clearSelection}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          )}
        </AnimatePresence>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.key}
                  column={col}
                  tasks={tasksByStatus(col.key)}
                  isDragOver={dragOverStatus === col.key}
                  onAddTask={setAddTaskStatus}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onEdit={setEditingTask}
                  onView={setViewingTask}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  selectedTaskIds={selectedTaskIds}
                  onSelectTask={toggleTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <TaskListView
            tasks={filteredTasks}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onView={setViewingTask}
            onStatusChange={handleStatusChange}
            selectedTaskIds={selectedTaskIds}
            onSelectTask={toggleTask}
          />
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <CalendarView tasks={filteredTasks} onView={setViewingTask} />
        )}

        {/* Gantt View */}
        {viewMode === "gantt" && (
          <GanttView tasks={filteredTasks} onView={setViewingTask} projectName={project.name} />
        )}
      </div>
    </>
  );
}
