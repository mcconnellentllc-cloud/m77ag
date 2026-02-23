import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// GET /api/expenses — list expenses with filtering
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const entitySlug = searchParams.get("entity");
  const category = searchParams.get("category");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const where: Record<string, unknown> = {};

  if (entitySlug) {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
    });
    if (entity) where.entityId = entity.id;
  }

  if (category) where.category = category;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      entity: { select: { slug: true, name: true, color: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

// POST /api/expenses — manual expense entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    entitySlug, date, vendor, amount, category,
    subcategory, checkNumber, bankAccount, notes,
  } = body;

  if (!entitySlug || !vendor || !amount || !category) {
    return NextResponse.json(
      { error: "entitySlug, vendor, amount, and category are required" },
      { status: 400 }
    );
  }

  const entity = await prisma.entity.findUnique({
    where: { slug: entitySlug },
  });
  if (!entity) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const expense = await prisma.expense.create({
    data: {
      entityId: entity.id,
      date: date ? new Date(date) : new Date(),
      vendor,
      amount,
      category,
      subcategory: subcategory || null,
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      notes: notes || null,
      source: "manual",
    },
    include: {
      entity: { select: { slug: true, name: true, color: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    actionType: "expense_created",
    description: `Created expense: ${vendor} $${amount} (${category})`,
    entityId: entity.id,
    relatedId: expense.id,
  });

  return NextResponse.json({ expense }, { status: 201 });
}
