import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSyncStatus } from "@/lib/sync-engine";

// GET /api/accounts — list connected email accounts with sync status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await getSyncStatus();
  return NextResponse.json({ accounts });
}
