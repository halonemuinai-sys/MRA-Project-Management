"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Settings, FolderKanban,
  BarChart3, X, ShieldCheck, LogOut, ChevronRight,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const MENU = [
  { name: "Overview",  icon: LayoutDashboard, href: "/dashboard" },
  { name: "Projects",  icon: FolderKanban,    href: "/dashboard/projects" },
  { name: "Team",      icon: Users,           href: "/dashboard/team" },
  { name: "KPI",       icon: BarChart3,       href: "/dashboard/analytics" },
  { name: "Settings",  icon: Settings,        href: "/dashboard/settings" },
];

// ─── Single nav item ──────────────────────────────────────────────────────────

function NavItem({
  href, icon: Icon, name, isActive, accent = "indigo", delay = 0, onClick,
}: {
  href: string; icon: React.ElementType; name: string;
  isActive: boolean; accent?: "indigo" | "rose"; delay?: number; onClick?: () => void;
}) {
  const activeText  = accent === "rose" ? "text-rose-600 dark:text-rose-400"    : "text-indigo-600 dark:text-indigo-400";
  const activeBg    = accent === "rose" ? "bg-rose-50 dark:bg-rose-500/10"      : "bg-indigo-50 dark:bg-indigo-500/10";
  const activeIcon  = accent === "rose" ? "bg-rose-100 dark:bg-rose-500/20"     : "bg-indigo-100 dark:bg-indigo-500/20";
  const activeBar   = accent === "rose" ? "bg-rose-500"                         : "bg-indigo-600 dark:bg-indigo-500";
  const activeColor = accent === "rose" ? "text-rose-500 dark:text-rose-400"    : "text-indigo-600 dark:text-indigo-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
    >
      <Link href={href} onClick={onClick}>
        <motion.div
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none",
            isActive
              ? cn(activeBg, activeText)
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60"
          )}
        >
          {/* Active left bar — animates between items */}
          {isActive && (
            <motion.div
              layoutId={`nav-bar-${accent}`}
              className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", activeBar)}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}

          {/* Icon box */}
          <motion.div
            whileHover={{ scale: 1.12, rotate: isActive ? 0 : 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
              isActive
                ? activeIcon
                : "group-hover:bg-neutral-200/70 dark:group-hover:bg-neutral-700/60"
            )}
          >
            <Icon className={cn(
              "w-4 h-4 transition-colors",
              isActive ? activeColor : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
            )} />
          </motion.div>

          {/* Label */}
          <span className="flex-1 leading-none">{name}</span>

          {/* Active chevron */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const isAdmin   = session?.user?.role === "ADMIN";
  const userName  = session?.user?.name ?? session?.user?.email ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials  = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col w-64 h-full bg-white dark:bg-[#0d1424] border-r border-neutral-200 dark:border-white/[0.06] transition-colors">

      {/* ── Brand ── */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-white/[0.05]">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <div>
            <p className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">Ares Ops</p>
            <p className="text-[10px] text-neutral-400 leading-tight">Management System</p>
          </div>
        </motion.div>

        {onClose && (
          <button type="button" onClick={onClose} title="Close"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors md:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Main nav ── */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
          Main Menu
        </p>

        {MENU.map((item, i) => {
          const isActive = item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              name={item.name}
              isActive={isActive}
              delay={i * 0.05}
              onClick={onClose}
            />
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="pt-5 pb-2.5">
              <div className="flex items-center gap-2 px-3">
                <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">System</p>
                <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
              </div>
            </div>
            <NavItem
              href="/dashboard/admin"
              icon={ShieldCheck}
              name="Admin Panel"
              isActive={pathname.startsWith("/dashboard/admin")}
              accent="rose"
              delay={0.4}
              onClick={onClose}
            />
          </motion.div>
        )}
      </div>

      {/* ── User profile ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="border-t border-neutral-100 dark:border-white/[0.05] p-3"
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-tight">{userName}</p>
            <p className="text-[10px] text-neutral-400 truncate leading-tight">{userEmail}</p>
          </div>
          <motion.button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="p-1.5 rounded-lg text-neutral-300 dark:text-neutral-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className="hidden md:flex">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            <motion.div key="drawer"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex md:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
