"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { ProjectListItem, ProjectStatus } from "./types";
import { useToast } from "@/frontend/lib/toast";

// ─── Shared modal shell ────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} title="Tutup"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Shared form fields ────────────────────────────────────────────────────────

function ProjectFields({
  name, setName, description, setDescription, deadline, setDeadline,
  status, setStatus, showStatus,
}: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  status?: ProjectStatus; setStatus?: (v: ProjectStatus) => void;
  showStatus?: boolean;
}) {
  const inputClass = "w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm";
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nama Proyek *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          placeholder="Contoh: Website Revamp Q3" title="Nama proyek" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Deskripsi</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Jelaskan tujuan dan scope proyek ini..." title="Deskripsi proyek"
          className={`${inputClass} resize-none`} />
      </div>
      <div className={`grid gap-3 ${showStatus ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            title="Deadline proyek" className={inputClass} />
        </div>
        {showStatus && setStatus && status && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              title="Status proyek" className={inputClass}>
              <option value="ACTIVE">Aktif</option>
              <option value="ON_HOLD">Ditahan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
          </div>
        )}
      </div>
    </>
  );
}

function FormActions({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        Batal
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
      </button>
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────

export function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, deadline: deadline ? new Date(deadline).toISOString() : undefined }),
    });
    setLoading(false);
    if (!res.ok) { setError("Gagal membuat proyek."); toast("Gagal membuat proyek.", "error"); return; }
    toast(`Proyek "${name}" berhasil dibuat.`, "success");
    onCreated(); onClose();
  };

  return (
    <ModalShell title="Proyek Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <ProjectFields name={name} setName={setName} description={description} setDescription={setDescription}
          deadline={deadline} setDeadline={setDeadline} />
        <FormActions onCancel={onClose} loading={loading} label="Buat Proyek" />
      </form>
    </ModalShell>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

export function EditProjectModal({ project, onClose, onUpdated }: {
  project: ProjectListItem; onClose: () => void; onUpdated: (p: ProjectListItem) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [deadline, setDeadline] = useState(project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, status, deadline: deadline ? new Date(deadline).toISOString() : null }),
    });
    setLoading(false);
    if (!res.ok) { setError("Gagal menyimpan perubahan."); toast("Gagal memperbarui proyek.", "error"); return; }
    toast(`Proyek "${name}" berhasil diperbarui.`, "success");
    onUpdated(await res.json()); onClose();
  };

  return (
    <ModalShell title="Edit Proyek" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <ProjectFields name={name} setName={setName} description={description} setDescription={setDescription}
          deadline={deadline} setDeadline={setDeadline} status={status} setStatus={setStatus} showStatus />
        <FormActions onCancel={onClose} loading={loading} label="Simpan" />
      </form>
    </ModalShell>
  );
}
