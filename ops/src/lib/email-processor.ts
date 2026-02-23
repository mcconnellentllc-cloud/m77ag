// Email processing pipeline
// Called for each new email after it's stored in the database
// Pipeline: pre-filter -> blocked senders -> rules -> sender cache -> AI

import { prisma } from "./prisma";
import { preFilterEmail } from "./email-prefilter";
import { applyRules } from "./email-rules";
import { categorizeEmail } from "./ai-categorize";

export async function processNewEmail(
  emailId: string,
  hasUnsubscribeHeader: boolean
): Promise<void> {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { account: true },
  });

  if (!email) return;

  // Step 1: Check blocked senders
  const isBlocked = await prisma.blockedSender.findFirst({
    where: {
      OR: [
        { emailOrDomain: email.senderEmail.toLowerCase() },
        {
          emailOrDomain: email.senderEmail.toLowerCase().split("@")[1] || "",
        },
      ],
    },
  });

  if (isBlocked) {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        priority: "none",
        aiSummary: "Blocked sender",
        isArchived: true,
        processedAt: new Date(),
      },
    });
    return;
  }

  // Step 2: Pre-filter (free — no AI cost)
  const preFilterResult = preFilterEmail({
    senderEmail: email.senderEmail,
    subject: email.subject || "",
    snippet: email.snippet || "",
    hasUnsubscribeHeader,
  });

  if (preFilterResult.isNoise) {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        priority: "none",
        aiSummary: `Auto-filtered: ${preFilterResult.reason}`,
        processedAt: new Date(),
      },
    });
    return;
  }

  // Step 3: Apply user-defined rules
  const ruleMatch = await applyRules({
    senderEmail: email.senderEmail,
    subject: email.subject || "",
  });

  if (ruleMatch) {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        entityId: ruleMatch.entityId,
        priority: ruleMatch.priority || "medium",
        processedAt: new Date(),
      },
    });
    return;
  }

  // Step 4: Check sender cache (reuse previous categorization)
  const cached = await prisma.senderCache.findUnique({
    where: { email: email.senderEmail.toLowerCase() },
  });

  if (cached) {
    await prisma.senderCache.update({
      where: { email: email.senderEmail.toLowerCase() },
      data: { hitCount: { increment: 1 } },
    });

    await prisma.email.update({
      where: { id: emailId },
      data: {
        entityId: cached.entityId,
        priority: cached.priority || "medium",
        isBill: cached.isBill,
        processedAt: new Date(),
      },
    });
    return;
  }

  // Step 5: AI categorization (only reached if all above steps miss)
  try {
    const aiResult = await categorizeEmail({
      senderEmail: email.senderEmail,
      senderName: email.senderName || undefined,
      recipientAccount: email.account.emailAddress,
      subject: email.subject || "",
      snippet: email.snippet || "",
    });

    // Resolve entity slug to entity id
    const entity = await prisma.entity.findUnique({
      where: { slug: aiResult.entity },
    });

    await prisma.email.update({
      where: { id: emailId },
      data: {
        entityId: entity?.id || null,
        priority: aiResult.priority,
        isBill: aiResult.is_bill,
        needsResponse: aiResult.needs_response,
        aiSummary: aiResult.summary,
        processedAt: new Date(),
      },
    });

    // Cache this sender's categorization for future emails
    await prisma.senderCache.upsert({
      where: { email: email.senderEmail.toLowerCase() },
      update: {
        entityId: entity?.id || null,
        priority: aiResult.priority,
        isBill: aiResult.is_bill,
        hitCount: { increment: 1 },
      },
      create: {
        email: email.senderEmail.toLowerCase(),
        entityId: entity?.id || null,
        priority: aiResult.priority,
        isBill: aiResult.is_bill,
      },
    });
  } catch (error) {
    console.error(`AI categorization failed for email ${emailId}:`, error);
    // Don't leave the email unprocessed — mark with defaults
    await prisma.email.update({
      where: { id: emailId },
      data: {
        priority: "medium",
        aiSummary: "AI categorization failed — needs manual review",
        processedAt: new Date(),
      },
    });
  }
}
