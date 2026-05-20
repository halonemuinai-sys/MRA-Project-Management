"use client";

import { motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  items: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "View Navigation",
    items: [
      { keys: ["K"], description: "Switch to Kanban view" },
      { keys: ["L"], description: "Switch to List view" },
      { keys: ["C"], description: "Switch to Calendar view" },
      { keys: ["G"], description: "Switch to Gantt view" },
    ],
  },
  {
    title: "Tasks",
    items: [
      { keys: ["N"], description: "Create new task" },
      { keys: ["Esc"], description: "Close modal / cancel" },
    ],
  },
  {
    title: "Help",
    items: [
      { keys: ["?"], description: "Show this shortcut list" },
    ],
  },
];

function KeyBadge({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono shadow-sm">
      {k}
    </kbd>
  );
}

interface ShortcutsModalProps {
  onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">{group.title}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-neutral-400">+</span>}
                          <KeyBadge k={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-400 text-center">Shortcuts are inactive while typing in an input or textarea</p>
        </div>
      </motion.div>
    </div>
  );
}
