// Every Field Records card needs a registry field (M77Field): field passes,
// insurance units and seed entries attach to the registry field, and the
// season records review lists registry fields to choose from. Cards added
// without one (Lueking cards with no Operations Center match) get one here,
// under the M77Farm of the card's farm. Runs every start; only adds.
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const M77Farm = require('../models/m77Farm');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function ensureRegistryFields() {
  const linked = new Set((await M77Field.find({ legacySource: 'CroppingField', legacyId: { $ne: null } }).select('legacyId').lean())
    .map(r => String(r.legacyId)));
  const cards = (await CroppingField.find({}).select('field farm acres county crop2026 lease soil').lean())
    .filter(c => !linked.has(String(c._id)));
  const added = [];
  const noFarm = new Set();
  for (const cf of cards) {
    const farm = await M77Farm.findOne({ name: new RegExp('^' + esc(cf.farm || '') + '$', 'i') }).select('_id client').lean();
    if (!farm || !farm.client) { noFarm.add(cf.farm || '(none)'); continue; }
    const lueking = String(cf.farm).toUpperCase() === 'LUEKING';
    const lease = cf.lease || {};
    // Same mapping as the original card migration (server/scripts/migrate-to-m77-fields.js).
    const shared = lease.type === 'crop-share' || lease.type === 'flex-lease';
    const landlordPct = shared && Number.isFinite(lease.sharePercentage) ? lease.sharePercentage : 0;
    await M77Field.create({
      name: cf.field,
      county: cf.county || '',
      acres: cf.acres || 0,
      owner: shared ? 'shared' : lease.type === 'cash-rent' ? 'landlord' : 'm77',
      landlordName: lease.landlord || '',
      m77SharePercent: 100 - landlordPct,
      landlordSharePercent: landlordPct,
      irrigation: cf.soil && cf.soil.irrigated ? 'pivot' : 'dryland',
      enterprise: lueking ? 'Lueking' : 'M77 AG',
      crop2026: cf.crop2026 || '',
      rotationGroup: cf.farm,
      client: farm.client,
      farm: farm._id,
      legacySource: 'CroppingField',
      legacyId: cf._id
    });
    added.push(cf.field);
  }
  const out = [];
  if (added.length) out.push(`registry fields added for ${added.length} cards: ${added.join(', ')}`);
  if (noFarm.size) out.push(`no registry farm for card farm ${[...noFarm].join(', ')}; those cards are not in the records lists`);
  return out;
}

module.exports = { ensureRegistryFields };
