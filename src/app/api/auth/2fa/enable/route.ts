// Verifikasi OTP lalu aktifkan 2FA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.twoFactorSecret) return NextResponse.json({ error: "Setup 2FA dulu." }, { status: 400 });
  if (user.twoFactorEnabled) return NextResponse.json({ error: "2FA sudah aktif." }, { status: 400 });

  const { otp } = await req.json();
  if (!otp) return NextResponse.json({ error: "Kode OTP diperlukan." }, { status: 400 });

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: String(otp),
    window: 1,
  });

  if (!valid) return NextResponse.json({ error: "Kode OTP tidak valid atau sudah kedaluwarsa." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ success: true });
}
