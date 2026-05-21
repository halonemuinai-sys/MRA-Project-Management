"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MessageSquare, Loader2, Trash2, Send, Flag, Calendar,
  Pencil, Check, Activity, ListChecks, Plus, Tag, Paperclip,
  FileText, Image, Download, File, Link2, Clock, Play, Square,
  AlertTriangle, Timer,
} from "lucide-react";
import { KanbanTask, KanbanComment, KanbanSubtask, KanbanLabel, KanbanMember, KanbanDependency, KanbanTimeEntry, PRIORITY_STYLES, TaskStatus, Priority } from "./types";
import { useToast } from "@/frontend/lib/toast";
import { MarkdownRenderer } from "@/frontend/components/ui/MarkdownRenderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogEntry {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
}

interface KanbanAttachment {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedBy: { id: string; name: string | null; email: string | null };
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  STATUS: "status", PRIORITY: "priority", TITLE: "title", ASSIGNEE: "assignee",
};

function formatActivity(action: string, oldVal: string | null, newVal: string | null) {
  const label = ACTION_LABELS[action] ?? action.toLowerCase();
  if (action === "ASSIGNEE") {
    if (!oldVal) return "assigned an assignee";
    if (!newVal) return "removed assignee";
    return `changed ${label}`;
  }
  if (oldVal && newVal) return `changed ${label} from "${oldVal}" to "${newVal}"`;
  if (newVal) return `changed ${label} to "${newVal}"`;
  return `changed ${label}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimetype: string) {
  if (mimetype.startsWith("image/")) return Image;
  if (mimetype.includes("pdf")) return FileText;
  return File;
}

// Highlight @mentions in comment text
function renderCommentContent(text: string) {
  const parts = text.split(/(@[\w.\-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="text-indigo-500 font-semibold">{part}</span>
      : <span key={i}>{part}</span>
  );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({ comment, isOwn, onDelete, onUpdated }: {
  comment: KanbanComment;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onUpdated: (updated: KanbanComment) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft === comment.content) { setEditing(false); return; }
    setSaving(true);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setSaving(false);
    if (!res.ok) { toast("Failed to save comment.", "error"); return; }
    onUpdated(await res.json());
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
        {(comment.author.name ?? comment.author.email ?? "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {comment.author.name ?? comment.author.email}
          </span>
          <span suppressHydrationWarning className="text-[10px] text-neutral-400">
            {new Date(comment.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-[10px] text-neutral-300 dark:text-neutral-600 italic">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="mt-1.5 space-y-1.5">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
                if (e.key === "Escape") { setEditing(false); setDraft(comment.content); }
              }}
              rows={3} autoFocus title="Edit comment"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-indigo-400 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none resize-none" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSave} disabled={saving || !draft.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
              </button>
              <button type="button" onClick={() => { setEditing(false); setDraft(comment.content); }}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
            {renderCommentContent(comment.content)}
          </p>
        )}
      </div>
      {isOwn && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button type="button" onClick={() => setEditing(true)} title="Edit"
            className="p-1 rounded text-neutral-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(comment.id)} title="Delete"
            className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────

function ActivityItem({ log }: { log: ActivityLogEntry }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 text-xs font-bold flex-shrink-0 mt-0.5">
        {(log.user.name ?? log.user.email ?? "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold">{log.user.name ?? log.user.email}</span>
          {" "}{formatActivity(log.action, log.oldValue, log.newValue)}
        </p>
        <span suppressHydrationWarning className="text-[10px] text-neutral-400 mt-0.5 block">
          {new Date(log.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ─── SubtaskItem ──────────────────────────────────────────────────────────────

function SubtaskItem({ subtask, onToggle, onDelete, onRename }: {
  subtask: KanbanSubtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);

  const handleRename = () => {
    const t = draft.trim();
    if (t && t !== subtask.title) onRename(subtask.id, t);
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 group py-1">
      <input type="checkbox" checked={subtask.completed}
        onChange={(e) => onToggle(subtask.id, e.target.checked)}
        className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer" />
      {editing ? (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
          onBlur={handleRename}
          onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setEditing(false); setDraft(subtask.title); } }}
          className="flex-1 text-sm bg-neutral-50 dark:bg-neutral-800 border border-indigo-400 rounded-lg px-2 py-0.5 focus:outline-none" />
      ) : (
        <span onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-pointer select-none ${subtask.completed ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>
          {subtask.title}
        </span>
      )}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={() => setEditing(true)}
          className="p-1 rounded text-neutral-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
          <Pencil className="w-3 h-3" />
        </button>
        <button type="button" onClick={() => onDelete(subtask.id)}
          className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── LabelChip ────────────────────────────────────────────────────────────────

function LabelChip({ label, onRemove }: { label: KanbanLabel; onRemove?: (id: string) => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: label.color }}>
      {label.name}
      {onRemove && (
        <button type="button" onClick={() => onRemove(label.id)} className="opacity-70 hover:opacity-100">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ─── MentionInput ─────────────────────────────────────────────────────────────

function MentionInput({ value, onChange, members, onSubmit, sending }: {
  value: string;
  onChange: (v: string) => void;
  members: KanbanMember[];
  onSubmit: (e: React.FormEvent) => void;
  sending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = members.filter((m) => {
    const name = (m.user.name ?? m.user.email ?? "").toLowerCase();
    return name.includes(mentionQuery.toLowerCase());
  }).slice(0, 5);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;
    onChange(val);

    // Detect @mention
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w.]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStart(textBeforeCursor.lastIndexOf("@"));
      setShowDropdown(true);
      setActiveIdx(0);
    } else {
      setShowDropdown(false);
      setMentionStart(-1);
    }
  };

  const insertMention = useCallback((member: KanbanMember) => {
    const name = (member.user.name ?? member.user.email ?? "").replace(/\s+/g, "");
    const before = value.slice(0, mentionStart);
    const after = value.slice(inputRef.current?.selectionStart ?? value.length);
    const next = `${before}@${name} ${after}`;
    onChange(next);
    setShowDropdown(false);
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + name.length + 2;
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    }, 0);
  }, [value, mentionStart, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filtered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filtered[activeIdx]); return; }
      if (e.key === "Escape")    { setShowDropdown(false); return; }
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
      <div className="flex-1 relative">
        <input ref={inputRef} value={value} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Write a comment... (use @ to mention)" title="Comment"
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />

        <AnimatePresence>
          {showDropdown && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-12 left-0 z-30 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden">
              {filtered.map((m, i) => (
                <button key={m.user.id} type="button" onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${i === activeIdx ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}>
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="truncate">{m.user.name ?? m.user.email}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="submit" disabled={sending || !value.trim()} title="Send"
        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: KanbanTask;
  currentUserId: string;
  projectId: string;
  members: KanbanMember[];
  onClose: () => void;
  onTaskUpdated?: (task: KanbanTask) => void;
}

type Tab = "comments" | "subtasks" | "files" | "activity" | "deps" | "time";

export function TaskDetailModal({ task, currentUserId, projectId, members, onClose, onTaskUpdated }: TaskDetailModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("comments");

  // Comments
  const [comments, setComments] = useState<KanbanComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Subtasks
  const [subtasks, setSubtasks] = useState<KanbanSubtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Labels
  const [taskLabels, setTaskLabels] = useState<KanbanLabel[]>(task.labels ?? []);
  const [projectLabels, setProjectLabels] = useState<KanbanLabel[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366f1");
  const [creatingLabel, setCreatingLabel] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<KanbanAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activity
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Dependencies
  const [deps, setDeps] = useState<KanbanDependency[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [depsLoaded, setDepsLoaded] = useState(false);
  const [addingDep, setAddingDep] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  // Time Tracking
  const [timeEntries, setTimeEntries] = useState<KanbanTimeEntry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loadingTime, setLoadingTime] = useState(false);
  const [timeLoaded, setTimeLoaded] = useState(false);
  const [activeTimer, setActiveTimer] = useState<KanbanTimeEntry | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [loggingTime, setLoggingTime] = useState(false);

  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    setIsOverdue(!!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE");
  }, [task.dueDate, task.status]);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then((d) => { setComments(d); setLoadingComments(false); });
  }, [task.id]);

  useEffect(() => {
    if (activeTab === "subtasks" && subtasks.length === 0) {
      setLoadingSubtasks(true);
      fetch(`/api/tasks/${task.id}/subtasks`)
        .then((r) => r.json())
        .then((d) => { setSubtasks(d); setLoadingSubtasks(false); });
    }
  }, [activeTab, task.id, subtasks.length]);

  useEffect(() => {
    if (activeTab === "files" && attachments.length === 0) {
      setLoadingAttachments(true);
      fetch(`/api/tasks/${task.id}/attachments`)
        .then((r) => r.json())
        .then((d) => { setAttachments(Array.isArray(d) ? d : []); setLoadingAttachments(false); });
    }
  }, [activeTab, task.id, attachments.length]);

  useEffect(() => {
    if (activeTab === "activity" && activityLogs.length === 0) {
      setLoadingActivity(true);
      fetch(`/api/tasks/${task.id}/activity`)
        .then((r) => r.json())
        .then((d) => { setActivityLogs(d); setLoadingActivity(false); });
    }
  }, [activeTab, task.id, activityLogs.length]);

  useEffect(() => {
    if (activeTab === "deps" && !depsLoaded) {
      setLoadingDeps(true);
      fetch(`/api/tasks/${task.id}/dependencies`)
        .then((r) => r.json())
        .then((d) => { setDeps(Array.isArray(d) ? d : []); setLoadingDeps(false); setDepsLoaded(true); });
    }
  }, [activeTab, task.id, depsLoaded]);

  useEffect(() => {
    if (activeTab === "time" && !timeLoaded) {
      setLoadingTime(true);
      fetch(`/api/tasks/${task.id}/time`)
        .then((r) => r.json())
        .then((d) => {
          setTimeEntries(d.entries ?? []);
          setTotalMinutes(d.totalMinutes ?? 0);
          const running = (d.entries ?? []).find((e: KanbanTimeEntry) => !e.endedAt);
          if (running) {
            setActiveTimer(running);
            setTimerSeconds(Math.floor((Date.now() - new Date(running.startedAt).getTime()) / 1000));
          }
          setLoadingTime(false);
          setTimeLoaded(true);
        });
    }
  }, [activeTab, task.id, timeLoaded]);

  // Live timer tick
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // ── Labels ───────────────────────────────────────────────────────────────────
  const openLabelPicker = async () => {
    setShowLabelPicker((v) => !v);
    if (projectLabels.length === 0) {
      setLoadingLabels(true);
      const res = await fetch(`/api/projects/${projectId}/labels`);
      if (res.ok) setProjectLabels(await res.json());
      setLoadingLabels(false);
    }
  };

  const handleAddLabel = async (label: KanbanLabel) => {
    if (taskLabels.some((l) => l.id === label.id)) return;
    setTaskLabels((prev) => [...prev, label]);
    const res = await fetch(`/api/tasks/${task.id}/labels`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId: label.id }),
    });
    if (!res.ok) { setTaskLabels((prev) => prev.filter((l) => l.id !== label.id)); toast("Failed to add label.", "error"); }
  };

  const handleRemoveLabel = async (labelId: string) => {
    const removed = taskLabels.find((l) => l.id === labelId);
    setTaskLabels((prev) => prev.filter((l) => l.id !== labelId));
    const res = await fetch(`/api/tasks/${task.id}/labels`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId }),
    });
    if (!res.ok) { if (removed) setTaskLabels((prev) => [...prev, removed]); toast("Failed to remove label.", "error"); }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setCreatingLabel(true);
    const res = await fetch(`/api/projects/${projectId}/labels`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
    });
    setCreatingLabel(false);
    if (!res.ok) { toast("Failed to create label.", "error"); return; }
    const label: KanbanLabel = await res.json();
    setProjectLabels((prev) => [...prev, label]);
    setNewLabelName("");
    handleAddLabel(label);
  };

  // ── Comments ─────────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);
    if (!res.ok) { toast("Failed to send comment.", "error"); return; }
    const comment: KanbanComment = await res.json();
    setComments((prev) => [...prev, comment]);
    setContent("");
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) { toast("Failed to delete comment.", "error"); return; }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  // ── Subtasks ──────────────────────────────────────────────────────────────────
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSubtask.trim() }),
    });
    setAddingSubtask(false);
    if (!res.ok) { toast("Failed to add subtask.", "error"); return; }
    const subtask: KanbanSubtask = await res.json();
    setSubtasks((prev) => [...prev, subtask]);
    setNewSubtask("");
  };

  const handleToggleSubtask = async (id: string, completed: boolean) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, completed } : s));
    const res = await fetch(`/api/subtasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) { setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, completed: !completed } : s)); toast("Failed to update subtask.", "error"); }
  };

  const handleDeleteSubtask = async (id: string) => {
    const deleted = subtasks.find((s) => s.id === id);
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    if (!res.ok) { if (deleted) setSubtasks((prev) => [...prev, deleted]); toast("Failed to delete subtask.", "error"); }
  };

  const handleRenameSubtask = async (id: string, title: string) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
    await fetch(`/api/subtasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  };

  // ── Attachments ───────────────────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast("Maximum file size is 10 MB.", "error"); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/tasks/${task.id}/attachments`, { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) { toast("Failed to upload file.", "error"); return; }
    const att: KanbanAttachment = await res.json();
    setAttachments((prev) => [att, ...prev]);
    toast(`"${file.name}" uploaded successfully.`, "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = async (id: string) => {
    const deleted = attachments.find((a) => a.id === id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (!res.ok) { if (deleted) setAttachments((prev) => [deleted, ...prev]); toast("Failed to delete file.", "error"); }
    else toast("File deleted.", "info");
  };

  // ── Dependencies ─────────────────────────────────────────────────────────────
  const handleAddDep = async (dependsOnId: string) => {
    setAddingDep(true);
    const res = await fetch(`/api/tasks/${task.id}/dependencies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnId }),
    });
    setAddingDep(false);
    if (!res.ok) { const d = await res.json(); toast(d.error ?? "Failed to add dependency.", "error"); return; }
    const dep: KanbanDependency = await res.json();
    setDeps((prev) => [...prev, dep]);
    setDepSearch("");
  };

  const handleRemoveDep = async (dependsOnId: string) => {
    const removed = deps.find((d) => d.dependsOn.id === dependsOnId);
    setDeps((prev) => prev.filter((d) => d.dependsOn.id !== dependsOnId));
    const res = await fetch(`/api/tasks/${task.id}/dependencies`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnId }),
    });
    if (!res.ok) { if (removed) setDeps((prev) => [...prev, removed]); toast("Failed to remove dependency.", "error"); }
  };

  // ── Time Tracking ─────────────────────────────────────────────────────────────
  const handleStartTimer = async () => {
    const res = await fetch(`/api/tasks/${task.id}/time`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    if (!res.ok) { toast("Failed to start timer.", "error"); return; }
    const entry: KanbanTimeEntry = await res.json();
    setActiveTimer(entry);
    setTimerSeconds(0);
    toast("Timer started.", "success");
  };

  const handleStopTimer = async () => {
    const res = await fetch(`/api/tasks/${task.id}/time`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    if (!res.ok) { toast("Failed to stop timer.", "error"); return; }
    const entry: KanbanTimeEntry = await res.json();
    setActiveTimer(null);
    setTimerSeconds(0);
    setTimeEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
    setTotalMinutes((m) => m + (entry.minutes ?? 0));
    toast(`Time logged: ${entry.minutes} min.`, "success");
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(logMinutes, 10);
    if (!minutes || minutes < 1) return;
    setLoggingTime(true);
    const res = await fetch(`/api/tasks/${task.id}/time`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", minutes, note: logNote || undefined }),
    });
    setLoggingTime(false);
    if (!res.ok) { toast("Failed to log time.", "error"); return; }
    const entry: KanbanTimeEntry = await res.json();
    setTimeEntries((prev) => [entry, ...prev]);
    setTotalMinutes((m) => m + minutes);
    setLogMinutes(""); setLogNote("");
    toast(`${minutes} min logged successfully.`, "success");
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    const entry = timeEntries.find((e) => e.id === entryId);
    setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTotalMinutes((m) => m - (entry?.minutes ?? 0));
    const res = await fetch(`/api/tasks/${task.id}/time`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });
    if (!res.ok) { if (entry) { setTimeEntries((prev) => [entry, ...prev]); setTotalMinutes((m) => m + (entry.minutes ?? 0)); } toast("Failed to delete time entry.", "error"); }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const doneSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0;
  const PRESET_COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

  const TABS = [
    { key: "comments" as Tab,  icon: MessageSquare, label: "Comments",     count: comments.length },
    { key: "subtasks" as Tab,  icon: ListChecks,    label: "Subtasks",    count: subtasks.length },
    { key: "deps"     as Tab,  icon: Link2,         label: "Dependencies", count: deps.length },
    { key: "time"     as Tab,  icon: Timer,         label: "Time",        count: timeEntries.length },
    { key: "files"    as Tab,  icon: Paperclip,     label: "Files",       count: attachments.length },
    { key: "activity" as Tab,  icon: Activity,      label: "Activity",    count: activityLogs.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                <Flag className="w-3 h-3" />{task.priority}
              </span>
              {isOverdue && <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">Overdue</span>}
            </div>
            <h2 className={`text-xl font-bold ${task.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
              {task.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} title="Close"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta + Labels */}
        <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
          {task.assignee && (
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                {(task.assignee.name ?? task.assignee.email ?? "?")[0].toUpperCase()}
              </div>
              {task.assignee.name ?? task.assignee.email}
            </span>
          )}
          {task.dueDate && (
            <span suppressHydrationWarning className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {taskLabels.map((l) => <LabelChip key={l.id} label={l} onRemove={handleRemoveLabel} />)}
            <div className="relative">
              <button type="button" onClick={openLabelPicker}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-400 hover:text-indigo-500 hover:border-indigo-400 transition-colors text-xs">
                <Tag className="w-3 h-3" /> Label
              </button>
              <AnimatePresence>
                {showLabelPicker && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute left-0 top-7 z-30 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-2"
                    onMouseLeave={() => setShowLabelPicker(false)}>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide px-1 pb-1.5">Project Labels</p>
                    {loadingLabels ? (
                      <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
                    ) : (
                      <div className="space-y-0.5 mb-2 max-h-32 overflow-y-auto">
                        {projectLabels.map((l) => {
                          const active = taskLabels.some((tl) => tl.id === l.id);
                          return (
                            <button key={l.id} type="button" onClick={() => active ? handleRemoveLabel(l.id) : handleAddLabel(l)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${active ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}>
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                              <span className="flex-1 text-left text-neutral-700 dark:text-neutral-300">{l.name}</span>
                              {active && <Check className="w-3 h-3 text-indigo-500" />}
                            </button>
                          );
                        })}
                        {projectLabels.length === 0 && <p className="text-xs text-neutral-400 px-1 pb-1">No labels yet.</p>}
                      </div>
                    )}
                    <form onSubmit={handleCreateLabel} className="border-t border-neutral-100 dark:border-neutral-800 pt-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Create New Label</p>
                      <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Label name..." title="Label name"
                        className="w-full px-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                            className={`w-4 h-4 rounded-full transition-transform ${newLabelColor === c ? "scale-125 ring-2 ring-offset-1 ring-neutral-400" : ""}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <button type="submit" disabled={creatingLabel || !newLabelName.trim()}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
                        {creatingLabel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Create
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
            <MarkdownRenderer content={task.description} className="text-neutral-600 dark:text-neutral-400" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto">
          {TABS.map(({ key, icon: Icon, label, count }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
                activeTab === key
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}>
              <Icon className="w-4 h-4" />
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Comments */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No comments yet. Use @ to mention members.</p>
              ) : (
                <AnimatePresence>
                  {comments.map((c) => (
                    <CommentItem key={c.id} comment={c} isOwn={c.author.id === currentUserId}
                      onDelete={handleDeleteComment}
                      onUpdated={(u) => setComments((prev) => prev.map((x) => x.id === u.id ? u : x))} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Subtasks */}
          {activeTab === "subtasks" && (
            <div className="space-y-1">
              {subtasks.length > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>{doneSubtasks}/{subtasks.length} completed</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{subtaskProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${subtaskProgress}%` }} transition={{ duration: 0.4 }}
                      className="h-full bg-indigo-500 rounded-full" />
                  </div>
                </div>
              )}
              {loadingSubtasks ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : subtasks.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No subtasks yet.</p>
              ) : (
                <AnimatePresence>
                  {subtasks.map((s) => (
                    <SubtaskItem key={s.id} subtask={s}
                      onToggle={handleToggleSubtask} onDelete={handleDeleteSubtask} onRename={handleRenameSubtask} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Files */}
          {activeTab === "files" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500">{attachments.length} file(s) · max. 10MB per file</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Upload File
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" />
              </div>

              {loadingAttachments ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Paperclip className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-sm text-neutral-400">No attachments yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {attachments.map((att) => {
                    const Icon = getFileIcon(att.mimetype);
                    return (
                      <motion.div key={att.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 group">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{att.originalName}</p>
                          <p className="text-xs text-neutral-400">
                            {formatFileSize(att.size)} · {att.uploadedBy.name ?? att.uploadedBy.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={att.url} download={att.originalName} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-indigo-500 transition-all">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button type="button" onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Dependencies */}
          {activeTab === "deps" && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">This task cannot start until the following tasks are completed.</p>

              {loadingDeps ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : deps.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Link2 className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-sm text-neutral-400">No dependencies yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deps.map((dep) => {
                    const statusColors: Record<TaskStatus, string> = {
                      TODO: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
                      IN_PROGRESS: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                      IN_REVIEW: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      DONE: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    };
                    const statusLabels: Record<TaskStatus, string> = { TODO:"To Do", IN_PROGRESS:"In Progress", IN_REVIEW:"In Review", DONE:"Done" };
                    return (
                      <motion.div key={dep.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 group">
                        {dep.dependsOn.status !== "DONE" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{dep.dependsOn.title}</p>
                          <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[dep.dependsOn.status]}`}>
                            {statusLabels[dep.dependsOn.status]}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleRemoveDep(dep.dependsOn.id)}
                          className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Add dependency by task ID */}
              <div className="pt-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">Add Dependency</p>
                <div className="flex gap-2">
                  <input value={depSearch} onChange={(e) => setDepSearch(e.target.value)}
                    placeholder="Task ID (cid...)" title="Task ID"
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono" />
                  <button type="button" onClick={() => depSearch.trim() && handleAddDep(depSearch.trim())}
                    disabled={addingDep || !depSearch.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50">
                    {addingDep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Tracking */}
          {activeTab === "time" && (
            <div className="space-y-4">
              {/* Total + Timer */}
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Total Time</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatMinutes(totalMinutes)}</p>
                </div>
                {activeTimer ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {formatDuration(timerSeconds)}
                    </div>
                    <button type="button" onClick={handleStopTimer}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl transition-colors">
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={handleStartTimer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors">
                    <Play className="w-3.5 h-3.5" /> Start Timer
                  </button>
                )}
              </div>

              {/* Manual log */}
              <form onSubmit={handleLogTime} className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Log Time Manually</p>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0 w-24">
                    <input type="number" value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)}
                      placeholder="Minutes" min={1} title="Duration in minutes"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  </div>
                  <input value={logNote} onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Note (optional)" title="Note"
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  <button type="submit" disabled={loggingTime || !logMinutes}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50 flex-shrink-0">
                    {loggingTime ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </form>

              {/* Entries list */}
              {loadingTime ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : timeEntries.filter((e) => e.endedAt).length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <Clock className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-sm text-neutral-400">No time logged yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {timeEntries.filter((e) => e.endedAt).map((entry) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700/50 group">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{formatMinutes(entry.minutes ?? 0)}</span>
                          <span className="text-xs text-neutral-400">{entry.user.name ?? entry.user.email}</span>
                        </div>
                        {entry.note && <p className="text-xs text-neutral-400 truncate">{entry.note}</p>}
                        <p suppressHydrationWarning className="text-[10px] text-neutral-300 dark:text-neutral-600">
                          {new Date(entry.startedAt).toLocaleDateString("en-US", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteTimeEntry(entry.id)}
                        className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
            <div className="space-y-0">
              {loadingActivity ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
              ) : activityLogs.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No activity recorded yet.</p>
              ) : (
                activityLogs.map((log) => <ActivityItem key={log.id} log={log} />)
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "comments" && (
          <MentionInput value={content} onChange={setContent} members={members}
            onSubmit={handleSend} sending={sending} />
        )}
        {activeTab === "subtasks" && (
          <form onSubmit={handleAddSubtask} className="flex gap-2 p-4 border-t border-neutral-100 dark:border-neutral-800">
            <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..." title="New subtask"
              className="flex-1 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            <button type="submit" disabled={addingSubtask || !newSubtask.trim()} title="Add"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50">
              {addingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
