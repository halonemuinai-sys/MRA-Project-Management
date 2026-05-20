"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, FolderKanban, ScrollText, ShieldCheck, Loader2, ChevronLeft } from "lucide-react";

const adminNav = [
  { label: "Overview",  href: "/dashboard/admin",          icon: LayoutDashboard },
  { label: "Users",     href: "/dashboard/admin/users",    icon: Users },
  { label: "Projects",  href: "/dashboard/admin/projects", icon: FolderKanban },
  { label: "Audit Log", href: "/dashboard/admin/logs",     icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [session, status, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin header strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-none">Admin Panel</h1>
            <p className="text-xs text-neutral-400 mt-0.5">System management · {session?.user?.email}</p>
          </div>
        </div>
        <Link href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Sub navigation */}
      <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 overflow-x-auto">
        {adminNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex-shrink-0">
              <motion.div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
