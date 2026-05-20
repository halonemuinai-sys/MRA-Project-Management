// Save an existing project as a new template
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/api/_auth";
import { prisma } from "@/backend/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const { templateName } = await req.json();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks:  { select: { title: true, description: true, priority: true, status: true } },
      labels: { select: { name: true, color: true } },
      members: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const member = project.members.find((m) => m.userId === user.id);
  if (!member) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const template = await prisma.projectTemplate.create({
    data: {
      name:        templateName || `Template: ${project.name}`,
      description: project.description ?? undefined,
      tasks:       project.tasks.map((t) => ({
        title: t.title,
        description: t.description ?? undefined,
        priority: t.priority,
        status: "TODO", // Reset to TODO when used as a template
      })),
      labels:      project.labels.map((l) => ({ name: l.name, color: l.color })),
      createdById: user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
