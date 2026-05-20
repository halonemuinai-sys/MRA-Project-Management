import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { sendEmail, emailVerifyAccount } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    // Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({ data: { email, token, expires } });

    // Send verification email (fire-and-forget)
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
    const { subject, html } = emailVerifyAccount({
      to: email,
      name: name ?? email,
      verifyUrl,
    });
    sendEmail(email, subject, html).catch((e) => console.error("[email] verify:", e));

    return NextResponse.json(
      { message: "Account created successfully. Check your email for verification.", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
