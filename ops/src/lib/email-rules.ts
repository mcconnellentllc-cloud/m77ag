// Smart rules engine — user-defined rules that override AI categorization
// Rules are checked BEFORE AI is called (after pre-filter, after sender cache)

import { prisma } from "./prisma";

interface RuleMatch {
  entityId: string | null;
  priority: string | null;
}

export async function applyRules(input: {
  senderEmail: string;
  subject: string;
}): Promise<RuleMatch | null> {
  const rules = await prisma.emailRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const senderLower = input.senderEmail.toLowerCase();
  const subjectLower = (input.subject || "").toLowerCase();
  const senderDomain = senderLower.split("@")[1] || "";

  for (const rule of rules) {
    const value = rule.conditionValue.toLowerCase();
    let matches = false;

    switch (rule.conditionType) {
      case "sender":
        matches = senderLower === value;
        break;
      case "domain":
        matches = senderDomain === value || senderDomain.endsWith(`.${value}`);
        break;
      case "subject":
        matches = subjectLower.includes(value);
        break;
      case "keyword":
        matches =
          subjectLower.includes(value) || senderLower.includes(value);
        break;
    }

    if (matches) {
      return {
        entityId: rule.assignEntityId,
        priority: rule.assignPriority,
      };
    }
  }

  return null;
}
