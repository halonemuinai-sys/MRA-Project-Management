import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectWhere = {
    OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
  };

  const [projectsByStatus, tasksByStatus, tasksByPriority, recentTasks] = await Promise.all([
    prisma.project.groupBy({
      by: ["status"],
      where: projectWhere,
      _count: { status: true },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { project: projectWhere },
      _count: { status: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { project: projectWhere },
      _count: { priority: true },
    }),
    prisma.task.findMany({
      where: { project: projectWhere },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, status: true, priority: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({ projectsByStatus, tasksByStatus, tasksByPriority, recentTasks });
}
