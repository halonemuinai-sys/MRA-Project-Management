"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, FolderKanban, CheckCircle2, AlertTriangle,
  MessageSquare, Paperclip, Timer, TrendingUp, Loader2, ShieldCheck,
  Mail, Bell,
} from "lucide-react";
import { useToast } from "@/frontend/lib/toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AdminStats {
  users:    { total: number; admins: number; newThisMonth: number };
  projects: { total: number; active: number };
  tasks:    { total: number; done: number; overdue: number; completionRate: number };
  activity: { comments: number; attachments: number; timeEntries: number };
  activityChart: { day: string; count: number }[];
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, delay }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((d) => setHasAdmin(d.hasAdmin));
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    const res = await fetch("/api/test-email", { method: "POST" });
    setTestingEmail(false);
    if (res.ok) toast("Test email sent! Check your inbox.", "success");
    else { const d = await res.json(); toast(d.error ?? "Failed to send email.", "error"); }
  };

  const handleSendReminders = async () => {
    setSendingReminder(true);
    const res = await fetch("/api/notifications/send-reminders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daysAhead: 3 }),
    });
    setSendingReminder(false);
    if (res.ok) {
      const d = await res.json();
      toast(`Reminders sent to ${d.sent} users (tasks due in the next 3 days).`, "success");
    } else toast("Failed to send reminders.", "error");
  };

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    const res = await fetch("/api/admin/setup", { method: "POST" });
    setSetupLoading(false);
    if (res.ok) { setHasAdmin(true); router.refresh(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
      </div>
    );
  }

  // First-time setup banner
  if (hasAdmin === false) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 flex flex-col items-center text-center max-w-md mx-auto mt-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center mb-5">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">First Admin Setup</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          No admin exists in this system yet. Click the button below to make your account (<strong>{session?.user?.email}</strong>) the first administrator.
        </p>
        <button type="button" onClick={handleSetupAdmin} disabled={setupLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-full transition-colors shadow-md shadow-rose-600/20 disabled:opacity-60">
          {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Make Me Admin
        </button>
      </motion.div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Email actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 flex-wrap p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <Mail className="w-4 h-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex-1">Email System</span>
        <button type="button" onClick={handleTestEmail} disabled={testingEmail}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
          {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Send Test Email
        </button>
        <button type="button" onClick={handleSendReminders} disabled={sendingReminder}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
          {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Send Deadline Reminders
        </button>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"     value={stats.users.total}              sub={`+${stats.users.newThisMonth} this month`} icon={Users}         iconBg="bg-blue-50 dark:bg-blue-500/10"    iconColor="text-blue-600 dark:text-blue-400"    delay={0} />
        <StatCard label="Total Projects"  value={stats.projects.total}           sub={`${stats.projects.active} active`}         icon={FolderKanban}  iconBg="bg-violet-50 dark:bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" delay={0.05} />
        <StatCard label="Completion Rate" value={`${stats.tasks.completionRate}%`} sub={`${stats.tasks.done}/${stats.tasks.total} tasks`} icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400" delay={0.1} />
        <StatCard label="Overdue Tasks"   value={stats.tasks.overdue}            sub="Needs attention"                           icon={AlertTriangle} iconBg="bg-red-50 dark:bg-red-500/10"      iconColor="text-red-500 dark:text-red-400"      delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">System Activity — Last 7 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.activityChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#262626" : "#f0f0f0"} />
              <XAxis dataKey="day" stroke={isDark ? "#525252" : "#a3a3a3"} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={isDark ? "#525252" : "#a3a3a3"} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: isDark ? "#171717" : "#fff", border: `1px solid ${isDark ? "#262626" : "#e5e5e5"}`, borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [v, "Activity"]}
              />
              <Area type="monotone" dataKey="count" name="Activity" stroke="#f43f5e" strokeWidth={2.5}
                fill="url(#adminGrad)" dot={{ fill: "#f43f5e", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-5">Content Summary</h3>
          <div className="space-y-4">
            {[
              { label: "Admins",       value: stats.users.admins,        icon: ShieldCheck,   color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-500/10" },
              { label: "Comments",     value: stats.activity.comments,   icon: MessageSquare, color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10" },
              { label: "Attachments",  value: stats.activity.attachments, icon: Paperclip,    color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "Time Entries", value: stats.activity.timeEntries, icon: Timer,         color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-500/10" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 + i * 0.05 }}
                className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
