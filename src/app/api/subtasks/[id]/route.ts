import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

async function getAuthorizedSubtask(subtaskId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { include: { project: { include: { members: true } } } } },
  });
  if (!subtask) return null;
  const member = subtask.task.project.members.find((m) => m.userId === user.id);
  if (!member || member.role === "VIEWER") return null;
  return { user, subtask };
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedSubtask(id, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.subtask.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedSubtask(id, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
