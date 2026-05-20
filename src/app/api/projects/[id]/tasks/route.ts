import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { broadcast } from "@/backend/lib/broadcaster";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | null;
  const page    = parseInt(searchParams.get("page")  ?? "0", 10); // 0 = no pagination
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const sortBy  = searchParams.get("sortBy") ?? "createdAt";
  const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc";

  const where = {
    projectId,
    ...(status ? { status } : {}),
  };

  type OrderInput = { title?: "asc" | "desc"; priority?: "asc" | "desc"; createdAt?: "asc" | "desc"; dueDate?: { sort: "asc" | "desc"; nulls: "last" } };
  const orderBy: OrderInput = (() => {
    switch (sortBy) {
      case "title":    return { title: sortDir };
      case "priority": return { priority: sortDir };
      case "dueDate":  return { dueDate: { sort: sortDir, nulls: "last" as const } };
      default:         return { createdAt: sortDir };
    }
  })();

  const include = {
    assignee: { select: { id: true, name: true, email: true } },
  };

  if (page > 0) {
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
    ]);
    return NextResponse.json({
      data: tasks,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  }

  const tasks = await prisma.task.findMany({ where, include, orderBy });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status ?? "TODO",
      priority: parsed.data.priority ?? "MEDIUM",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      projectId,
      assigneeId: parsed.data.assigneeId ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  broadcast(projectId, "task:created", task, user.id);

  return NextResponse.json(task, { status: 201 });
}
