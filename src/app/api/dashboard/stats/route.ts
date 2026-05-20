import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const projectWhere = {
    OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
  };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    doneTasks,
    inProgressTasks,
    overdueTasks,
    recentProjects,
    tasksByPriority,
    createdInPeriod,
    completedInPeriod,
    deadlineTasks,
  ] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.project.count({ where: { ...projectWhere, status: "ACTIVE" } }),
    prisma.project.count({ where: { ...projectWhere, status: "COMPLETED" } }),
    prisma.task.count({ where: { project: projectWhere } }),
    prisma.task.count({ where: { status: "DONE", project: projectWhere } }),
    prisma.task.count({ where: { status: "IN_PROGRESS", project: projectWhere } }),
    prisma.task.count({
      where: { status: { not: "DONE" }, dueDate: { lt: new Date() }, project: projectWhere },
    }),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, updatedAt: true, _count: { select: { tasks: true } } },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { status: { not: "DONE" }, project: projectWhere },
      _count: { priority: true },
    }),
    // Tasks created in last 6 months
    prisma.task.findMany({
      where: { project: projectWhere, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    // Tasks completed (marked DONE) in last 6 months via activity log
    prisma.activityLog.findMany({
      where: {
        action: "STATUS",
        newValue: "DONE",
        createdAt: { gte: sixMonthsAgo },
        task: { project: projectWhere },
      },
      select: { createdAt: true },
    }),
    // Tasks with deadlines for calendar
    prisma.task.findMany({
      where: { project: projectWhere, dueDate: { not: null } },
      select: {
        id: true, title: true, status: true, priority: true, dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Build 6-month trend buckets
  const now = new Date();
  const taskTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      created: 0,
      completed: 0,
    };
  });

  for (const t of createdInPeriod) {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = taskTrend.find((b) => b.key === key);
    if (bucket) bucket.created++;
  }

  for (const log of completedInPeriod) {
    const d = new Date(log.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = taskTrend.find((b) => b.key === key);
    if (bucket) bucket.completed++;
  }

  return NextResponse.json({
    projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
    deadlineTasks: (deadlineTasks as { id: string; title: string; status: string; priority: string; dueDate: string | null; project: { id: string; name: string } }[]),
    tasks: { total: totalTasks, done: doneTasks, inProgress: inProgressTasks, overdue: overdueTasks, completionRate },
    recentProjects,
    tasksByPriority,
    taskTrend: taskTrend.map(({ month, created, completed }) => ({ month, created, completed })),
  });
}
