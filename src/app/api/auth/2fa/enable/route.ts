// Verifikasi OTP lalu aktifkan 2FA
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
