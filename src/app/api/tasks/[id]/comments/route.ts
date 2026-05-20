import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail, getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { sendEmail, emailMentioned } from "@/lib/email";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      assignee: true,
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, taskId, authorId: user.id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  // Notify assignee if different from commenter
  const notifyIds = new Set<string>();
  if (task.assigneeId && task.assigneeId !== user.id) {
    notifyIds.add(task.assigneeId);
  }

  // Parse @mentions — match @name against project member names/emails
  const mentionPattern = /@([\w.\-]+)/g;
  const matches = [...parsed.data.content.matchAll(mentionPattern)].map((m) => m[1].toLowerCase());
  if (matches.length > 0) {
    for (const member of task.project.members) {
      if (member.userId === user.id) continue;
      const nameMatch = member.user.name?.toLowerCase().replace(/\s+/g, "");
      const emailMatch = member.user.email?.toLowerCase().split("@")[0];
      if (matches.some((m) => m === nameMatch || m === emailMatch)) {
        notifyIds.add(member.userId);
      }
    }
  }

  if (notifyIds.size > 0) {
    await prisma.notification.createMany({
      data: [...notifyIds].map((userId) => ({
        userId,
        type: "COMMENT_ADDED" as const,
        title: "Disebut dalam komentar",
        message: `${user.name ?? user.email} menyebut Anda di tugas "${task.title}"`,
        link: `/dashboard/projects/${task.projectId}`,
      })),
      skipDuplicates: true,
    });

    // Email ke setiap yang di-notify (fire-and-forget)
    const notifyUsers = await prisma.user.findMany({
      where: { id: { in: [...notifyIds] } },
      select: { name: true, email: true },
    });
    const taskUrl = `${process.env.NEXTAUTH_URL}/dashboard/projects/${task.projectId}`;
    for (const recipient of notifyUsers) {
      if (!recipient.email) continue;
      const { subject, html } = emailMentioned({
        to: recipient.email,
        mentionedName: recipient.name ?? recipient.email,
        mentionerName: user.name ?? user.email ?? "Seseorang",
        taskTitle: task.title,
        projectName: task.project.name,
        commentPreview: parsed.data.content,
        taskUrl,
      });
      sendEmail(recipient.email, subject, html).catch((e) => console.error("[email] mention:", e));
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
