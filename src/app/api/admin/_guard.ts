// Shared admin guard — always re-reads role from DB (not JWT cache)
import { NextRequest } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (fresh?.role !== "ADMIN") return null;
  return user;
}
