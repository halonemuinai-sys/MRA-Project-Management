import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      projectMembers: {
        include: {
          project: { select: { id: true, name: true, status: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      assignedTasks: {
        where: { status: { not: "DONE" } },
        select: {
          id: true, title: true, status: true, priority: true, dueDate: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { ownedProjects: true, assignedTasks: true, projectMembers: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}
