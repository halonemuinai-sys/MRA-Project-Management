import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_guard";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers, adminUsers, newUsersThisMonth,
    totalProjects, activeProjects,
    totalTasks, doneTasks, overdueTasks,
    totalComments, totalAttachments, totalTimeEntries,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({ where: { status: { not: "DONE" }, dueDate: { lt: new Date() } } }),
    prisma.comment.count(),
    prisma.attachment.count(),
    prisma.timeEntry.count({ where: { endedAt: { not: null } } }),
    // Activity per day last 7 days
    prisma.activityLog.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
  ]);

  // Group activity by day
  const activityByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    activityByDay[key] = 0;
  }
  for (const row of recentActivity) {
    const d = new Date(row.createdAt); d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (key in activityByDay) activityByDay[key] += row._count.id;
  }
  const activityChart = Object.entries(activityByDay).map(([day, count]) => ({ day, count }));

  return NextResponse.json({
    users:    { total: totalUsers, admins: adminUsers, newThisMonth: newUsersThisMonth },
    projects: { total: totalProjects, active: activeProjects },
    tasks:    { total: totalTasks, done: doneTasks, overdue: overdueTasks,
                completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
    activity: { comments: totalComments, attachments: totalAttachments, timeEntries: totalTimeEntries },
    activityChart,
  });
}
