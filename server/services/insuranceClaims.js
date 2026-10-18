// Startup: attaches each claim unit to its field card when the data names
// the card (fieldHint is an exact card name, matched by legal description and
// the crop grown there). Each unit is handled once, so a unit taken off or
// moved on Field Setup stays where it was put. Units without a card wait on
// Field Setup.
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const FieldInsurance = require('../models/fieldInsurance');
const AppliedUpdate = require('../models/appliedUpdate');
const { CLAIMS, attachUnit } = require('../controllers/fieldInsuranceController');

const KEY = 'insurance-claims-auto-attach';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function attachClaimUnits() {
  const doc = await AppliedUpdate.findOne({ key: KEY });
  const handled = new Set(doc ? doc.summary : []);
  const done = [];
  let attached = 0;
  const waiting = [];
  // The 2025 Rain and Hail policies; other claims are attached on Field Setup.
  for (const [id, claim] of Object.entries(CLAIMS).filter(([k]) => k.startsWith('rh-2025-'))) {
    const { POLICY } = claim;
    for (const unit of claim.UNITS) {
      const tag = `${id}:${unit.unitNumber}`;
      if (handled.has(tag)) continue;
      const exists = await FieldInsurance.exists({ policyNumber: POLICY.policyNumber, unitNumber: unit.unitNumber, cropYear: POLICY.cropYear, crop: POLICY.crop });
      if (exists) { done.push(tag); continue; }
      // Only exact card names are attached automatically.
      const card = unit.fieldHint && await CroppingField.findOne({ field: new RegExp('^' + esc(unit.fieldHint) + '$', 'i') }).select('_id').lean();
      const reg = card && await M77Field.findOne({ legacySource: 'CroppingField', legacyId: card._id }).select('_id').lean();
      if (!reg) { if (unit.fieldHint) waiting.push(`${unit.unitNumber} (${unit.fieldHint})`); continue; }
      await attachUnit(claim, unit, reg._id, null);
      attached += 1;
      done.push(tag);
    }
  }
  if (done.length) await AppliedUpdate.updateOne({ key: KEY }, { $addToSet: { summary: { $each: done } }, $setOnInsert: { appliedAt: new Date() } }, { upsert: true });
  const out = [];
  if (attached) out.push(`${attached} claim units attached to their field cards`);
  if (waiting.length) out.push(`no card for ${waiting.join(', ')}`);
  return out;
}

module.exports = { attachClaimUnits };
