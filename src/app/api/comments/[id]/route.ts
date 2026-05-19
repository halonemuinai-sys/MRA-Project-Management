import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

const editSchema = z.object({ content: z.string().min(1).max(2000) });

async function getOwnComment(id: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.authorId !== user.id) return null;
  return comment;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comment = await getOwnComment(id, session.user.email);
  if (!comment) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const parsed = editSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: parsed.data.content },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comment = await getOwnComment(id, session.user.email);
  if (!comment) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
