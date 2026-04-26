// Microsoft Graph API email sync
// Handles M365 accounts and shared mailboxes

import { Client } from "@microsoft/microsoft-graph-client";
import { prisma } from "./prisma";
import { processNewEmail } from "./email-processor";

interface GraphMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  from?: {
    emailAddress: { address: string; name: string };
  };
  toRecipients?: Array<{
    emailAddress: { address: string; name: string };
  }>;
  bodyPreview?: string;
  receivedDateTime?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  internetMessageHeaders?: Array<{
    name: string;
    value: string;
  }>;
}

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Refresh the access token using the refresh token
async function refreshMicrosoftToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date } | null> {
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || "",
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          scope: "https://graph.microsoft.com/.default offline_access",
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch {
    return null;
  }
}

// Get a valid access token — refresh if expired
async function getValidToken(accountId: string): Promise<string | null> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.accessToken) return null;

  // If token isn't expired, use it
  if (account.tokenExpiresAt && account.tokenExpiresAt > new Date()) {
    return account.accessToken;
  }

  // Token expired — refresh
  if (!account.refreshToken) return null;

  const refreshed = await refreshMicrosoftToken(account.refreshToken);
  if (!refreshed) return null;

  // Save new tokens
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

// Sync emails from a Microsoft account
export async function syncMicrosoftAccount(accountId: string): Promise<number> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.syncEnabled) return 0;

  const accessToken = await getValidToken(accountId);
  if (!accessToken) {
    console.error(`No valid token for account ${account.emailAddress}`);
    return 0;
  }

  const client = getGraphClient(accessToken);
  let newEmailCount = 0;

  try {
    // Determine the mailbox path — shared mailboxes use different endpoint
    const mailboxPath = account.isSharedMailbox
      ? `/users/${account.primaryAccountId || account.emailAddress}/mailFolders/inbox/messages`
      : "/me/mailFolders/inbox/messages";

    // Get the last sync time — only fetch new emails
    const sinceDate = account.lastSyncAt
      ? account.lastSyncAt.toISOString()
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Default: last 7 days

    const filter = `receivedDateTime ge ${sinceDate}`;

    // Fetch emails — page through results
    let url = `${mailboxPath}?$filter=${encodeURIComponent(filter)}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,bodyPreview,receivedDateTime,hasAttachments,isRead,internetMessageHeaders`;

    while (url) {
      const response = await client.api(url).get();
      const messages: GraphMessage[] = response.value || [];

      for (const msg of messages) {
        // Skip if we already have this email
        const existing = await prisma.email.findUnique({
          where: {
            accountId_providerMessageId: {
              accountId: account.id,
              providerMessageId: msg.id,
            },
          },
        });

        if (existing) continue;

        // Check for unsubscribe header
        const hasUnsubscribe = msg.internetMessageHeaders?.some(
          (h) => h.name.toLowerCase() === "list-unsubscribe"
        ) ?? false;

        // Store the email metadata
        const email = await prisma.email.create({
          data: {
            accountId: account.id,
            providerMessageId: msg.id,
            threadId: msg.conversationId || null,
            subject: msg.subject || "(No Subject)",
            senderEmail: msg.from?.emailAddress?.address || "unknown",
            senderName: msg.from?.emailAddress?.name || null,
            recipients: msg.toRecipients?.map((r) => ({
              email: r.emailAddress.address,
              name: r.emailAddress.name,
            })) || [],
            snippet: (msg.bodyPreview || "").substring(0, 200),
            bodyPreview: (msg.bodyPreview || "").substring(0, 1000),
            hasAttachments: msg.hasAttachments || false,
            isRead: msg.isRead || false,
            receivedAt: msg.receivedDateTime
              ? new Date(msg.receivedDateTime)
              : new Date(),
          },
        });

        // Process through filter/rules/AI pipeline
        await processNewEmail(email.id, hasUnsubscribe);
        newEmailCount++;
      }

      // Next page
      url = response["@odata.nextLink"] || null;
    }

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    });
  } catch (error) {
    console.error(`Error syncing Microsoft account ${account.emailAddress}:`, error);
  }

  return newEmailCount;
}

// Send a reply through the original Microsoft account
export async function sendMicrosoftReply(
  accountId: string,
  messageId: string,
  replyBody: string
): Promise<boolean> {
  const accessToken = await getValidToken(accountId);
  if (!accessToken) return false;

  const client = getGraphClient(accessToken);

  try {
    await client.api(`/me/messages/${messageId}/reply`).post({
      comment: replyBody,
    });
    return true;
  } catch (error) {
    console.error("Error sending Microsoft reply:", error);
    return false;
  }
}
