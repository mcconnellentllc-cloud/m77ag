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
        excludeFromFinancials: true,
        financialNote: DATA.financialNote,
        soil: { irrigated: !!d.irrigated, samples: [] },
        notes: (d.acresNote || 'Acres are 2026 seeded acres from Operations Center until FSA acres are on file.') + (d.note ? ' ' + d.note : '')
      };
      if (d.crop2026) doc.crop2026 = d.crop2026;
      // Raw insert: the card holds only what is known; later edits validate as usual.
      const r = await CroppingField.collection.insertOne({ client: 'MCC. ENT.', ...doc, cropHistory: [], createdAt: new Date(), updatedAt: new Date() });
      cf = { _id: r.insertedId, ...doc };
      out.push('added ' + d.field);
    }
    const linked = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: cf._id }).select('_id').lean();
    if (!linked) {
      const nameMatch = d.opsMatch || new RegExp('^' + esc(d.opsName.trim()) + '$', 'i');
      const reg = await M77Field.find({ name: nameMatch, $or: [{ legacyId: null }, { legacyId: { $exists: false } }] }).select('_id name').lean();
      if (reg.length === 1) {
        await M77Field.updateOne({ _id: reg[0]._id }, { $set: { legacySource: 'CroppingField', legacyId: cf._id, enterprise: 'Lueking' } });
        out.push('linked ' + d.field + ' to registry field ' + reg[0].name);
      }
    }
  }
  out.push(...(await applyCorrection()));
  out.push(...(await applySplit75()));
  return out;
}

// One time: cards added before the arrangement was recorded carried a crop
// share with Allphin Farms as landlord, and 73.C.SW as sorghum. Corrects
// those values only where they are still as first written.
async function applyCorrection() {
  if (await AppliedUpdate.exists({ key: DATA.correctionKey })) return [];
  const names = DATA.fields.map(d => new RegExp('^' + esc(d.field) + '$', 'i'));
  const flag = await CroppingField.updateMany({ farm: DATA.farm, field: { $in: names } }, { $set: { excludeFromFinancials: true, financialNote: DATA.financialNote } });
  const lease = await CroppingField.updateMany({ farm: DATA.farm, 'lease.type': 'crop-share', 'lease.landlord': 'Allphin Farms' }, { $unset: { lease: '' } });
  const crop = await CroppingField.updateOne({ farm: DATA.farm, field: /^73\.C\.SW\b/i, crop2026: 'SORGHUM' }, { $set: { crop2026: 'SORGHUM SUDAN' } });
  // Registry fields linked to these cards are booked under Lueking, not M77 AG.
  const ids = (await CroppingField.find({ farm: DATA.farm }).select('_id').lean()).map(c => c._id);
  const reg = await M77Field.updateMany({ legacySource: 'CroppingField', legacyId: { $in: ids }, enterprise: { $ne: 'Lueking' } }, { $set: { enterprise: 'Lueking' } });
  const line = `${DATA.correctionKey}: ${flag.modifiedCount} cards marked no M77 financial tie, crop-share lease removed from ${lease.modifiedCount}, 73.C.SW sorghum sudan ${crop.modifiedCount ? 'set' : 'already set'}, ${reg.modifiedCount} registry fields moved to the Lueking enterprise`;
  await AppliedUpdate.create({ key: DATA.correctionKey, summary: [line] });
  return [line];
}

// One time: the first 75.E card covered all of field 75 (112.5 ac, no
// crop). It becomes the east half, corn; 75.W is its own card.
async function applySplit75() {
  if (await AppliedUpdate.exists({ key: DATA.split75Key })) return [];
  const e = DATA.fields.find(d => /^75\.E/.test(d.field));
  const set = {};
  const cf = await CroppingField.findOne({ farm: DATA.farm, field: /^75\.E\b/i }).lean();
  if (cf) {
    if (cf.acres === 112.5) set.acres = e.acres;
    if (!cf.crop2026) set.crop2026 = e.crop2026;
    if (/2026 split/.test(cf.notes || '')) set.notes = e.acresNote;
    if (Object.keys(set).length) await CroppingField.updateOne({ _id: cf._id }, { $set: set });
  }
  const line = `${DATA.split75Key}: 75.E ${cf ? 'updated ' + (Object.keys(set).join(', ') || 'nothing') : 'not found'}`;
  await AppliedUpdate.create({ key: DATA.split75Key, summary: [line] });
  return [line];
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
