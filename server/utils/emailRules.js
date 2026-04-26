// Smart rules engine - user-defined rules that override AI categorization
// Rules are checked BEFORE AI is called

const { MailEmailRule } = require('../models/mailCenter');

async function applyRules({ senderEmail, subject }) {
  const rules = await MailEmailRule.find({ isActive: true }).sort({ createdAt: 1 });

  const senderLower = (senderEmail || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();
  const senderDomain = senderLower.split('@')[1] || '';

  for (const rule of rules) {
    const value = rule.conditionValue.toLowerCase();
    let matches = false;

    switch (rule.conditionType) {
      case 'sender':
        matches = senderLower === value;
        break;
      case 'domain':
        matches = senderDomain === value || senderDomain.endsWith(`.${value}`);
        break;
      case 'subject':
        matches = subjectLower.includes(value);
        break;
      case 'keyword':
        matches = subjectLower.includes(value) || senderLower.includes(value);
        break;
    }

    if (matches) {
      return {
        entityId: rule.assignEntityId,
        priority: rule.assignPriority
      };
    }
  }

  return null;
}

module.exports = { applyRules };
