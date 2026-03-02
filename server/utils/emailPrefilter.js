// Pre-filter layer: FREE categorization before anything touches the AI
// Goal: only 20-40 emails/day actually hit Claude

const SPAM_PATTERNS = [
  'noreply@', 'no-reply@', 'mailer-daemon@',
  'notifications@', 'newsletter@', 'marketing@',
  'promo@', 'deals@', 'offers@', 'sales@'
];

const NOISE_SUBJECT_KEYWORDS = [
  'unsubscribe', 'newsletter', 'promotion', 'sale ends',
  'limited time', 'act now', 'click here', 'free trial',
  'special offer', "don't miss", 'last chance', 'expires',
  'weekly digest', 'daily digest'
];

function preFilterEmail({ senderEmail, subject, snippet, hasUnsubscribeHeader }) {
  const senderLower = (senderEmail || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();

  for (const pattern of SPAM_PATTERNS) {
    if (senderLower.startsWith(pattern)) {
      return { isNoise: true, reason: `Spam sender pattern: ${pattern}` };
    }
  }

  if (hasUnsubscribeHeader) {
    return { isNoise: true, reason: 'Has unsubscribe header' };
  }

  for (const keyword of NOISE_SUBJECT_KEYWORDS) {
    if (subjectLower.includes(keyword)) {
      return { isNoise: true, reason: `Noise keyword in subject: ${keyword}` };
    }
  }

  return { isNoise: false };
}

module.exports = { preFilterEmail };
