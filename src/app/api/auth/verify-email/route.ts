import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token tidak ditemukan." }, { status: 400 });

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record) return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } });
    return NextResponse.json({ error: "Token sudah kedaluwarsa. Minta ulang verifikasi." }, { status: 400 });
  }

  // Mark email as verified
  await prisma.user.updateMany({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });
  await prisma.emailVerificationToken.delete({ where: { token } });

  // Redirect ke login dengan flag verified
  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
