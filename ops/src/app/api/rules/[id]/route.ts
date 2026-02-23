import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// PUT /api/rules/:id — update a rule
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { conditionType, conditionValue, entitySlug, priority, isActive } = body;

  let entityId: string | undefined;
  if (entitySlug !== undefined) {
    if (entitySlug) {
      const entity = await prisma.entity.findUnique({
        where: { slug: entitySlug },
      });
      entityId = entity?.id || undefined;
    } else {
      entityId = undefined;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (conditionType !== undefined) updateData.conditionType = conditionType;
  if (conditionValue !== undefined) updateData.conditionValue = conditionValue;
  if (entityId !== undefined) updateData.assignEntityId = entityId;
  if (priority !== undefined) updateData.assignPriority = priority;
  if (isActive !== undefined) updateData.isActive = isActive;

  const rule = await prisma.emailRule.update({
    where: { id: params.id },
    data: updateData,
  });

  await logActivity({
    userId: session.user.id,
    actionType: "rule_updated",
    description: `Updated rule ${params.id}`,
    relatedId: rule.id,
  });

  return NextResponse.json({ rule });
}

// DELETE /api/rules/:id — delete a rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.emailRule.delete({ where: { id: params.id } });

  await logActivity({
    userId: session.user.id,
    actionType: "rule_deleted",
    description: `Deleted rule ${params.id}`,
    relatedId: params.id,
  });

  return NextResponse.json({ success: true });
}
