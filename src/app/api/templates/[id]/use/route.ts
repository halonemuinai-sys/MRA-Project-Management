// Buat proyek baru dari template — duplikat semua task dan label
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

interface TemplateTask {
  title: string; description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
}
interface TemplateLabel { name: string; color: string }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: templateId } = await params;

  const template = await prisma.projectTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const tasks  = (template.tasks  as unknown as TemplateTask[])  ?? [];
  const labels = (template.labels as unknown as TemplateLabel[]) ?? [];

  // Buat proyek + owner member dalam satu transaksi
  const project = await prisma.project.create({
    data: {
      name:        parsed.data.name,
      description: parsed.data.description,
      deadline:    parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      ownerId:     user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  // Buat label dari template
  const createdLabels = await Promise.all(labels.map((l) =>
    prisma.label.create({
      data: { name: l.name, color: l.color, projectId: project.id },
    })
  ));
  const labelMap = new Map(createdLabels.map((l, i) => [labels[i].name, l.id]));

  // Buat task dari template
  if (tasks.length > 0) {
    await prisma.task.createMany({
      data: tasks.map((t) => ({
        title:       t.title,
        description: t.description,
        priority:    t.priority,
        status:      t.status,
        projectId:   project.id,
      })),
    });
  }

  // Increment usage count
  await prisma.projectTemplate.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({
    ...project,
    doneTasksCount: 0,
    _labelsCreated: createdLabels.length,
    _tasksCreated: tasks.length,
  }, { status: 201 });
}
