import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { sendEmail, emailVerifyAccount } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Email tidak terdaftar." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Email sudah diverifikasi." }, { status: 400 });

  // Hapus token lama
  await prisma.emailVerificationToken.deleteMany({ where: { email } });

  // Buat token baru
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  await prisma.emailVerificationToken.create({ data: { email, token, expires } });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
  const { subject, html } = emailVerifyAccount({
    to: email,
    name: user.name ?? email,
    verifyUrl,
  });

  await sendEmail(email, subject, html);

  return NextResponse.json({ success: true });
}
