import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

async function getEmail(req: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return (token?.email as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = await getEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, image: true, twoFactorEnabled: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/users/me]", msg);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const email = await getEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if ("newPassword" in body) {
      const parsed = passwordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) {
        return NextResponse.json({ error: "No password set for this account." }, { status: 400 });
      }

      const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
      await prisma.user.update({ where: { email }, data: { password: hashed } });

      return NextResponse.json({ success: true });
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/users/me]", msg);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
