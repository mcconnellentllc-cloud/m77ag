// GET /api/auth/google/callback — handle Google OAuth callback
// Google redirects here after Kyle approves access
// We exchange the auth code for access + refresh tokens, store them on the account

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const accountId = req.nextUrl.searchParams.get("state") || "";
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error || "Unknown error")}`, req.url)
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens on the email account
    if (accountId && tokens.access_token) {
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600000),
          syncEnabled: true,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/settings?connected=google", req.url)
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?error=OAuth+callback+failed", req.url)
    );
  }
}
