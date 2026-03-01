// Gmail API email sync
// Handles the 3 Gmail accounts

import { google } from "googleapis";
import { prisma } from "./prisma";
import { processNewEmail } from "./email-processor";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
);

// Refresh Google access token
async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      accessToken: credentials.access_token || "",
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
    };
  } catch {
    return null;
  }
}

// Get a valid access token for a Gmail account
async function getValidToken(accountId: string): Promise<string | null> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.accessToken) return null;

  if (account.tokenExpiresAt && account.tokenExpiresAt > new Date()) {
    return account.accessToken;
  }

  if (!account.refreshToken) return null;

  const refreshed = await refreshGoogleToken(account.refreshToken);
  if (!refreshed) return null;

  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      accessToken: refreshed.accessToken,
      tokenExpiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

// Parse email headers from Gmail message
function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  const header = headers.find(
    (h) => (h.name || "").toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

// Sync emails from a Gmail account
export async function syncGmailAccount(accountId: string): Promise<number> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.syncEnabled) return 0;

  const accessToken = await getValidToken(accountId);
  if (!accessToken) {
    console.error(`No valid token for Gmail account ${account.emailAddress}`);
    return 0;
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  let newEmailCount = 0;

  try {
    // Build query — only fetch emails since last sync
    const sinceDate = account.lastSyncAt
      ? Math.floor(account.lastSyncAt.getTime() / 1000)
      : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

    const query = `after:${sinceDate} in:inbox`;

    // List messages
    let pageToken: string | undefined;
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 50,
        pageToken,
      });

      const messages = listResponse.data.messages || [];

      for (const msgRef of messages) {
        if (!msgRef.id) continue;

        // Skip if we already have this email
        const existing = await prisma.email.findUnique({
          where: {
            accountId_providerMessageId: {
              accountId: account.id,
              providerMessageId: msgRef.id,
            },
          },
        });

        if (existing) continue;

        // Fetch full message metadata
        const msgResponse = await gmail.users.messages.get({
          userId: "me",
          id: msgRef.id,
          format: "metadata",
          metadataHeaders: [
            "From",
            "To",
            "Subject",
            "Date",
            "List-Unsubscribe",
          ],
        });

        const msg = msgResponse.data;
        const headers = msg.payload?.headers || [];

        // Parse sender
        const fromHeader = getHeader(headers, "From");
        const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/);
        const senderName = fromMatch?.[1] || "";
        const senderEmail = fromMatch?.[2] || fromHeader;

        // Parse recipients
        const toHeader = getHeader(headers, "To");
        const recipients = toHeader
          .split(",")
          .map((r) => {
            const match = r.trim().match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/);
            return {
              name: match?.[1] || "",
              email: match?.[2] || r.trim(),
            };
          });

        // Check for unsubscribe header
        const hasUnsubscribe = Boolean(getHeader(headers, "List-Unsubscribe"));

        // Get snippet
        const snippet = msg.snippet || "";

        // Determine read status
        const isRead = !msg.labelIds?.includes("UNREAD");

        // Store the email metadata
        const email = await prisma.email.create({
          data: {
            accountId: account.id,
            providerMessageId: msgRef.id,
            threadId: msg.threadId || null,
            subject: getHeader(headers, "Subject") || "(No Subject)",
            senderEmail: senderEmail,
            senderName: senderName || null,
            recipients: recipients,
            snippet: snippet.substring(0, 200),
            bodyPreview: snippet.substring(0, 1000),
            hasAttachments:
              msg.payload?.parts?.some(
                (p) => p.filename && p.filename.length > 0
              ) || false,
            isRead,
            receivedAt: msg.internalDate
              ? new Date(parseInt(msg.internalDate))
              : new Date(),
          },
        });

        await processNewEmail(email.id, hasUnsubscribe);
        newEmailCount++;
      }

      pageToken = listResponse.data.nextPageToken || undefined;
    } while (pageToken);

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    });
  } catch (error) {
    console.error(`Error syncing Gmail account ${account.emailAddress}:`, error);
  }

  return newEmailCount;
}

// Send reply through Gmail
export async function sendGmailReply(
  accountId: string,
  messageId: string,
  threadId: string,
  replyBody: string,
  to: string,
  subject: string
): Promise<boolean> {
  const accessToken = await getValidToken(accountId);
  if (!accessToken) return false;

  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });
  if (!account) return false;

  // Build raw email
  const rawEmail = [
    `From: ${account.emailAddress}`,
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${messageId}`,
    `References: ${messageId}`,
    "",
    replyBody,
  ].join("\r\n");

  const encodedEmail = Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
        threadId,
      },
    });
    return true;
  } catch (error) {
    console.error("Error sending Gmail reply:", error);
    return false;
  }
}
