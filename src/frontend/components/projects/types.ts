export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export interface ProjectUser {
  id: string;
  name: string | null;
  email: string | null;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  pinned: boolean;
  deadline: string | null;
  owner: ProjectUser;
  _count: { tasks: number; members: number };
  doneTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  ACTIVE:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ON_HOLD:   "bg-amber-500/10  text-amber-400  border-amber-500/20",
  COMPLETED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  ARCHIVED:  "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed", ARCHIVED: "Archived",
};
