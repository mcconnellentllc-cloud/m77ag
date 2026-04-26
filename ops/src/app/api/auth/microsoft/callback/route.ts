// GET /api/auth/microsoft/callback — handle Microsoft OAuth callback
// Microsoft redirects here after Kyle approves access
// We exchange the auth code for access + refresh tokens, store them on the account

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const accountId = req.nextUrl.searchParams.get("state") || "";
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    const errorDesc = req.nextUrl.searchParams.get("error_description") || "Unknown error";
    console.error("Microsoft OAuth error:", error, errorDesc);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(errorDesc)}`, req.url)
    );
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Microsoft token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/settings?error=Token+exchange+failed", req.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Store tokens on the email account
    if (accountId) {
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          syncEnabled: true,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/settings?connected=microsoft", req.url)
    );
  } catch (err) {
    console.error("Microsoft OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?error=OAuth+callback+failed", req.url)
    );
  }
}
