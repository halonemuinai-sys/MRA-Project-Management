"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, Loader2, Eye, Pencil } from "lucide-react";
import { KanbanTask, KanbanMember, TaskStatus, Priority } from "./types";
import { MarkdownRenderer } from "@/frontend/components/ui/MarkdownRenderer";
import { DatePickerField } from "@/frontend/components/ui/DatePickerField";

interface AddTaskModalProps {
  projectId: string;
  members: KanbanMember[];
  initialStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: KanbanTask) => void;
}

export function AddTaskModal({ projectId, members, initialStatus, onClose, onCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [descTab, setDescTab] = useState<"write" | "preview">("write");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, assigneeId: assigneeId || null }),
    });
    setLoading(false);
    if (!res.ok) { setError("Failed to create task."); return; }
    onCreated(await res.json());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Add Task</h2>
          <button type="button" onClick={onClose} title="Close"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Brief task description..." title="Task title"
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Description</label>
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 gap-0.5">
                <button type="button" onClick={() => setDescTab("write")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${descTab === "write" ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <Pencil className="w-3 h-3" /> Write
                </button>
                <button type="button" onClick={() => setDescTab("preview")} disabled={!description}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 ${descTab === "preview" ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}>
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>
            {descTab === "write" ? (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="Supports **Markdown**: bold, _italic_, `code`, - list..." title="Task description"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-mono" />
            ) : (
              <div className="min-h-[76px] px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                <MarkdownRenderer content={description} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} title="Task status"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} title="Task priority"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Due Date</label>
              <DatePickerField value={dueDate} onChange={setDueDate} placeholder="Select due date..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Assignee</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} title="Assignee"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="">None</option>
                {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name ?? m.user.email}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
