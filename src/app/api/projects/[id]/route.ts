import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  deadline: z.string().datetime().nullable().optional(),
});

async function getAuthorizedProject(projectId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: { orderBy: { createdAt: "desc" } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  return { project, user };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAuthorizedProject(id, session.user.email);
  if (!result?.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(result.project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAuthorizedProject(id, session.user.email);
  if (!result?.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (result.project.ownerId !== result.user!.id) {
    return NextResponse.json({ error: "Only the owner can update this project" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...parsed.data,
      deadline: parsed.data.deadline === null ? null
        : parsed.data.deadline ? new Date(parsed.data.deadline)
        : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAuthorizedProject(id, session.user.email);
  if (!result?.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (result.project.ownerId !== result.user!.id) {
    return NextResponse.json({ error: "Only the owner can delete this project" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
