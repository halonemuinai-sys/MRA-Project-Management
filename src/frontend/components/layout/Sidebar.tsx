"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Settings, FolderKanban, BarChart3, ChevronRight, X, ShieldCheck } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

const menuItems = [
  { name: "Overview",  icon: LayoutDashboard, href: "/dashboard" },
  { name: "Projects",  icon: FolderKanban,    href: "/dashboard/projects" },
  { name: "Team",      icon: Users,           href: "/dashboard/team" },
  { name: "KPI",       icon: BarChart3,       href: "/dashboard/analytics" },
  { name: "Settings",  icon: Settings,        href: "/dashboard/settings" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex flex-col w-64 h-full bg-white dark:bg-[#0d1424] border-r border-neutral-200 dark:border-white/[0.06] transition-colors shadow-sm dark:shadow-[1px_0_20px_rgba(0,0,0,0.3)]">
      <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">Ares Ops</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} title="Close menu"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors md:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <span className={cn(
                "group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 overflow-hidden",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              )}>
                {isActive && (
                  <motion.div layoutId="active-nav-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300"
                )} />
                {item.name}
                {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
              </span>
            </Link>
          );
        })}

        {/* Admin section — only visible to admins */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">System</p>
            </div>
            <Link href="/dashboard/admin" onClick={onClose}>
              {(() => {
                const isActive = pathname.startsWith("/dashboard/admin");
                return (
                  <span className={cn(
                    "group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 overflow-hidden",
                    isActive
                      ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                  )}>
                    {isActive && (
                      <motion.div layoutId="active-nav-indicator-admin"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <ShieldCheck className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                      isActive ? "text-rose-500 dark:text-rose-400" : "text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300"
                    )} />
                    Admin Panel
                    {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                  </span>
                );
              })()}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className="hidden md:flex">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
            <motion.div key="drawer" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex md:hidden">
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
