// Activity logging — track who did what when
// Every action logs the user, type, and related entity

import { prisma } from "./prisma";
import type { ActivityAction } from "./types";

export async function logActivity(params: {
  userId: string;
  actionType: ActivityAction;
  description: string;
  entityId?: string;
  relatedId?: string;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      actionType: params.actionType,
      description: params.description,
      entityId: params.entityId || null,
      relatedId: params.relatedId || null,
    },
  });
}
