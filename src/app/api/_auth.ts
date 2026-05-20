import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/backend/lib/prisma";

export async function getAuthEmail(req: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return (token?.email as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest) {
  const email = await getAuthEmail(req);
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function getAuthRole(req: NextRequest): Promise<"USER" | "ADMIN" | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return (token?.role as "USER" | "ADMIN" | undefined) ?? null;
  } catch {
    return null;
  }
}
