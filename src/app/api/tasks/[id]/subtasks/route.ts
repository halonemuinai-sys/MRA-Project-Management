import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

async function getAuthorizedMember(taskId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return null;
  const member = task.project.members.find((m) => m.userId === user.id);
  return member ? { user, task } : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedMember(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const subtasks = await prisma.subtask.findMany({
    where: { taskId: id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(subtasks);
}

const createSchema = z.object({ title: z.string().min(1).max(200) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedMember(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  if (auth.task.project.members.find((m: { userId: string; role: string }) => m.userId === auth.user.id)?.role === "VIEWER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const count = await prisma.subtask.count({ where: { taskId: id } });
  const subtask = await prisma.subtask.create({
    data: { title: parsed.data.title, taskId: id, order: count },
  });

  return NextResponse.json(subtask, { status: 201 });
}
