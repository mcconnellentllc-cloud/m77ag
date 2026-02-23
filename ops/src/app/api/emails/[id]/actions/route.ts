import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// POST /api/emails/:id/actions — perform actions on an email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  const email = await prisma.email.findUnique({
    where: { id: params.id },
    include: { account: true, entity: true },
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const userId = session.user.id;

  switch (action) {
    case "archive": {
      await prisma.email.update({
        where: { id: params.id },
        data: { isArchived: true, isRead: true },
      });
      await logActivity({
        userId,
        actionType: "email_archived",
        description: `Archived email from ${email.senderEmail}: ${email.subject}`,
        entityId: email.entityId || undefined,
        relatedId: email.id,
      });
      return NextResponse.json({ success: true });
    }

    case "unarchive": {
      await prisma.email.update({
        where: { id: params.id },
        data: { isArchived: false },
      });
      return NextResponse.json({ success: true });
    }

    case "read": {
      await prisma.email.update({
        where: { id: params.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    case "unread": {
      await prisma.email.update({
        where: { id: params.id },
        data: { isRead: false },
      });
      return NextResponse.json({ success: true });
    }

    case "star": {
      await prisma.email.update({
        where: { id: params.id },
        data: { isStarred: !email.isStarred },
      });
      return NextResponse.json({ success: true });
    }

    case "snooze": {
      const { until } = body;
      if (!until) {
        return NextResponse.json(
          { error: "Snooze date required" },
          { status: 400 }
        );
      }
      await prisma.email.update({
        where: { id: params.id },
        data: { snoozedUntil: new Date(until), isArchived: true },
      });
      await logActivity({
        userId,
        actionType: "email_snoozed",
        description: `Snoozed email until ${until}: ${email.subject}`,
        entityId: email.entityId || undefined,
        relatedId: email.id,
      });
      return NextResponse.json({ success: true });
    }

    case "assign": {
      const { assignTo } = body;
      await prisma.email.update({
        where: { id: params.id },
        data: { assignedTo: assignTo },
      });
      return NextResponse.json({ success: true });
    }

    case "reclassify": {
      const { entitySlug, priority: newPriority } = body;
      const entity = entitySlug
        ? await prisma.entity.findUnique({ where: { slug: entitySlug } })
        : null;

      const updateData: Record<string, unknown> = {};
      if (entity) updateData.entityId = entity.id;
      if (newPriority) updateData.priority = newPriority;

      await prisma.email.update({
        where: { id: params.id },
        data: updateData,
      });

      // Update sender cache with the new classification
      if (entity) {
        await prisma.senderCache.upsert({
          where: { email: email.senderEmail.toLowerCase() },
          update: {
            entityId: entity.id,
            priority: newPriority || email.priority,
          },
          create: {
            email: email.senderEmail.toLowerCase(),
            entityId: entity.id,
            priority: newPriority || email.priority,
            isBill: email.isBill,
          },
        });
      }

      await logActivity({
        userId,
        actionType: "email_reclassified",
        description: `Reclassified email from ${email.senderEmail} to ${entitySlug || "unchanged"} / ${newPriority || "unchanged"}`,
        entityId: entity?.id || email.entityId || undefined,
        relatedId: email.id,
      });
      return NextResponse.json({ success: true });
    }

    case "block_sender": {
      await prisma.blockedSender.create({
        data: {
          userId,
          emailOrDomain: email.senderEmail.toLowerCase(),
        },
      });
      // Archive existing emails from this sender
      await prisma.email.updateMany({
        where: { senderEmail: email.senderEmail },
        data: { isArchived: true, priority: "none" },
      });
      await logActivity({
        userId,
        actionType: "sender_blocked",
        description: `Blocked sender: ${email.senderEmail}`,
        relatedId: email.id,
      });
      return NextResponse.json({ success: true });
    }

    case "create_bill": {
      const bill = await prisma.bill.create({
        data: {
          userId,
          emailId: email.id,
          entityId: email.entityId || "",
          vendor: email.senderName || email.senderEmail,
          amount: 0, // User will fill in
          status: "pending",
          source: "email",
        },
      });
      await logActivity({
        userId,
        actionType: "bill_created",
        description: `Created bill from email: ${email.subject}`,
        entityId: email.entityId || undefined,
        relatedId: bill.id,
      });
      return NextResponse.json({ success: true, billId: bill.id });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
