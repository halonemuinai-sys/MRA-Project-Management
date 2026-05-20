import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

async function getAuthorizedLabel(labelId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    include: { project: { include: { members: true } } },
  });
  if (!label) return null;
  const member = label.project.members.find((m) => m.userId === user.id);
  if (!member || member.role === "VIEWER") return null;
  return { user, label };
}

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedLabel(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.label.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedLabel(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  await prisma.label.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
