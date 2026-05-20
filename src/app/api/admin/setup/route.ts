// First-time admin setup — only works when zero admins exist in the system
import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail, getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function POST(req: NextRequest) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return NextResponse.json({ error: "Admin sudah ada. Setup hanya bisa dilakukan sekali." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user });
}

export async function GET() {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return NextResponse.json({ hasAdmin: adminCount > 0 });
}
