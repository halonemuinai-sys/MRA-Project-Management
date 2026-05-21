import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_guard";
import { prisma } from "@/backend/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Tidak bisa ubah role diri sendiri." }, { status: 400 });

  const { role } = await req.json();
  if (!["USER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Debug: trace exactly where auth fails
  const { getToken } = await import("next-auth/jwt");
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
  if (!token) return NextResponse.json({ error: "Debug: token is null — not authenticated" }, { status: 403 });

  const dbUser = await prisma.user.findUnique({ where: { email: token.email! }, select: { id: true, role: true } });
  if (!dbUser) return NextResponse.json({ error: `Debug: no user found for email ${token.email}` }, { status: 403 });
  if (dbUser.role !== "ADMIN") return NextResponse.json({ error: `Debug: role is ${dbUser.role}, not ADMIN` }, { status: 403 });

  const admin = dbUser;

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } });
      await tx.projectMember.deleteMany({ where: { userId: id } });
      await tx.comment.deleteMany({ where: { authorId: id } });
      await tx.activityLog.deleteMany({ where: { userId: id } });
      await tx.timeEntry.deleteMany({ where: { userId: id } });
      await tx.attachment.deleteMany({ where: { uploadedById: id } });
      await tx.projectTemplate.deleteMany({ where: { createdById: id } });
      await tx.project.deleteMany({ where: { ownerId: id } });
      if (user.email) {
        await tx.emailVerificationToken.deleteMany({ where: { email: user.email } });
        await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
      }
      await tx.user.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DELETE user]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
