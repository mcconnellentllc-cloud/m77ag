// Every Field Records card needs a registry field (M77Field): field passes,
// insurance units and seed entries attach to the registry field, and the
// season records review lists registry fields to choose from. Cards added
// without one (Lueking cards with no Operations Center match) get one here,
// under the M77Farm of the card's farm. Runs every start; only adds.
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const M77Farm = require('../models/m77Farm');
const Client = require('../models/client');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Registry farm for a card: the farm of that name; else the farm other cards
// of the same card farm already sit under; else a new farm of that name
// (Lueking under the client whose enterprise is Lueking, others under the
// owner client).
async function registryFarm(cf, farmsAdded) {
  const name = String(cf.farm || '').trim();
  if (!name) return null;
  const byName = await M77Farm.findOne({ name: new RegExp('^' + esc(name) + '$', 'i') }).select('_id client').lean();
  if (byName && byName.client) return byName;
  const siblings = (await CroppingField.find({ farm: cf.farm }).select('_id').lean()).map(c => c._id);
  const sibling = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: { $in: siblings } }).select('farm client').lean();
  if (sibling && sibling.farm && sibling.client) return { _id: sibling.farm, client: sibling.client };
  const lueking = name.toUpperCase() === 'LUEKING';
  const client = (lueking ? await Client.findOne({ defaultEnterprise: 'Lueking' }).lean() : null) ||
    await Client.findOne({ type: 'owner' }).sort({ createdAt: 1 }).lean();
  if (!client) return null;
  const lease = cf.lease || {};
  const type = ['owned', 'crop-share', 'cash-rent'].includes(lease.type) ? lease.type : (lueking ? 'cash-rent' : 'crop-share');
  const farm = await M77Farm.create({ name: lueking ? 'Lueking' : name, client: client._id, landlordName: lease.landlord || name, type,
    defaultShare: type === 'crop-share' && Number.isFinite(lease.sharePercentage) ? lease.sharePercentage / 100 : 0 });
  farmsAdded.push(farm.name);
  return { _id: farm._id, client: client._id };
}

// Custom acres (fields farmed for outside operators): a custom farm per
// operator and a registry field per field, added when missing. A field that
// already exists under any farm is left where it is.
const CUSTOM = require('../data/customFields');
async function ensureCustomFields() {
  const out = [];
  let client = await Client.findOne({ type: 'custom' }).sort({ createdAt: 1 });
  if (!client) client = await Client.create({ name: 'Custom', type: 'custom', contact: { name: 'Custom (no portal)' }, defaultEnterprise: 'Custom' });
  for (const f of CUSTOM.farms) {
    let farm = await M77Farm.findOne({ client: client._id, name: f.name }).lean();
    if (!farm) {
      farm = await M77Farm.create({ name: f.name, client: client._id, landlordName: f.name, type: 'custom', defaultShare: 0 });
      out.push(`custom farm added: ${f.name}`);
    }
    for (const [name, acres] of f.fields) {
      // Match curly and straight apostrophes alike.
      const pattern = '^' + esc(name).replace(/[\u2019']/g, "['\u2019]") + '$';
      if (await M77Field.exists({ name: new RegExp(pattern, 'i') })) continue;
      await M77Field.create({ name, acres, owner: 'm77', landlordName: f.name, enterprise: 'Custom', rotationGroup: f.name,
        client: client._id, farm: farm._id });
      out.push(`custom field added: ${f.name} / ${name} (${acres} ac)`);
    }
  }
  return out;
}

async function ensureRegistryFields() {
  let customLines = [];
  try { customLines = await ensureCustomFields(); } catch (e) { customLines = [`not added: custom acres (${e.message})`]; }
  const linked = new Set((await M77Field.find({ legacySource: 'CroppingField', legacyId: { $ne: null } }).select('legacyId').lean())
    .map(r => String(r.legacyId)));
  const cards = (await CroppingField.find({}).select('field farm acres county crop2026 lease soil').lean())
    .filter(c => !linked.has(String(c._id)));
  const added = [];
  const failed = [];
  const farmsAdded = [];
  for (const cf of cards) {
    try {
      const farm = await registryFarm(cf, farmsAdded);
      if (!farm) { failed.push(`${cf.field}: no registry farm or client for ${cf.farm || '(no farm)'}`); continue; }
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
    } catch (e) {
      // One card's problem does not stop the rest.
      failed.push(`${cf.field}: ${e.message}`);
    }
  }
  const out = [...customLines];
  if (added.length) out.push(`registry fields added for ${added.length} cards: ${added.join(', ')}`);
  if (farmsAdded.length) out.push(`registry farms added: ${farmsAdded.join(', ')}`);
  if (failed.length) out.push(`not added, so not in the records lists: ${failed.join('; ')}`);
  return out;
}

module.exports = { ensureRegistryFields };
