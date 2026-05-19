import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [], tasks: [] });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ projects: [], tasks: [] });

  const memberWhere = {
    OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
  };

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: {
        AND: [
          memberWhere,
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, status: true, _count: { select: { tasks: true } } },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        AND: [
          { project: memberWhere },
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true, title: true, status: true, priority: true,
        project: { select: { id: true, name: true } },
      },
      take: 8,
    }),
  ]);

  return NextResponse.json({ projects, tasks });
}
