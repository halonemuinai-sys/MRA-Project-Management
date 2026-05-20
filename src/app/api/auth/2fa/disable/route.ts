// Nonaktifkan 2FA — wajib verifikasi password atau OTP
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.twoFactorEnabled) return NextResponse.json({ error: "2FA tidak aktif." }, { status: 400 });

  const { password, otp } = await req.json();

  // Verifikasi via password
  if (password) {
    if (!user.password) return NextResponse.json({ error: "Tidak bisa verifikasi." }, { status: 400 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Password salah." }, { status: 400 });
  } else if (otp) {
    // Verifikasi via OTP
    if (!user.twoFactorSecret) return NextResponse.json({ error: "Tidak ada secret." }, { status: 400 });
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: String(otp),
      window: 1,
    });
    if (!valid) return NextResponse.json({ error: "Kode OTP tidak valid." }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Diperlukan password atau kode OTP." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ success: true });
}
