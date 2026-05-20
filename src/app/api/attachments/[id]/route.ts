import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { task: { include: { project: { include: { members: true } } } } },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = attachment.task.project.members.find((m) => m.userId === user.id);
  const isOwner = attachment.uploadedById === user.id;
  const canDelete = isOwner || member?.role === "OWNER" || member?.role === "ADMIN";
  if (!canDelete) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", attachment.url);
    await unlink(filePath);
  } catch {
    // File might already be gone — continue
  }

  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
