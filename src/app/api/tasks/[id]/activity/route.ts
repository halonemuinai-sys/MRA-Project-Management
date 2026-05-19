import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { include: { members: true } } },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const member = task.project.members.find((m) => m.userId === user.id);
  if (!member) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const logs = await prisma.activityLog.findMany({
    where: { taskId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
