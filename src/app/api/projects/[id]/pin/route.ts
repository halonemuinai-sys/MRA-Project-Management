import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const updated = await prisma.project.update({
    where: { id },
    data: { pinned: !project.pinned },
    select: { id: true, pinned: true },
  });

  return NextResponse.json(updated);
}
