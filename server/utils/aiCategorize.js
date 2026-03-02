// AI categorization layer using Anthropic Claude API
// Only called for emails that survive pre-filtering AND are not in sender cache

const CATEGORIZATION_PROMPT = `You are an email categorizer for a multi-business agricultural operation in northeastern Colorado. Categorize this email into ONE business entity and ONE priority level.

Business entities:
- m77ag: Farm operations, custom farming, equipment, landlords, field work
- cattle: Cattle buyers, feed suppliers, vet, auction, livestock
- pioneer: Pioneer Seeds, Corteva, seed sales, hybrid data, seed customers
- togoag: Retail business, ToGoAG operations
- acreprofit: Chemical sales, spray records, chemical customers
- cocorn: Colorado Corn Growers Association, CCGA board, corn association
- hunting: Hunting leases, hunters, DNR, wildlife
- mcconnellent: General business bills, utilities, insurance, accounting, legal
- personal: Family, kids, personal, non-business
- flamesoffury: Book project, writing, publishing

Priority levels:
- critical: Needs response TODAY. Time-sensitive business decision, urgent request from important contact.
- high: Needs response this week. Business correspondence requiring action.
- medium: Should review. Informational but relevant to operations.
- low: FYI only. Can batch review.
- none: Noise. Marketing, spam that got through, irrelevant.

Also determine:
- is_bill: true/false (is this an invoice, statement, or payment request?)
- needs_response: true/false (does this email require Kyle or Brandi to reply?)
- summary: One sentence summary of what this email is about.

Respond in JSON only:
{"entity": "", "priority": "", "is_bill": false, "needs_response": false, "summary": ""}`;

async function categorizeEmail({ senderEmail, senderName, recipientAccount, subject, snippet }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set - skipping AI categorization');
    return {
      entity: 'mcconnellent',
      priority: 'medium',
      is_bill: false,
      needs_response: false,
      summary: 'AI categorization unavailable - needs manual review'
    };
  }

  const model = process.env.AI_MODEL || 'claude-sonnet-4-5-20250929';

  const emailContext = `From: ${senderEmail} (${senderName || 'Unknown'})
To: ${recipientAccount}
Subject: ${subject}
Snippet: ${snippet}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `${CATEGORIZATION_PROMPT}\n\n${emailContext}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.type === 'text' ? data.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        entity: 'mcconnellent',
        priority: 'medium',
        is_bill: false,
        needs_response: false,
        summary: 'Could not categorize automatically'
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      entity: parsed.entity || 'mcconnellent',
      priority: parsed.priority || 'medium',
      is_bill: Boolean(parsed.is_bill),
      needs_response: Boolean(parsed.needs_response),
      summary: parsed.summary || ''
    };
  } catch (err) {
    console.error('AI categorization error:', err.message);
    return {
      entity: 'mcconnellent',
      priority: 'medium',
      is_bill: false,
      needs_response: false,
      summary: 'AI categorization failed - needs manual review'
    };
  }
}

module.exports = { categorizeEmail };
