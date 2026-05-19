"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Loader2, Trash2, Send, Flag, Calendar, Pencil, Check } from "lucide-react";
import { KanbanTask, KanbanComment, PRIORITY_STYLES } from "./types";
import { useToast } from "@/frontend/lib/toast";

// ─── CommentItem ───────────────────────────────────────────────────────────────

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
    if (!res.ok) { toast("Gagal menyimpan komentar.", "error"); return; }
    onUpdated(await res.json());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
    if (e.key === "Escape") { setEditing(false); setDraft(comment.content); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
        {(comment.author.name ?? comment.author.email ?? "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {comment.author.name ?? comment.author.email}
          </span>
          <span suppressHydrationWarning className="text-[10px] text-neutral-400">
            {new Date(comment.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-[10px] text-neutral-300 dark:text-neutral-600 italic">(diedit)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              autoFocus
              title="Edit komentar"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-indigo-400 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSave} disabled={saving || !draft.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Simpan
              </button>
              <button type="button" onClick={() => { setEditing(false); setDraft(comment.content); }}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                Batal
              </button>
              <span className="text-[10px] text-neutral-300 dark:text-neutral-600 ml-auto">Ctrl+Enter simpan · Esc batal</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      {isOwn && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button type="button" onClick={() => setEditing(true)} title="Edit komentar"
            className="p-1 rounded text-neutral-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(comment.id)} title="Hapus komentar"
            className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: KanbanTask;
  currentUserId: string;
  onClose: () => void;
}

export function TaskDetailModal({ task, currentUserId, onClose }: TaskDetailModalProps) {
  const toast = useToast();
  const [comments, setComments] = useState<KanbanComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  useEffect(() => {
    setIsOverdue(!!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE");
  }, [task.dueDate, task.status]);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then((d) => { setComments(d); setLoadingComments(false); });
  }, [task.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);
    if (!res.ok) { toast("Gagal mengirim komentar.", "error"); return; }
    const comment: KanbanComment = await res.json();
    setComments((prev) => [...prev, comment]);
    setContent("");
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) { toast("Gagal menghapus komentar.", "error"); return; }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                <Flag className="w-2.5 h-2.5" />{task.priority}
              </span>
              {isOverdue && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Terlambat</span>
              )}
            </div>
            <h2 className={`text-base font-bold ${task.status === "DONE" ? "line-through text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
              {task.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} title="Tutup"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
          {task.assignee && (
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                {(task.assignee.name ?? task.assignee.email ?? "?")[0].toUpperCase()}
              </div>
              {task.assignee.name ?? task.assignee.email}
            </span>
          )}
          {task.dueDate && (
            <span suppressHydrationWarning
              className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Comments */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Komentar {comments.length > 0 && `(${comments.length})`}
            </h3>
          </div>

          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">Belum ada komentar. Mulai diskusi!</p>
          ) : (
            <AnimatePresence>
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isOwn={c.author.id === currentUserId}
                  onDelete={handleDelete}
                  onUpdated={(updated) => setComments((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Comment input */}
        <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-neutral-100 dark:border-neutral-800">
          <input value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis komentar..." title="Komentar"
            className="flex-1 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
          <button type="submit" disabled={sending || !content.trim()} title="Kirim komentar"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
