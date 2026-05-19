"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Bell, Search, Sun, Moon, LogOut, User, Menu, FolderKanban, CheckCircle2, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  projects: { id: string; name: string; status: string; _count: { tasks: number } }[];
  tasks: { id: string; title: string; status: string; priority: string; project: { id: string; name: string } }[];
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

// ─── Search Box ────────────────────────────────────────────────────────────────

function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data: SearchResult = await res.json();
    setResults(data);
    setOpen(true);
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (href: string) => {
    router.push(href);
    setQuery("");
    setOpen(false);
    setResults(null);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = results && (results.projects.length > 0 || results.tasks.length > 0);

  return (
    <div ref={ref} className="relative w-full max-w-md hidden md:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading
            ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            : <Search className="h-4 w-4 text-neutral-400" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          placeholder="Cari proyek atau tugas..."
          title="Pencarian global"
          className="block w-full pl-10 pr-8 py-2 border border-neutral-200 dark:border-neutral-800 rounded-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setOpen(false); setResults(null); }}
            title="Hapus pencarian"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {!hasResults ? (
              <p className="text-sm text-neutral-400 text-center py-6">
                {query.length < 2 ? "Ketik minimal 2 karakter" : "Tidak ada hasil ditemukan"}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.projects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Proyek</p>
                    {results.projects.map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => handleSelect(`/dashboard/projects/${p.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left">
                        <FolderKanban className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p._count.tasks} tugas</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results.tasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 pt-3 pb-1">Tugas</p>
                    {results.tasks.map((t) => (
                      <button key={t.id} type="button"
                        onClick={() => handleSelect(`/dashboard/projects/${t.project.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{t.title}</p>
                          <p className="text-xs text-neutral-400 truncate">{t.project.name}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-neutral-400 flex-shrink-0">{t.priority}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Notification Bell ─────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.read).length;
  const router = useRouter();

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifs(await res.json());
    setLoading(false);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif: NotificationItem) => {
    if (notif.link) router.push(notif.link);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Notifikasi" title="Notifikasi"
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifs(); }}
        className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-900 rounded-full relative transition-all">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-neutral-950 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Notifikasi</h3>
              {unread > 0 && (
                <button type="button" onClick={markAllRead}
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-sm text-neutral-400">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <button key={n.id} type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${!n.read ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
                      <div className={!n.read ? "" : "pl-4"}>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{n.title}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{n.message}</p>
                        <p suppressHydrationWarning className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 transition-colors">
      <div className="flex-1 flex items-center gap-3">
        <button type="button" onClick={onMenuClick} title="Buka menu"
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <SearchBox />
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button type="button" aria-label="Toggle Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-900 rounded-full transition-all">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <NotificationBell />

        <div ref={dropdownRef} className="relative">
          <button type="button" aria-label="Profil Pengguna" title="Profil Pengguna"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden md:block">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "Administrator"}
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {session?.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50"
              >
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {session?.user?.email || "Belum Login"}
                    </p>
                  </div>
                  <a href="/dashboard/settings"
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Pengaturan
                  </a>
                  <button type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
