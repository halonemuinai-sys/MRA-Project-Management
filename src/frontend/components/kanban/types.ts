export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface KanbanUser {
  id: string;
  name: string | null;
  email: string | null;
}

export interface KanbanSubtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
}

export interface KanbanDependency {
  id: string;
  dependsOn: { id: string; title: string; status: TaskStatus; priority: Priority };
}

export interface KanbanTimeEntry {
  id: string;
  startedAt: string;
  endedAt: string | null;
  minutes: number | null;
  note: string | null;
  user: KanbanUser;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  assignee: KanbanUser | null;
  createdAt: string;
  subtasks?: KanbanSubtask[];
  labels?: KanbanLabel[];
  _count?: { subtasks: number; completedSubtasks?: number };
}

export interface KanbanComment {
  id: string;
  content: string;
  author: KanbanUser;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanMember {
  user: KanbanUser;
  role: string;
}

export interface KanbanProject {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null;
  owner: KanbanUser;
  members: KanbanMember[];
  tasks: KanbanTask[];
  _count: { tasks: number; members: number };
}

export const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:      "text-neutral-400 bg-neutral-100 dark:bg-neutral-800",
  MEDIUM:   "text-amber-500  bg-amber-50    dark:bg-amber-500/10",
  HIGH:     "text-orange-500 bg-orange-50   dark:bg-orange-500/10",
  CRITICAL: "text-red-500    bg-red-50      dark:bg-red-500/10",
};

export const COLUMNS: {
  key: TaskStatus;
  label: string;
  dot: string;
  dragBorder: string;
  dragBg: string;
  dragText: string;
  topBorder: string;
}[] = [
  { key: "TODO",        label: "To Do",       dot: "bg-neutral-400", dragBorder: "border-neutral-400", dragBg: "bg-neutral-50 dark:bg-neutral-800/60",   dragText: "text-neutral-500",  topBorder: "border-t-neutral-400" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-indigo-500",  dragBorder: "border-indigo-400",  dragBg: "bg-indigo-50 dark:bg-indigo-500/10",     dragText: "text-indigo-500",   topBorder: "border-t-indigo-500" },
  { key: "IN_REVIEW",   label: "In Review",   dot: "bg-amber-500",   dragBorder: "border-amber-400",   dragBg: "bg-amber-50 dark:bg-amber-500/10",       dragText: "text-amber-500",    topBorder: "border-t-amber-500" },
  { key: "DONE",        label: "Done",        dot: "bg-emerald-500", dragBorder: "border-emerald-400", dragBg: "bg-emerald-50 dark:bg-emerald-500/10",   dragText: "text-emerald-500",  topBorder: "border-t-emerald-500" },
];
