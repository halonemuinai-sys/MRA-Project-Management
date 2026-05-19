import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
