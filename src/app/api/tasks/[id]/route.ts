import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { broadcast } from "@/backend/lib/broadcaster";
import { sendEmail, emailTaskAssigned } from "@/lib/email";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { include: { members: true } } },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const member = task.project.members.find((m) => m.userId === user.id);
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prevAssigneeId = task.assigneeId;

  // Collect changes for activity log before applying
  const activityEntries: { action: string; oldValue: string | null; newValue: string | null }[] = [];
  if (parsed.data.status && parsed.data.status !== task.status) {
    activityEntries.push({ action: "STATUS", oldValue: task.status, newValue: parsed.data.status });
  }
  if (parsed.data.priority && parsed.data.priority !== task.priority) {
    activityEntries.push({ action: "PRIORITY", oldValue: task.priority, newValue: parsed.data.priority });
  }
  if (parsed.data.title && parsed.data.title !== task.title) {
    activityEntries.push({ action: "TITLE", oldValue: task.title, newValue: parsed.data.title });
  }
  if ("assigneeId" in parsed.data && parsed.data.assigneeId !== task.assigneeId) {
    activityEntries.push({ action: "ASSIGNEE", oldValue: task.assigneeId ?? null, newValue: parsed.data.assigneeId ?? null });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate === null ? null
        : parsed.data.dueDate ? new Date(parsed.data.dueDate)
        : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { name: true } },
    },
  });

  // Write activity logs
  if (activityEntries.length > 0) {
    await prisma.activityLog.createMany({
      data: activityEntries.map((e) => ({
        taskId: id,
        userId: user.id,
        action: e.action,
        oldValue: e.oldValue,
        newValue: e.newValue,
      })),
    });
  }

  // Notify + email new assignee if changed
  const newAssigneeId = parsed.data.assigneeId;
  if (newAssigneeId && newAssigneeId !== prevAssigneeId && newAssigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: newAssigneeId,
        type: "TASK_ASSIGNED",
        title: "Tugas baru ditugaskan",
        message: `${user.name ?? user.email} menugaskan "${updated.title}" kepada Anda`,
        link: `/dashboard/projects/${task.projectId}`,
      },
    });

    // Send email notification (fire-and-forget)
    const assignee = await prisma.user.findUnique({
      where: { id: newAssigneeId },
      select: { name: true, email: true },
    });
    if (assignee?.email) {
      const { subject, html } = emailTaskAssigned({
        to: assignee.email,
        assigneeName: assignee.name ?? assignee.email,
        assignerName: user.name ?? user.email ?? "Seseorang",
        taskTitle: updated.title,
        projectName: updated.project.name,
        priority: updated.priority,
        dueDate: updated.dueDate?.toISOString() ?? null,
        taskUrl: `${process.env.NEXTAUTH_URL}/dashboard/projects/${task.projectId}`,
      });
      sendEmail(assignee.email, subject, html).catch((e) => console.error("[email] task assign:", e));
    }
  }

  broadcast(task.projectId, "task:updated", updated, user.id);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { include: { members: true } } },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const member = task.project.members.find((m) => m.userId === user.id);
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await prisma.task.delete({ where: { id } });
  broadcast(task.projectId, "task:deleted", { id, projectId: task.projectId }, user.id);
  return NextResponse.json({ success: true });
}
