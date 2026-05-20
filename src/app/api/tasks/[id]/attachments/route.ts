import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "text/plain",
];

async function getAuthorizedTask(taskId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return null;
  const member = task.project.members.find((m) => m.userId === user.id);
  return member ? { user, task } : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const auth = await getAuthorizedTask(taskId, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const auth = await getAuthorizedTask(taskId, session.user.email);
  if (!auth) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  if (auth.task.project.members.find((m: { userId: string; role: string }) => m.userId === auth.user.id)?.role === "VIEWER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File terlalu besar. Maks 10 MB." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Tipe file tidak diizinkan." }, { status: 400 });

  const ext = path.extname(file.name) || "";
  const filename = `${randomBytes(16).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", taskId);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${taskId}/${filename}`;
  const attachment = await prisma.attachment.create({
    data: {
      filename,
      originalName: file.name,
      url,
      size: file.size,
      mimetype: file.type,
      taskId,
      uploadedById: auth.user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(attachment, { status: 201 });
}
