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
  ] = await Promise.all([
    prisma.project.count({
      where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    }),
    prisma.project.count({
      where: { status: "ACTIVE", OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    }),
    prisma.project.count({
      where: { status: "COMPLETED", OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    }),
    prisma.task.count({
      where: { project: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    }),
    prisma.task.count({
      where: { status: "DONE", project: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    }),
    prisma.task.count({
      where: { status: "IN_PROGRESS", project: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    }),
    prisma.task.count({
      where: {
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
        project: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      },
    }),
    prisma.project.findMany({
      where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        _count: { select: { tasks: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: {
        status: { not: "DONE" },
        project: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      },
      _count: { priority: true },
    }),
  ]);

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return NextResponse.json({
    projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
    tasks: { total: totalTasks, done: doneTasks, inProgress: inProgressTasks, overdue: overdueTasks, completionRate },
    recentProjects,
    tasksByPriority,
  });
}
