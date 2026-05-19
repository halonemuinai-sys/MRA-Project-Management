import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } }, assignee: true },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, taskId, authorId: user.id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  // Notify assignee if different from commenter
  if (task.assigneeId && task.assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        type: "COMMENT_ADDED",
        title: "Komentar baru",
        message: `${user.name ?? user.email} mengomentari tugas "${task.title}"`,
        link: `/dashboard/projects/${task.projectId}`,
      },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
