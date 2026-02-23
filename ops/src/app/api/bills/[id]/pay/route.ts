import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

// POST /api/bills/:id/pay — mark a bill as paid
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bill = await prisma.bill.findUnique({
    where: { id: params.id },
    include: { entity: true },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const body = await req.json();
  const { checkNumber, paymentDate, bankAccount, amountPaid, notes } = body;

  const finalAmount = amountPaid || bill.amount;

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      billId: bill.id,
      paidByUserId: session.user.id,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      amountPaid: finalAmount,
      notes: notes || null,
    },
  });

  // Update bill status
  await prisma.bill.update({
    where: { id: params.id },
    data: { status: "paid" },
  });

  // Auto-create expense record from payment
  await prisma.expense.create({
    data: {
      entityId: bill.entityId,
      billId: bill.id,
      paymentId: payment.id,
      date: paymentDate ? new Date(paymentDate) : new Date(),
      vendor: bill.vendor,
      amount: finalAmount,
      category: bill.expenseCategory || "other",
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      notes: notes || null,
      source: "bill_payment",
    },
  });

  await logActivity({
    userId: session.user.id,
    actionType: "bill_paid",
    description: `Paid bill: ${bill.vendor} $${finalAmount} (check: ${checkNumber || "N/A"})`,
    entityId: bill.entityId,
    relatedId: bill.id,
  });

  return NextResponse.json({ success: true, payment });
}
