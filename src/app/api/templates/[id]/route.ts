import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const template = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!template || template.createdById !== user.id) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  await prisma.projectTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
