import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/emails/stats — unread counts by entity, priority breakdown
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all entities
  const entities = await prisma.entity.findMany();

  // Unread counts by entity
  const unreadByEntity: Record<string, number> = {};
  for (const entity of entities) {
    const count = await prisma.email.count({
      where: {
        entityId: entity.id,
        isRead: false,
        isArchived: false,
        priority: { not: "none" },
      },
    });
    unreadByEntity[entity.slug] = count;
  }

  // Unread with no entity
  const unreadUnassigned = await prisma.email.count({
    where: {
      entityId: null,
      isRead: false,
      isArchived: false,
      priority: { not: "none" },
    },
  });
  unreadByEntity["unassigned"] = unreadUnassigned;

  // Action required count
  const actionRequired = await prisma.email.count({
    where: {
      needsResponse: true,
      isArchived: false,
    },
  });

  // Noise count
  const noiseCount = await prisma.email.count({
    where: { priority: "none", isArchived: false },
  });

  // Priority breakdown
  const priorities = ["critical", "high", "medium", "low", "none"];
  const priorityBreakdown: Record<string, number> = {};
  for (const p of priorities) {
    priorityBreakdown[p] = await prisma.email.count({
      where: { priority: p, isArchived: false },
    });
  }

  // Total unread
  const totalUnread = await prisma.email.count({
    where: {
      isRead: false,
      isArchived: false,
      priority: { not: "none" },
    },
  });

  // Bills from email
  const billCount = await prisma.email.count({
    where: { isBill: true, isArchived: false },
  });

  return NextResponse.json({
    unreadByEntity,
    actionRequired,
    noiseCount,
    priorityBreakdown,
    totalUnread,
    billCount,
  });
}
