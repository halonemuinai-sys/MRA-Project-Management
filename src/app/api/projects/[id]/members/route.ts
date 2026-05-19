import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
});

async function getOwner(projectId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
  });
  return project ? user : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const owner = await getOwner(projectId, session.user.email);
  if (!owner) {
    return NextResponse.json({ error: "Hanya owner yang bisa menambah anggota" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!target) {
    return NextResponse.json({ error: "User dengan email ini tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: target.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "User sudah menjadi anggota proyek ini" }, { status: 409 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });

  const member = await prisma.projectMember.create({
    data: { projectId, userId: target.id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "PROJECT_MEMBER_ADDED",
      title: "Ditambahkan ke proyek",
      message: `${owner.name ?? owner.email} menambahkan Anda ke proyek "${project?.name}"`,
      link: `/dashboard/projects/${projectId}`,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
