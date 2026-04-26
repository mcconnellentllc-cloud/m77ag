import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// GET /api/bills — list bills with filtering
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const entitySlug = searchParams.get("entity");
  const status = searchParams.get("status");
  const vendor = searchParams.get("vendor");
  const view = searchParams.get("view"); // upcoming, overdue

  const where: Record<string, unknown> = {};

  if (entitySlug) {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
    });
    if (entity) where.entityId = entity.id;
  }

  if (status) where.status = status;
  if (vendor) where.vendor = { contains: vendor, mode: "insensitive" };

  if (view === "upcoming") {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    where.dueDate = { lte: thirtyDaysFromNow };
    where.status = "pending";
  } else if (view === "overdue") {
    where.dueDate = { lt: new Date() };
    where.status = "pending";
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      entity: { select: { slug: true, name: true, color: true } },
      user: { select: { name: true } },
      email: { select: { subject: true, senderEmail: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ bills });
}

// POST /api/bills — manual bill entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { entitySlug, vendor, invoiceNumber, amount, dueDate, paymentTerms, expenseCategory } = body;

  if (!entitySlug || !vendor || amount === undefined) {
    return NextResponse.json(
      { error: "entitySlug, vendor, and amount are required" },
      { status: 400 }
    );
  }

  const entity = await prisma.entity.findUnique({
    where: { slug: entitySlug },
  });
  if (!entity) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const bill = await prisma.bill.create({
    data: {
      userId: session.user.id,
      entityId: entity.id,
      vendor,
      invoiceNumber: invoiceNumber || null,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentTerms: paymentTerms || null,
      expenseCategory: expenseCategory || null,
      source: "manual",
    },
    include: {
      entity: { select: { slug: true, name: true, color: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    actionType: "bill_created",
    description: `Created bill: ${vendor} $${amount}`,
    entityId: entity.id,
    relatedId: bill.id,
  });

  return NextResponse.json({ bill }, { status: 201 });
}
