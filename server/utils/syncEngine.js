// Email sync engine
// Handles Gmail (via googleapis) and Microsoft (via Graph API fetch)
// Coordinates syncing across all connected email accounts

const { MailEmailAccount, MailEmail } = require('../models/mailCenter');
const { processNewEmail } = require('./emailProcessor');

// ============================================================
// GMAIL SYNC
// ============================================================

async function refreshGoogleToken(refreshToken) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000)
    };
  } catch {
    return null;
  }
}

async function getValidGmailToken(account) {
  if (!account.accessToken) return null;

  if (account.tokenExpiresAt && account.tokenExpiresAt > new Date()) {
    return account.accessToken;
  }

  if (!account.refreshToken) return null;

  const refreshed = await refreshGoogleToken(account.refreshToken);
  if (!refreshed) return null;

  await MailEmailAccount.findByIdAndUpdate(account._id, {
    accessToken: refreshed.accessToken,
    tokenExpiresAt: refreshed.expiresAt
  });

  return refreshed.accessToken;
}

function getHeader(headers, name) {
  const header = (headers || []).find(h => (h.name || '').toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

async function syncGmailAccount(accountId) {
  const account = await MailEmailAccount.findById(accountId);
  if (!account || !account.syncEnabled) return 0;

  const accessToken = await getValidGmailToken(account);
  if (!accessToken) {
    console.error(`No valid token for Gmail account ${account.emailAddress}`);
    return 0;
  }

  let newEmailCount = 0;

  try {
    const sinceDate = account.lastSyncAt
      ? Math.floor(account.lastSyncAt.getTime() / 1000)
      : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

    const query = `after:${sinceDate} in:inbox`;
    let pageToken = '';

    do {
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}`;

      const listRes = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!listRes.ok) {
        console.error(`Gmail list error: ${listRes.status}`);
        break;
      }

      const listData = await listRes.json();
      const messages = listData.messages || [];

      for (const msgRef of messages) {
        if (!msgRef.id) continue;

        // Skip if we already have this email
        const existing = await MailEmail.findOne({
          accountId: account._id,
          providerMessageId: msgRef.id
        });
        if (existing) continue;

        // Fetch message metadata
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe`;

        const msgRes = await fetch(msgUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!msgRes.ok) continue;
        const msg = await msgRes.json();

        const headers = msg.payload?.headers || [];

        // Parse sender
        const fromHeader = getHeader(headers, 'From');
        const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/);
        const senderName = fromMatch?.[1] || '';
        const senderEmail = fromMatch?.[2] || fromHeader;

        // Parse recipients
        const toHeader = getHeader(headers, 'To');
        const recipients = toHeader.split(',').map(r => {
          const match = r.trim().match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/);
          return { name: match?.[1] || '', email: match?.[2] || r.trim() };
        });

        const hasUnsubscribe = Boolean(getHeader(headers, 'List-Unsubscribe'));
        const snippet = msg.snippet || '';
        const isRead = !msg.labelIds?.includes('UNREAD');

        // Check for attachments
        const hasAttachments = msg.payload?.parts?.some(
          p => p.filename && p.filename.length > 0
        ) || false;

        const email = await MailEmail.create({
          accountId: account._id,
          providerMessageId: msgRef.id,
          threadId: msg.threadId || null,
          subject: getHeader(headers, 'Subject') || '(No Subject)',
          senderEmail,
          senderName: senderName || null,
          recipients,
          snippet: snippet.substring(0, 200),
          bodyPreview: snippet.substring(0, 1000),
          hasAttachments,
          isRead,
          receivedAt: msg.internalDate
            ? new Date(parseInt(msg.internalDate))
            : new Date()
        });

        await processNewEmail(email._id, hasUnsubscribe);
        newEmailCount++;
      }

      pageToken = listData.nextPageToken || '';
    } while (pageToken);

    await MailEmailAccount.findByIdAndUpdate(accountId, {
      lastSyncAt: new Date()
    });
  } catch (err) {
    console.error(`Error syncing Gmail account ${account.emailAddress}:`, err.message);
  }

  return newEmailCount;
}

// ============================================================
// MICROSOFT SYNC
// ============================================================

async function refreshMicrosoftToken(refreshToken) {
  try {
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/.default offline_access'
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    };
  } catch {
    return null;
  }
}

async function getValidMicrosoftToken(account) {
  if (!account.accessToken) return null;

  if (account.tokenExpiresAt && account.tokenExpiresAt > new Date()) {
    return account.accessToken;
  }

  if (!account.refreshToken) return null;

  const refreshed = await refreshMicrosoftToken(account.refreshToken);
  if (!refreshed) return null;

  await MailEmailAccount.findByIdAndUpdate(account._id, {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    tokenExpiresAt: refreshed.expiresAt
  });

  return refreshed.accessToken;
}

async function syncMicrosoftAccount(accountId) {
  const account = await MailEmailAccount.findById(accountId);
  if (!account || !account.syncEnabled) return 0;

  const accessToken = await getValidMicrosoftToken(account);
  if (!accessToken) {
    console.error(`No valid token for account ${account.emailAddress}`);
    return 0;
  }

  let newEmailCount = 0;

  try {
    const mailboxPath = account.isSharedMailbox
      ? `/users/${account.emailAddress}/mailFolders/inbox/messages`
      : '/me/mailFolders/inbox/messages';

    const sinceDate = account.lastSyncAt
      ? account.lastSyncAt.toISOString()
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const filter = `receivedDateTime ge ${sinceDate}`;
    let url = `https://graph.microsoft.com/v1.0${mailboxPath}?$filter=${encodeURIComponent(filter)}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,bodyPreview,receivedDateTime,hasAttachments,isRead,internetMessageHeaders`;

    while (url) {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.error(`Microsoft Graph error: ${response.status}`);
        break;
      }

      const data = await response.json();
      const messages = data.value || [];

      for (const msg of messages) {
        // Skip if we already have this email
        const existing = await MailEmail.findOne({
          accountId: account._id,
          providerMessageId: msg.id
        });
        if (existing) continue;

        const hasUnsubscribe = (msg.internetMessageHeaders || []).some(
          h => (h.name || '').toLowerCase() === 'list-unsubscribe'
        );

        const email = await MailEmail.create({
          accountId: account._id,
          providerMessageId: msg.id,
          threadId: msg.conversationId || null,
          subject: msg.subject || '(No Subject)',
          senderEmail: msg.from?.emailAddress?.address || 'unknown',
          senderName: msg.from?.emailAddress?.name || null,
          recipients: (msg.toRecipients || []).map(r => ({
            email: r.emailAddress.address,
            name: r.emailAddress.name
          })),
          snippet: (msg.bodyPreview || '').substring(0, 200),
          bodyPreview: (msg.bodyPreview || '').substring(0, 1000),
          hasAttachments: msg.hasAttachments || false,
          isRead: msg.isRead || false,
          receivedAt: msg.receivedDateTime
            ? new Date(msg.receivedDateTime)
            : new Date()
        });

        await processNewEmail(email._id, hasUnsubscribe);
        newEmailCount++;
      }

      url = data['@odata.nextLink'] || null;
    }

    await MailEmailAccount.findByIdAndUpdate(accountId, {
      lastSyncAt: new Date()
    });
  } catch (err) {
    console.error(`Error syncing Microsoft account ${account.emailAddress}:`, err.message);
  }

  return newEmailCount;
}

// ============================================================
// ORCHESTRATOR
// ============================================================

async function syncAllAccounts() {
  const accounts = await MailEmailAccount.find({ syncEnabled: true });
  const results = [];

  for (const account of accounts) {
    try {
      let newEmails = 0;

      if (account.provider === 'outlook') {
        newEmails = await syncMicrosoftAccount(account._id);
      } else if (account.provider === 'gmail') {
        newEmails = await syncGmailAccount(account._id);
      }

      results.push({
        accountId: account._id,
        emailAddress: account.emailAddress,
        provider: account.provider,
        newEmails
      });
    } catch (err) {
      results.push({
        accountId: account._id,
        emailAddress: account.emailAddress,
        provider: account.provider,
        newEmails: 0,
        error: err.message
      });
    }
  }

  return results;
}

async function syncSingleAccount(accountId) {
  const account = await MailEmailAccount.findById(accountId);
  if (!account) {
    return { accountId, emailAddress: 'unknown', provider: 'unknown', newEmails: 0, error: 'Account not found' };
  }

  try {
    let newEmails = 0;
    if (account.provider === 'outlook') {
      newEmails = await syncMicrosoftAccount(account._id);
    } else if (account.provider === 'gmail') {
      newEmails = await syncGmailAccount(account._id);
    }

    return {
      accountId: account._id,
      emailAddress: account.emailAddress,
      provider: account.provider,
      newEmails
    };
  } catch (err) {
    return {
      accountId: account._id,
      emailAddress: account.emailAddress,
      provider: account.provider,
      newEmails: 0,
      error: err.message
    };
  }
}

module.exports = { syncAllAccounts, syncSingleAccount, syncGmailAccount, syncMicrosoftAccount };
