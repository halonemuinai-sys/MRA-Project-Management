"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Loader2, LayoutTemplate, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { ProjectListItem, ProjectStatus } from "./types";
import { useToast } from "@/frontend/lib/toast";
import { DatePickerField } from "@/frontend/components/ui/DatePickerField";

// ─── Template types ───────────────────────────────────────────────────────────

interface ProjectTemplate {
  id: string; name: string; description: string | null;
  tasks: { title: string; priority: string }[];
  labels: { name: string; color: string }[];
  usageCount: number;
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onSelect, onSkip }: {
  onSelect: (t: ProjectTemplate) => void;
  onSkip: () => void;
}) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <LayoutTemplate className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Choose a Template</p>
      </div>
      <p className="text-xs text-neutral-500">Start from a template to save time, or build from scratch.</p>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-6 text-sm text-neutral-400">
          No saved templates yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {templates.map((t) => (
            <button key={t.id} type="button" onClick={() => onSelect(t)}
              className="w-full flex items-start gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-500/30 rounded-xl text-left transition-all group">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <LayoutTemplate className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{t.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {(t.tasks as unknown[]).length} tasks · {(t.labels as unknown[]).length} labels
                  {t.usageCount > 0 && ` · used ${t.usageCount}×`}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={onSkip}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all">
        <Plus className="w-4 h-4" /> Start from Scratch
      </button>
    </div>
  );
}

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
          <button type="button" onClick={onClose} title="Close"
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
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Project Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          placeholder="e.g. Website Revamp Q3" title="Project name" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Describe the goal and scope of this project..." title="Project description"
          className={`${inputClass} resize-none`} />
      </div>
      <div className={`grid gap-3 ${showStatus ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Deadline</label>
          <DatePickerField value={deadline} onChange={setDeadline} placeholder="Pick a deadline..." />
        </div>
        {showStatus && setStatus && status && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              title="Project status" className={inputClass}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
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
        Cancel
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
  const [step, setStep] = useState<"template" | "form">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTemplateSelect = (t: ProjectTemplate) => {
    setSelectedTemplate(t);
    setName(""); // user fills project name, not template name
    setDescription(t.description ?? "");
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    let res: Response;
    if (selectedTemplate) {
      // Create from template
      res = await fetch(`/api/templates/${selectedTemplate.id}/use`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, deadline: deadline ? new Date(deadline).toISOString() : undefined }),
      });
    } else {
      res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, deadline: deadline ? new Date(deadline).toISOString() : undefined }),
      });
    }

    setLoading(false);
    if (!res.ok) { setError("Failed to create project."); toast("Failed to create project.", "error"); return; }
    toast(
      selectedTemplate
        ? `Project "${name}" created from template "${selectedTemplate.name}".`
        : `Project "${name}" created successfully.`,
      "success"
    );
    onCreated(); onClose();
  };

  return (
    <ModalShell title="New Project" onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === "template" ? (
          <motion.div key="template" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <TemplatePicker onSelect={handleTemplateSelect} onSkip={() => setStep("form")} />
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {selectedTemplate && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <LayoutTemplate className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex-1 truncate">
                  Template: {selectedTemplate.name} · {(selectedTemplate.tasks as unknown[]).length} tasks
                </span>
                <button type="button" onClick={() => { setSelectedTemplate(null); setStep("template"); }}
                  className="text-blue-400 hover:text-blue-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <ProjectFields name={name} setName={setName} description={description} setDescription={setDescription}
                deadline={deadline} setDeadline={setDeadline} />
              <FormActions onCancel={onClose} loading={loading} label={selectedTemplate ? "Create from Template" : "Create Project"} />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
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
    if (!res.ok) { setError("Failed to save changes."); toast("Failed to update project.", "error"); return; }
    toast(`Project "${name}" updated successfully.`, "success");
    onUpdated(await res.json()); onClose();
  };

  return (
    <ModalShell title="Edit Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <ProjectFields name={name} setName={setName} description={description} setDescription={setDescription}
          deadline={deadline} setDeadline={setDeadline} status={status} setStatus={setStatus} showStatus />
        <FormActions onCancel={onClose} loading={loading} label="Save" />
      </form>
    </ModalShell>
  );
}
