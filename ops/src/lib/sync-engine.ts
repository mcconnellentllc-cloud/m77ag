// Sync engine orchestrator
// Runs on a schedule (every 5 minutes by default) or on demand
// Coordinates syncing across all connected email accounts

import { prisma } from "./prisma";
import { syncMicrosoftAccount } from "./sync-microsoft";
import { syncGmailAccount } from "./sync-gmail";

export interface SyncResult {
  accountId: string;
  emailAddress: string;
  provider: string;
  newEmails: number;
  error?: string;
}

// Sync all enabled accounts
export async function syncAllAccounts(): Promise<SyncResult[]> {
  const accounts = await prisma.emailAccount.findMany({
    where: { syncEnabled: true },
  });

  const results: SyncResult[] = [];

  for (const account of accounts) {
    try {
      let newEmails = 0;

      if (account.provider === "outlook") {
        newEmails = await syncMicrosoftAccount(account.id);
      } else if (account.provider === "gmail") {
        newEmails = await syncGmailAccount(account.id);
      }

      results.push({
        accountId: account.id,
        emailAddress: account.emailAddress,
        provider: account.provider,
        newEmails,
      });
    } catch (error) {
      results.push({
        accountId: account.id,
        emailAddress: account.emailAddress,
        provider: account.provider,
        newEmails: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// Sync a single account
export async function syncSingleAccount(accountId: string): Promise<SyncResult> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return {
      accountId,
      emailAddress: "unknown",
      provider: "unknown",
      newEmails: 0,
      error: "Account not found",
    };
  }

  try {
    let newEmails = 0;

    if (account.provider === "outlook") {
      newEmails = await syncMicrosoftAccount(account.id);
    } else if (account.provider === "gmail") {
      newEmails = await syncGmailAccount(account.id);
    }

    return {
      accountId: account.id,
      emailAddress: account.emailAddress,
      provider: account.provider,
      newEmails,
    };
  } catch (error) {
    return {
      accountId: account.id,
      emailAddress: account.emailAddress,
      provider: account.provider,
      newEmails: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get sync status for all accounts
export async function getSyncStatus() {
  const accounts = await prisma.emailAccount.findMany({
    select: {
      id: true,
      emailAddress: true,
      displayName: true,
      provider: true,
      lastSyncAt: true,
      syncEnabled: true,
      entity: {
        select: { slug: true, name: true, color: true },
      },
    },
  });

  return accounts.map((a) => ({
    id: a.id,
    emailAddress: a.emailAddress,
    displayName: a.displayName,
    provider: a.provider,
    lastSyncAt: a.lastSyncAt,
    syncEnabled: a.syncEnabled,
    entity: a.entity,
  }));
}
