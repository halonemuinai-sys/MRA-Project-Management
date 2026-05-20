import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const projectWhere = {
    OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
  };

  // ── Parallel queries ──────────────────────────────────────────────────────────
  const [allTasks, completionEvents, timeEntries, projectsRaw, uniqueMembers] = await Promise.all([
    prisma.task.findMany({
      where: { project: projectWhere },
      select: {
        id: true, status: true, priority: true, dueDate: true, createdAt: true,
        assigneeId: true,
        project: { select: { id: true, name: true, status: true } },
      },
    }),

    // When each task was marked DONE — keep latest event per task
    prisma.activityLog.findMany({
      where: { action: "STATUS", newValue: "DONE", task: { project: projectWhere } },
      select: { taskId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

    prisma.timeEntry.findMany({
      where: { task: { project: projectWhere }, endedAt: { not: null }, minutes: { not: null } },
      select: { minutes: true, userId: true },
    }),

    prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true, name: true, status: true,
        tasks: { select: { id: true, status: true, dueDate: true, createdAt: true } },
      },
    }),

    // Unique members across all projects
    prisma.projectMember.findMany({
      where: { project: projectWhere },
      select: { userId: true, user: { select: { id: true, name: true, email: true } } },
      distinct: ["userId"],
    }),
  ]);

  // ── Helper: latest completion event per task ──────────────────────────────────
  const completionMap = new Map<string, Date>();
  for (const e of completionEvents) {
    if (!completionMap.has(e.taskId)) {
      completionMap.set(e.taskId, new Date(e.createdAt));
    }
  }

  const now = new Date();
  const totalTasks = allTasks.length;
  const doneTasks  = allTasks.filter((t) => t.status === "DONE");
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  );

  // ── Completion Rate ───────────────────────────────────────────────────────────
  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  // ── On-Time Delivery Rate ─────────────────────────────────────────────────────
  const doneWithDeadline = doneTasks.filter((t) => t.dueDate);
  let onTimeCount = 0;
  for (const t of doneWithDeadline) {
    const completedAt = completionMap.get(t.id);
    if (completedAt && t.dueDate && completedAt <= new Date(t.dueDate)) onTimeCount++;
  }
  const onTimeRate = doneWithDeadline.length > 0
    ? Math.round((onTimeCount / doneWithDeadline.length) * 100)
    : 100;

  // ── Overdue Rate ──────────────────────────────────────────────────────────────
  const tasksWithDeadline = allTasks.filter((t) => t.dueDate);
  const overdueRate = tasksWithDeadline.length > 0
    ? Math.round((overdueTasks.length / tasksWithDeadline.length) * 100)
    : 0;

  // ── Avg Completion Time (days from createdAt → marked DONE) ──────────────────
  const completionDays: number[] = [];
  for (const t of doneTasks) {
    const completedAt = completionMap.get(t.id);
    if (completedAt) {
      const days = (completedAt.getTime() - new Date(t.createdAt).getTime()) / 86_400_000;
      if (days >= 0) completionDays.push(days);
    }
  }
  const avgCompletionDays = completionDays.length > 0
    ? Math.round((completionDays.reduce((a, b) => a + b, 0) / completionDays.length) * 10) / 10
    : 0;

  // ── Velocity last 30 days ────────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const velocityLast30 = [...completionMap.values()].filter((d) => d >= thirtyDaysAgo).length;

  // ── Time Tracked ─────────────────────────────────────────────────────────────
  const totalMinutes = timeEntries.reduce((s, e) => s + (e.minutes ?? 0), 0);
  const totalTimeTrackedHours = Math.round((totalMinutes / 60) * 10) / 10;

  // ── Weekly Velocity (last 8 weeks) ───────────────────────────────────────────
  const velocity = Array.from({ length: 8 }, (_, i) => {
    const endDate   = new Date(now); endDate.setDate(endDate.getDate() - i * 7);
    const startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 7);
    const label = startDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return {
      label,
      completed: [...completionMap.values()].filter((d) => d >= startDate && d < endDate).length,
      created:   allTasks.filter((t) => {
        const c = new Date(t.createdAt);
        return c >= startDate && c < endDate;
      }).length,
    };
  }).reverse();

  // ── Project Health ────────────────────────────────────────────────────────────
  const projectHealth = projectsRaw.map((p) => {
    const total     = p.tasks.length;
    const done      = p.tasks.filter((t) => t.status === "DONE").length;
    const overdueP  = p.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length;
    const compRate  = total > 0 ? Math.round((done / total) * 100) : 0;

    // On-time rate for this project
    const doneWD = p.tasks.filter((t) => t.status === "DONE" && t.dueDate);
    let onTime = 0;
    for (const t of doneWD) {
      const completedAt = completionMap.get(t.id);
      if (completedAt && t.dueDate && completedAt <= new Date(t.dueDate)) onTime++;
    }
    const otRate = doneWD.length > 0 ? Math.round((onTime / doneWD.length) * 100) : 100;

    // Health score: 50% completion, 30% on-time, 20% overdue penalty
    const overdueRateP = total > 0 ? overdueP / total : 0;
    const healthScore  = Math.max(0, Math.min(100, Math.round(
      compRate * 0.5 + otRate * 0.3 - overdueRateP * 100 * 0.2
    )));

    return {
      id: p.id, name: p.name, status: p.status,
      total, done, overdue: overdueP,
      completionRate: compRate, onTimeRate: otRate, healthScore,
    };
  }).sort((a, b) => b.healthScore - a.healthScore);

  // ── Team Productivity ─────────────────────────────────────────────────────────
  const teamProductivity = uniqueMembers.map(({ user: u }) => {
    const assigned  = allTasks.filter((t) => t.assigneeId === u.id).length;
    const completed = allTasks.filter((t) => t.assigneeId === u.id && t.status === "DONE").length;
    return { userId: u.id, name: u.name ?? u.email ?? "?", assigned, completed };
  }).filter((m) => m.assigned > 0).sort((a, b) => b.completed - a.completed);

  // ── Priority Breakdown ────────────────────────────────────────────────────────
  const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
  const priorityBreakdown = priorities.map((p) => ({
    priority: p,
    total: allTasks.filter((t) => t.priority === p).length,
    done:  allTasks.filter((t) => t.priority === p && t.status === "DONE").length,
  }));

  return NextResponse.json({
    summary: {
      completionRate, onTimeRate, overdueRate, avgCompletionDays,
      velocityLast30, totalTimeTrackedHours,
      totalTasks, doneTasks: doneTasks.length, overdueTasks: overdueTasks.length,
      totalProjects: projectsRaw.length, totalMembers: uniqueMembers.length,
    },
    velocity,
    projectHealth,
    teamProductivity,
    priorityBreakdown,
  });
}
