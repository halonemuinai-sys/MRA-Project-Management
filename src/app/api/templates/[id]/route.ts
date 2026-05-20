import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const template = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!template || template.createdById !== user.id) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  await prisma.projectTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
