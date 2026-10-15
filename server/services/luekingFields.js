const AppliedUpdate = require('../models/appliedUpdate');
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const DATA = require('../data/luekingFields');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Adds a Field Records card for each Lueking field that has none, links it to
// the matching registry field from the Operations Center when there is one,
// and fills only blanks on cards that exist.
async function addLuekingFields() {
  const out = [];
  for (const d of DATA.fields) {
    let cf = await CroppingField.findOne({ field: new RegExp('^' + esc(d.field) + '$', 'i') }).lean();
    if (!cf) {
      const doc = {
        farm: DATA.farm, field: d.field, acres: d.acres,
        lease: { type: 'crop-share', landlord: DATA.landlord },
        soil: { irrigated: !!d.irrigated, samples: [] },
        notes: 'Acres are 2026 seeded acres from Operations Center until FSA acres are on file.' + (d.note ? ' ' + d.note : '')
      };
      if (d.crop2026) doc.crop2026 = d.crop2026;
      // Raw insert: the card holds only what is known; later edits validate as usual.
      const r = await CroppingField.collection.insertOne({ client: 'MCC. ENT.', ...doc, cropHistory: [], createdAt: new Date(), updatedAt: new Date() });
      cf = { _id: r.insertedId, ...doc };
      out.push('added ' + d.field);
    }
    const linked = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: cf._id }).select('_id').lean();
    if (!linked) {
      const reg = await M77Field.find({ name: new RegExp('^' + esc(d.opsName.trim()) + '$', 'i'), $or: [{ legacyId: null }, { legacyId: { $exists: false } }] }).select('_id irrigation').lean();
      if (reg.length === 1) {
        await M77Field.updateOne({ _id: reg[0]._id }, { $set: { legacySource: 'CroppingField', legacyId: cf._id } });
        out.push('linked ' + d.field + ' to registry field ' + d.opsName);
      }
    }
  }
  return out;
}

// One time: 73 and 77 irrigated, every other field dryland, on the cards and
// the registry. Later changes on the site are left alone.
async function applyIrrigation() {
  if (await AppliedUpdate.exists({ key: DATA.irrigationKey })) return [];
  const objSoil = { soil: { $type: 'object' } };
  const on = await CroppingField.updateMany({ ...objSoil, field: DATA.irrigated }, { $set: { 'soil.irrigated': true } });
  const off = await CroppingField.updateMany({ ...objSoil, field: { $not: DATA.irrigated }, 'soil.irrigated': true }, { $set: { 'soil.irrigated': false } });
  const cards = await CroppingField.find({ field: DATA.irrigated }).select('_id').lean();
  const ids = cards.map(c => c._id);
  const regOn = await M77Field.updateMany({ legacySource: 'CroppingField', legacyId: { $in: ids }, irrigation: { $ne: 'pivot' } }, { $set: { irrigation: 'pivot' } });
  // Only M77's own field cards; custom-farmed fields for other operators are left alone.
  const regOff = await M77Field.updateMany({ legacySource: 'CroppingField', legacyId: { $nin: ids }, irrigation: { $nin: ['dryland', 'none', null] } }, { $set: { irrigation: 'dryland' } });
  const line = `${DATA.irrigationKey}: ${on.modifiedCount} cards set irrigated, ${off.modifiedCount} set dryland; registry ${regOn.modifiedCount} pivot, ${regOff.modifiedCount} dryland`;
  await AppliedUpdate.create({ key: DATA.irrigationKey, summary: [line] });
  return [line];
}

module.exports = { addLuekingFields, applyIrrigation };
