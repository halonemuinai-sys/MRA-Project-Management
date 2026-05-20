import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

// GET — list time entries for task
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { startedAt: "desc" },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
  return NextResponse.json({ entries, totalMinutes });
}

// POST — start a timer OR log manual time
// Body: { action: "start" } | { action: "stop", entryId } | { action: "log", minutes, note? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const body = await req.json();

  if (body.action === "start") {
    // Stop any running timer for this user+task first
    await prisma.timeEntry.updateMany({
      where: { taskId, userId: user.id, endedAt: null },
      data: { endedAt: new Date(), minutes: 0 },
    });
    const entry = await prisma.timeEntry.create({
      data: { taskId, userId: user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  if (body.action === "stop") {
    const entry = await prisma.timeEntry.findFirst({
      where: { taskId, userId: user.id, endedAt: null },
    });
    if (!entry) return NextResponse.json({ error: "Tidak ada timer aktif" }, { status: 404 });
    const endedAt = new Date();
    const minutes = Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60_000);
    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { endedAt, minutes, note: body.note ?? null },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "log") {
    const minutes = Number(body.minutes);
    if (!minutes || minutes < 1) return NextResponse.json({ error: "Durasi tidak valid" }, { status: 400 });
    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: user.id,
        endedAt: new Date(),
        minutes,
        note: body.note ?? null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
}

// DELETE — remove a time entry
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const { entryId } = await req.json();
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.taskId !== taskId || entry.userId !== user.id) {
    return NextResponse.json({ error: "Entry tidak ditemukan" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ success: true });
}
