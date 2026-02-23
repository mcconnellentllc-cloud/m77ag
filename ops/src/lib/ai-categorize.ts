// AI categorization layer using Anthropic Claude API
// Only called for emails that survive pre-filtering AND are not in sender cache

import Anthropic from "@anthropic-ai/sdk";
import type { AICategorization } from "./types";

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

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export async function categorizeEmail(input: {
  senderEmail: string;
  senderName?: string;
  recipientAccount: string;
  subject: string;
  snippet: string;
}): Promise<AICategorization> {
  const client = getClient();
  const model = process.env.AI_MODEL || "claude-sonnet-4-5-20250929";

  const emailContext = `From: ${input.senderEmail} (${input.senderName || "Unknown"})
To: ${input.recipientAccount}
Subject: ${input.subject}
Snippet: ${input.snippet}`;

  const response = await client.messages.create({
    model,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `${CATEGORIZATION_PROMPT}\n\n${emailContext}`,
      },
    ],
  });

  // Extract text from response
  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response — handle potential markdown wrapping
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback if AI doesn't return valid JSON
    return {
      entity: "mcconnellent",
      priority: "medium",
      is_bill: false,
      needs_response: false,
      summary: "Could not categorize automatically",
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AICategorization;
    return {
      entity: parsed.entity || "mcconnellent",
      priority: parsed.priority || "medium",
      is_bill: Boolean(parsed.is_bill),
      needs_response: Boolean(parsed.needs_response),
      summary: parsed.summary || "",
    };
  } catch {
    return {
      entity: "mcconnellent",
      priority: "medium",
      is_bill: false,
      needs_response: false,
      summary: "Could not categorize automatically",
    };
  }
}

// Bill extraction prompt — used when an email is flagged as is_bill=true
const BILL_EXTRACTION_PROMPT = `Extract the following from this bill/invoice email. If the information is in a PDF attachment, read the attachment content provided.

Extract:
- vendor_name: Who is billing
- invoice_number: Invoice or reference number
- amount: Dollar amount due (number only, no dollar sign)
- due_date: When payment is due (ISO format YYYY-MM-DD)
- payment_terms: net 30, due on receipt, etc.
- entity: Which business entity this bill belongs to (m77ag, cattle, pioneer, togoag, acreprofit, cocorn, hunting, mcconnellent, personal, flamesoffury)
- expense_category: fuel, seed, chemical, feed, equipment, insurance, utilities, rent, labor, repairs, vet, mineral, hauling, processing, inventory, shipping, licensing, legal, accounting, office, other
- is_recurring: true/false

Respond in JSON only:
{"vendor_name": "", "invoice_number": "", "amount": 0, "due_date": "", "payment_terms": "", "entity": "", "expense_category": "", "is_recurring": false}`;

export interface BillExtraction {
  vendor_name: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  payment_terms: string;
  entity: string;
  expense_category: string;
  is_recurring: boolean;
}

export async function extractBillData(
  emailBody: string,
  subject: string,
  senderEmail: string
): Promise<BillExtraction> {
  const client = getClient();
  const model = process.env.AI_MODEL || "claude-sonnet-4-5-20250929";

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `${BILL_EXTRACTION_PROMPT}\n\nFrom: ${senderEmail}\nSubject: ${subject}\n\nBody:\n${emailBody}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      vendor_name: senderEmail,
      invoice_number: "",
      amount: 0,
      due_date: "",
      payment_terms: "",
      entity: "mcconnellent",
      expense_category: "other",
      is_recurring: false,
    };
  }

  try {
    return JSON.parse(jsonMatch[0]) as BillExtraction;
  } catch {
    return {
      vendor_name: senderEmail,
      invoice_number: "",
      amount: 0,
      due_date: "",
      payment_terms: "",
      entity: "mcconnellent",
      expense_category: "other",
      is_recurring: false,
    };
  }
}
