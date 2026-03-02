// Email processing pipeline
// Called for each new email after it's stored in the database
// Pipeline: blocked senders -> pre-filter -> rules -> sender cache -> AI

const { MailEmail, MailBlockedSender, MailSenderCache, MailEntity } = require('../models/mailCenter');
const { preFilterEmail } = require('./emailPrefilter');
const { applyRules } = require('./emailRules');
const { categorizeEmail } = require('./aiCategorize');

async function processNewEmail(emailId, hasUnsubscribeHeader) {
  const email = await MailEmail.findById(emailId).populate('accountId');
  if (!email) return;

  // Step 1: Check blocked senders
  const senderDomain = email.senderEmail.toLowerCase().split('@')[1] || '';
  const isBlocked = await MailBlockedSender.findOne({
    $or: [
      { emailOrDomain: email.senderEmail.toLowerCase() },
      { emailOrDomain: senderDomain }
    ]
  });

  if (isBlocked) {
    await MailEmail.findByIdAndUpdate(emailId, {
      priority: 'none',
      aiSummary: 'Blocked sender',
      isArchived: true,
      processedAt: new Date()
    });
    return;
  }

  // Step 2: Pre-filter (free - no AI cost)
  const preFilterResult = preFilterEmail({
    senderEmail: email.senderEmail,
    subject: email.subject || '',
    snippet: email.snippet || '',
    hasUnsubscribeHeader
  });

  if (preFilterResult.isNoise) {
    await MailEmail.findByIdAndUpdate(emailId, {
      priority: 'none',
      aiSummary: `Auto-filtered: ${preFilterResult.reason}`,
      processedAt: new Date()
    });
    return;
  }

  // Step 3: Apply user-defined rules
  const ruleMatch = await applyRules({
    senderEmail: email.senderEmail,
    subject: email.subject || ''
  });

  if (ruleMatch) {
    await MailEmail.findByIdAndUpdate(emailId, {
      entityId: ruleMatch.entityId,
      priority: ruleMatch.priority || 'medium',
      processedAt: new Date()
    });
    return;
  }

  // Step 4: Check sender cache (reuse previous categorization)
  const cached = await MailSenderCache.findOne({
    email: email.senderEmail.toLowerCase()
  });

  if (cached) {
    await MailSenderCache.findByIdAndUpdate(cached._id, {
      $inc: { hitCount: 1 }
    });

    await MailEmail.findByIdAndUpdate(emailId, {
      entityId: cached.entityId,
      priority: cached.priority || 'medium',
      isBill: cached.isBill,
      processedAt: new Date()
    });
    return;
  }

  // Step 5: AI categorization (only reached if all above steps miss)
  try {
    const aiResult = await categorizeEmail({
      senderEmail: email.senderEmail,
      senderName: email.senderName || undefined,
      recipientAccount: email.accountId?.emailAddress || '',
      subject: email.subject || '',
      snippet: email.snippet || ''
    });

    // Resolve entity slug to entity id
    const entity = await MailEntity.findOne({ slug: aiResult.entity });

    await MailEmail.findByIdAndUpdate(emailId, {
      entityId: entity?._id || null,
      priority: aiResult.priority,
      isBill: aiResult.is_bill,
      needsResponse: aiResult.needs_response,
      aiSummary: aiResult.summary,
      processedAt: new Date()
    });

    // Cache this sender's categorization
    await MailSenderCache.findOneAndUpdate(
      { email: email.senderEmail.toLowerCase() },
      {
        entityId: entity?._id || null,
        priority: aiResult.priority,
        isBill: aiResult.is_bill,
        $inc: { hitCount: 1 }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`AI categorization failed for email ${emailId}:`, err.message);
    await MailEmail.findByIdAndUpdate(emailId, {
      priority: 'medium',
      aiSummary: 'AI categorization failed - needs manual review',
      processedAt: new Date()
    });
  }
}

module.exports = { processNewEmail };
