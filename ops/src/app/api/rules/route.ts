import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// GET /api/rules — list all email rules
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.emailRule.findMany({
    include: {
      entity: { select: { slug: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

// POST /api/rules — create a new email rule
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { conditionType, conditionValue, entitySlug, priority } = body;

  if (!conditionType || !conditionValue) {
    return NextResponse.json(
      { error: "conditionType and conditionValue are required" },
      { status: 400 }
    );
  }

  // Resolve entity slug to id
  let entityId: string | null = null;
  if (entitySlug) {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
    });
    entityId = entity?.id || null;
  }

  const rule = await prisma.emailRule.create({
    data: {
      userId: session.user.id,
      conditionType,
      conditionValue,
      assignEntityId: entityId,
      assignPriority: priority || null,
    },
    include: {
      entity: { select: { slug: true, name: true, color: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    actionType: "rule_created",
    description: `Created rule: ${conditionType} "${conditionValue}" -> ${entitySlug || "no entity"}`,
    relatedId: rule.id,
  });

  return NextResponse.json({ rule }, { status: 201 });
}
