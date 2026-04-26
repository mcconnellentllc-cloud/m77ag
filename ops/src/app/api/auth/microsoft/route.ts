// GET /api/auth/microsoft — initiate Microsoft OAuth flow
// Kyle clicks "Connect" on a Microsoft account in Settings,
// this redirects to Microsoft login, then back to /api/auth/microsoft/callback

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // accountId is passed as query param so we know which account to link tokens to
  const accountId = req.nextUrl.searchParams.get("accountId") || "";

  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`;

  // Scopes needed for reading mail and shared mailboxes
  const scopes = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Read.Shared",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/Mail.Send.Shared",
  ].join(" ");

  const authUrl = new URL(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
  );
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_mode", "query");
  // Pass accountId through state so callback knows which account to update
  authUrl.searchParams.set("state", accountId);

  return NextResponse.redirect(authUrl.toString());
}
