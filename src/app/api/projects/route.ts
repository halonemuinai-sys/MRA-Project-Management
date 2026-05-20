import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "deadline" | "tasks";
type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

function buildOrderBy(sort: string): Prisma.ProjectOrderByWithRelationInput[] {
  const pinFirst: Prisma.ProjectOrderByWithRelationInput = { pinned: "desc" };
  switch (sort as SortKey) {
    case "newest":    return [pinFirst, { createdAt: "desc" }];
    case "oldest":    return [pinFirst, { createdAt: "asc" }];
    case "name_asc":  return [pinFirst, { name: "asc" }];
    case "name_desc": return [pinFirst, { name: "desc" }];
    case "deadline":  return [pinFirst, { deadline: { sort: "asc", nulls: "last" } }];
    case "tasks":     return [pinFirst, { tasks: { _count: "desc" } }];
    default:          return [pinFirst, { createdAt: "desc" }];
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "9", 10)));
  const status = searchParams.get("status") ?? "ALL";
  const sort   = searchParams.get("sort")   ?? "newest";

  const baseWhere: Prisma.ProjectWhereInput = {
    OR: [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };

  // Lightweight stats — always across ALL user projects, unfiltered
  const allForStats = await prisma.project.findMany({
    where: baseWhere,
    select: { status: true, _count: { select: { members: true } } },
  });
  const stats = {
    total:     allForStats.length,
    active:    allForStats.filter((p) => p.status === "ACTIVE").length,
    onHold:    allForStats.filter((p) => p.status === "ON_HOLD").length,
    completed: allForStats.filter((p) => p.status === "COMPLETED").length,
    archived:  allForStats.filter((p) => p.status === "ARCHIVED").length,
    members:   allForStats.reduce((s, p) => s + p._count.members, 0),
  };

  const where: Prisma.ProjectWhereInput = {
    ...baseWhere,
    ...(status !== "ALL" ? { status: status as ProjectStatus } : {}),
  };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, members: true } },
        tasks: { where: { status: "DONE" }, select: { id: true } },
      },
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: projects.map(({ tasks, ...p }) => ({ ...p, doneTasksCount: tasks.length })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
