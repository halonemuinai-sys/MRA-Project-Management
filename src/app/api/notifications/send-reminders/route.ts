// Endpoint untuk kirim email reminder deadline
// Panggil manual dari Admin Panel atau via cron
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_guard";
import { prisma } from "@/backend/lib/prisma";
import { sendEmail, emailDeadlineReminder } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { daysAhead = 3 } = await req.json().catch(() => ({}));

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + Number(daysAhead));
  cutoff.setHours(23, 59, 59, 999);

  // Tugas yang belum selesai dan deadline dalam rentang daysAhead hari ke depan
  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { gte: now, lte: cutoff },
      assigneeId: { not: null },
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  if (tasks.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: "Tidak ada tugas yang perlu diingatkan." });
  }

  // Grup per assignee
  const byAssignee = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (!task.assigneeId || !task.assignee?.email) continue;
    const key = task.assigneeId;
    if (!byAssignee.has(key)) byAssignee.set(key, []);
    byAssignee.get(key)!.push(task);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const [, assigneeTasks] of byAssignee) {
    const assignee = assigneeTasks[0].assignee!;
    if (!assignee.email) continue;

    const taskList = assigneeTasks.map((t) => ({
      title: t.title,
      projectName: t.project.name,
      dueDate: t.dueDate!.toISOString(),
      priority: t.priority,
      url: `${process.env.NEXTAUTH_URL}/dashboard/projects/${t.project.id}`,
    }));

    const daysLeft = Math.ceil((assigneeTasks[0].dueDate!.getTime() - now.getTime()) / 86_400_000);

    try {
      const { subject, html } = emailDeadlineReminder({
        to: assignee.email,
        userName: assignee.name ?? assignee.email,
        tasks: taskList,
        daysLeft,
      });
      await sendEmail(assignee.email, subject, html);
      sent++;
    } catch (e) {
      errors.push(`${assignee.email}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    total: byAssignee.size,
    errors: errors.length > 0 ? errors : undefined,
  });
}
