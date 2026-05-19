"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { TaskStatus, COLUMNS } from "./types";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: TaskStatus) => Promise<void>;
  onBulkDelete: () => Promise<void>;
}

export function BulkActionBar({ selectedCount, onClearSelection, onBulkStatusChange, onBulkDelete }: BulkActionBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: TaskStatus) => {
    setShowStatusMenu(false);
    setLoading(true);
    await onBulkStatusChange(status);
    setLoading(false);
    onClearSelection();
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setLoading(true);
    await onBulkDelete();
    setLoading(false);
    onClearSelection();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg"
    >
      <span className="text-sm font-semibold flex-shrink-0">
        {selectedCount} tugas dipilih
      </span>

      <div className="flex items-center gap-2 flex-1">
        {/* Status change */}
        <div className="relative">
          <button type="button"
            onClick={() => { setShowStatusMenu((v) => !v); setConfirmDelete(false); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-60">
            Ubah Status
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatusMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute left-0 bottom-10 z-30 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden"
                onMouseLeave={() => setShowStatusMenu(false)}
              >
                {COLUMNS.map((col) => (
                  <button key={col.key} type="button"
                    onClick={() => handleStatusChange(col.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                    {col.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs">Hapus semua?</span>
            <button type="button" onClick={handleDelete} disabled={loading}
              className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-60">
              Ya, Hapus
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">
              Batal
            </button>
          </div>
        ) : (
          <button type="button"
            onClick={() => { setShowStatusMenu(false); setConfirmDelete(true); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60">
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        )}

        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      {/* Clear */}
      <button type="button" onClick={onClearSelection} title="Batal pilih"
        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
