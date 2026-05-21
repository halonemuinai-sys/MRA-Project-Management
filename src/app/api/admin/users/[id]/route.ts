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
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Clean up all related records in the correct order before deleting the user
  await prisma.$transaction(async (tx) => {
    // Unassign tasks instead of deleting them
    await tx.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } });
    // Remove memberships in other people's projects
    await tx.projectMember.deleteMany({ where: { userId: id } });
    // Delete user's own content
    await tx.comment.deleteMany({ where: { authorId: id } });
    await tx.activityLog.deleteMany({ where: { userId: id } });
    await tx.timeEntry.deleteMany({ where: { userId: id } });
    await tx.attachment.deleteMany({ where: { uploadedById: id } });
    await tx.projectTemplate.deleteMany({ where: { createdById: id } });
    // Delete owned projects (cascades to tasks, labels, subtasks, etc.)
    await tx.project.deleteMany({ where: { ownerId: id } });
    // Clean up auth tokens
    if (user.email) {
      await tx.emailVerificationToken.deleteMany({ where: { email: user.email } });
      await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
    }
    // Finally delete the user (Account + Session + Notification cascade automatically)
    await tx.user.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
