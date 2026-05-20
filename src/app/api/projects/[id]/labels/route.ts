import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

async function getProjectMember(projectId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return member ? { user, member } : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getProjectMember(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const labels = await prisma.label.findMany({
    where: { projectId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(labels);
}

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getProjectMember(id, email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  if (auth.member.role === "VIEWER") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const label = await prisma.label.create({
    data: { ...parsed.data, projectId: id },
  });
  return NextResponse.json(label, { status: 201 });
}
