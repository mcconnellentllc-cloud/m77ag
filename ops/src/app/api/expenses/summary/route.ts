import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/expenses/summary — monthly/quarterly/annual totals by entity
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : null;

  const entities = await prisma.entity.findMany();

  // Build date range
  let startDate: Date;
  let endDate: Date;

  if (month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

  const summaryByEntity: Record<string, { total: number; byCategory: Record<string, number> }> = {};

  for (const entity of entities) {
    const expenses = await prisma.expense.findMany({
      where: {
        entityId: entity.id,
        date: { gte: startDate, lte: endDate },
      },
    });

    let total = 0;
    const byCategory: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      total += amt;
      byCategory[exp.category] = (byCategory[exp.category] || 0) + amt;
    }

    summaryByEntity[entity.slug] = { total, byCategory };
  }

  // Overall totals
  let grandTotal = 0;
  for (const slug of Object.keys(summaryByEntity)) {
    grandTotal += summaryByEntity[slug].total;
  }

  return NextResponse.json({
    year,
    month,
    summaryByEntity,
    grandTotal,
  });
}
