// Generate TOTP secret + QR code untuk di-scan user
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.twoFactorEnabled) return NextResponse.json({ error: "2FA sudah aktif." }, { status: 400 });

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MRA Project (${user.email})`,
    issuer: "MRA Project Management",
    length: 20,
  });

  // Simpan secret sementara ke DB (belum enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
  });

  // Generate QR code as data URL
  const otpauthUrl = secret.otpauth_url!;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });

  return NextResponse.json({
    secret: secret.base32,
    qrDataUrl,
    otpauthUrl,
  });
}
