import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/emails — list emails with filtering
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const entitySlug = searchParams.get("entity");
  const priority = searchParams.get("priority");
  const accountId = searchParams.get("account");
  const needsResponse = searchParams.get("needs_response");
  const isBill = searchParams.get("is_bill");
  const isArchived = searchParams.get("archived");
  const view = searchParams.get("view"); // unified, action_required, noise, bills
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Build where clause
  const where: Record<string, unknown> = {};

  // Filter out snoozed emails (unless they're past their snooze date)
  where.OR = [
    { snoozedUntil: null },
    { snoozedUntil: { lte: new Date() } },
  ];

  if (entitySlug) {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
    });
    if (entity) where.entityId = entity.id;
  }

  if (priority) where.priority = priority;
  if (accountId) where.accountId = accountId;
  if (needsResponse === "true") where.needsResponse = true;
  if (isBill === "true") where.isBill = true;

  // View-specific filters
  if (view === "action_required") {
    where.needsResponse = true;
    where.isArchived = false;
  } else if (view === "noise") {
    where.priority = "none";
  } else if (view === "bills") {
    where.isBill = true;
  } else if (isArchived !== "true") {
    // Default: hide archived
    where.isArchived = false;
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { subject: { contains: search, mode: "insensitive" } },
          { senderEmail: { contains: search, mode: "insensitive" } },
          { senderName: { contains: search, mode: "insensitive" } },
          { aiSummary: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      include: {
        account: {
          select: {
            emailAddress: true,
            displayName: true,
            provider: true,
            color: true,
          },
        },
        entity: {
          select: { slug: true, name: true, color: true, icon: true },
        },
      },
      orderBy: [
        { priority: "asc" }, // critical first
        { receivedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.email.count({ where }),
  ]);

  return NextResponse.json({
    emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
