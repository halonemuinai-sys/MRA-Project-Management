import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import path from "path";
import fs from "fs/promises";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file format. Use JPG, PNG, WEBP, or GIF." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be under 2MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${user.id}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    await fs.mkdir(uploadDir, { recursive: true });

    if (user.image?.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), "public", user.image);
      await fs.unlink(oldPath).catch(() => null);
    }

    const bytes = await file.arrayBuffer();
    await fs.writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    const imageUrl = `/uploads/avatars/${filename}`;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/users/me/avatar]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.image?.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), "public", user.image);
      await fs.unlink(oldPath).catch(() => null);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[DELETE /api/users/me/avatar]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
