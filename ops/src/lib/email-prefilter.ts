// Pre-filter layer: FREE categorization before anything touches the AI
// Goal: only 20-40 emails/day actually hit Claude

const SPAM_DOMAINS = [
  "noreply@", "no-reply@", "mailer-daemon@",
  "notifications@", "newsletter@", "marketing@",
  "promo@", "deals@", "offers@", "sales@",
];

const NOISE_SUBJECT_KEYWORDS = [
  "unsubscribe", "newsletter", "promotion", "sale ends",
  "limited time", "act now", "click here", "free trial",
  "special offer", "don't miss", "last chance", "expires",
  "weekly digest", "daily digest",
];

interface PreFilterInput {
  senderEmail: string;
  subject: string;
  snippet: string;
  hasUnsubscribeHeader: boolean;
}

interface PreFilterResult {
  isNoise: boolean;
  reason?: string;
}

export function preFilterEmail(input: PreFilterInput): PreFilterResult {
  const senderLower = input.senderEmail.toLowerCase();
  const subjectLower = (input.subject || "").toLowerCase();

  // Check known spam sender patterns
  for (const pattern of SPAM_DOMAINS) {
    if (senderLower.startsWith(pattern)) {
      return { isNoise: true, reason: `Spam sender pattern: ${pattern}` };
    }
  }

  // Unsubscribe header present = likely marketing
  if (input.hasUnsubscribeHeader) {
    return { isNoise: true, reason: "Has unsubscribe header" };
  }

  // Subject contains noise keywords
  for (const keyword of NOISE_SUBJECT_KEYWORDS) {
    if (subjectLower.includes(keyword)) {
      return { isNoise: true, reason: `Noise keyword in subject: ${keyword}` };
    }
  }

  return { isNoise: false };
}

// Check if sender was previously categorized (sender cache lookup)
// This is called before AI to reuse previous categorizations
export interface CachedCategorization {
  entityId: string | null;
  priority: string | null;
  isBill: boolean;
}

export async function getCachedSenderCategory(
  senderEmail: string,
  prismaClient: { senderCache: { findUnique: (args: { where: { email: string } }) => Promise<CachedCategorization | null>; update: (args: { where: { email: string }; data: { hitCount: { increment: number } } }) => Promise<unknown> } }
): Promise<CachedCategorization | null> {
  const cached = await prismaClient.senderCache.findUnique({
    where: { email: senderEmail.toLowerCase() },
  });

  if (cached) {
    // Increment hit count for analytics
    await prismaClient.senderCache.update({
      where: { email: senderEmail.toLowerCase() },
      data: { hitCount: { increment: 1 } },
    });
    return {
      entityId: cached.entityId,
      priority: cached.priority,
      isBill: cached.isBill,
    };
  }

  return null;
}
