import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/financial/overview — consolidated dashboard data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Bills due this week
  const billsDueThisWeek = await prisma.bill.findMany({
    where: {
      status: "pending",
      dueDate: { gte: now, lte: sevenDaysFromNow },
    },
    include: { entity: { select: { slug: true, name: true, color: true } } },
    orderBy: { dueDate: "asc" },
  });

  const billsDueAmount = billsDueThisWeek.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );

  // Overdue bills
  const overdueBills = await prisma.bill.findMany({
    where: {
      status: "pending",
      dueDate: { lt: now },
    },
    include: { entity: { select: { slug: true, name: true, color: true } } },
  });

  // Expenses this month by entity
  const entities = await prisma.entity.findMany();
  const expensesByEntity: Record<string, number> = {};

  for (const entity of entities) {
    const expenses = await prisma.expense.findMany({
      where: {
        entityId: entity.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    expensesByEntity[entity.slug] = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
  }

  const totalExpensesThisMonth = Object.values(expensesByEntity).reduce(
    (a, b) => a + b,
    0
  );

  // Recent activity
  const recentActivity = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true } },
      entity: { select: { slug: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    billsDueThisWeek,
    billsDueAmount,
    overdueBills,
    expensesByEntity,
    totalExpensesThisMonth,
    recentActivity,
  });
}
