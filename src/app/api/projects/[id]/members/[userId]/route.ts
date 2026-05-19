import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, userId } = await params;

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.ownerId !== currentUser.id) {
    return NextResponse.json({ error: "Hanya owner yang bisa menghapus anggota" }, { status: 403 });
  }

  if (userId === project.ownerId) {
    return NextResponse.json({ error: "Owner tidak bisa dihapus dari proyek" }, { status: 400 });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  return NextResponse.json({ success: true });
}
