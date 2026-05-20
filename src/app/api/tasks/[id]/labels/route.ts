import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

async function getAuthorizedTask(taskId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return null;
  const member = task.project.members.find((m) => m.userId === user.id);
  if (!member || member.role === "VIEWER") return null;
  return { user, task };
}

const schema = z.object({ labelId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedTask(id, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.taskLabel.upsert({
    where: { taskId_labelId: { taskId: id, labelId: parsed.data.labelId } },
    create: { taskId: id, labelId: parsed.data.labelId },
    update: {},
  });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedTask(id, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.taskLabel.deleteMany({
    where: { taskId: id, labelId: parsed.data.labelId },
  });
  return NextResponse.json({ success: true });
}
