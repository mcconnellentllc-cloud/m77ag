import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncAllAccounts } from "@/lib/sync-engine";

// POST /api/accounts/sync — trigger manual sync of all accounts
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllAccounts();
  return NextResponse.json({ results });
}
