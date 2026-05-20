import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

async function getAuthorizedMember(taskId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return null;
  const member = task.project.members.find((m) => m.userId === user.id);
  return member ? { user, task, member } : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedMember(id, session.user.email);
  if (!auth) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const deps = await prisma.taskDependency.findMany({
    where: { taskId: id },
    include: {
      dependsOn: {
        select: { id: true, title: true, status: true, priority: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(deps);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedMember(id, session.user.email);
  if (!auth || auth.member.role === "VIEWER") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { dependsOnId } = await req.json();
  if (!dependsOnId || dependsOnId === id) {
    return NextResponse.json({ error: "dependsOnId tidak valid" }, { status: 400 });
  }

  // Verify target task exists and is in the same project
  const target = await prisma.task.findUnique({ where: { id: dependsOnId } });
  if (!target || target.projectId !== auth.task.projectId) {
    return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
  }

  // Prevent circular dependency
  const reverse = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId: dependsOnId, dependsOnId: id } },
  });
  if (reverse) return NextResponse.json({ error: "Dependensi sirkular tidak diperbolehkan" }, { status: 400 });

  const dep = await prisma.taskDependency.create({
    data: { taskId: id, dependsOnId },
    include: { dependsOn: { select: { id: true, title: true, status: true, priority: true } } },
  });

  return NextResponse.json(dep, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedMember(id, session.user.email);
  if (!auth || auth.member.role === "VIEWER") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { dependsOnId } = await req.json();
  await prisma.taskDependency.delete({
    where: { taskId_dependsOnId: { taskId: id, dependsOnId } },
  });

  return NextResponse.json({ success: true });
}
