const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const M77Farm = require('../models/m77Farm');
const AppliedUpdate = require('../models/appliedUpdate');
const UPDATES = require('../data/fieldRecordUpdates');

const empty = v => v === undefined || v === null || v === '';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Collections that point at an M77Field: [model, path].
function m77Refs() {
  return [
    ['FieldOperation', 'm77Field'], ['FieldInsurance', 'm77Field'], ['SeedCostShare', 'm77Field'],
    ['CustomWork', 'm77Field'], ['JdSyncReview', 'm77FieldId'], ['JdSyncRun', 'm77FieldId'], ['Invoice', 'items.m77Field']
  ].map(([name, path]) => {
    try { return [require('mongoose').model(name), path]; } catch (e) { return null; }
  }).filter(Boolean);
}

async function applyFieldRecordUpdates() {
  const results = [];
  for (const u of UPDATES) {
    const oldCf = await CroppingField.findOne({ field: u.from, ...(u.farm ? { farm: u.farm } : {}) });
    if (!oldCf) continue; // already corrected
    const newCf = await CroppingField.findOne({ field: new RegExp('^' + esc(u.to) + '$', 'i'), _id: { $ne: oldCf._id } });
    const oldName = oldCf.field;

    if (!newCf) {
      // Rename in place; everything linked to this record keeps its link.
      // Direct updates, so an unrelated legacy validation problem cannot block the rename.
      const set = { field: u.to };
      Object.entries(u.fill || {}).forEach(([k, v]) => { if (empty(oldCf[k])) set[k] = v; });
      await CroppingField.updateOne({ _id: oldCf._id }, { $set: set });
      const reg = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: oldCf._id }).lean();
      if (reg && reg.name !== u.to) {
        const rset = { name: u.to };
        if (empty(reg.acres) && u.fill && u.fill.acres) rset.acres = u.fill.acres;
        await M77Field.updateOne({ _id: reg._id }, { $set: rset });
      }
      results.push(`${u.key}: renamed ${oldName} to ${u.to}`);
      continue;
    }

    // Both exist: fill the corrected record's gaps from the old one, move links, remove the old one.
    const copy = ['acres', 'legal', 'fsaFarm', 'tract', 'county', 'section', 'township', 'range',
      'crop2025', 'crop2026', 'crop2027', 'crop2028', 'crop2029', 'crop2030'];
    const set = {};
    copy.forEach(k => { if (empty(newCf[k]) && !empty(oldCf[k])) set[k] = oldCf[k]; });
    const years = new Set((newCf.cropHistory || []).map(h => h.year));
    const addHistory = (oldCf.cropHistory || []).filter(h => !years.has(h.year)).map(h => (h.toObject ? h.toObject() : h));
    const upd = {};
    if (Object.keys(set).length) upd.$set = set;
    if (addHistory.length) upd.$push = { cropHistory: { $each: addHistory } };
    if (Object.keys(upd).length) await CroppingField.updateOne({ _id: newCf._id }, upd);

    const oldReg = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: oldCf._id }).lean();
    const newReg = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: newCf._id }).lean();
    if (oldReg && newReg) {
      for (const [Model, path] of m77Refs()) {
        if (path.includes('.')) {
          await Model.updateMany({ [path]: oldReg._id }, { $set: { [path.replace('.', '.$[x].')]: newReg._id } }, { arrayFilters: [{ ['x.' + path.split('.')[1]]: oldReg._id }] });
        } else {
          await Model.updateMany({ [path]: oldReg._id }, { $set: { [path]: newReg._id } });
        }
      }
      await M77Field.deleteOne({ _id: oldReg._id });
    } else if (oldReg && !newReg) {
      await M77Field.updateOne({ _id: oldReg._id }, { $set: { legacyId: newCf._id, name: u.to } });
    }
    await require('../models/cropExpense').updateMany({ 'fields.fieldId': oldCf._id }, { $set: { 'fields.$[x].fieldId': newCf._id } }, { arrayFilters: [{ 'x.fieldId': oldCf._id }] });
    await CroppingField.deleteOne({ _id: oldCf._id });
    results.push(`${u.key}: merged ${oldName} into ${newCf.field}`);
  }
  for (const mv of UPDATES.farmMoves || []) {
    if (await AppliedUpdate.findOne({ key: mv.key })) continue;
    const cards = await CroppingField.find({ field: mv.match }).select('field farm').lean();
    const farm = await M77Farm.findOne({ name: mv.farm }).select('_id client').lean();
    const lines = [];
    for (const cf of cards) {
      await CroppingField.updateOne({ _id: cf._id }, { $set: {
        farm: mv.farm, 'lease.type': 'crop-share', 'lease.landlord': mv.landlord, 'lease.sharePercentage': mv.sharePercentage
      } });
      const regSet = { rotationGroup: mv.farm, landlordName: mv.landlord };
      if (farm) { regSet.farm = farm._id; if (farm.client) regSet.client = farm.client; }
      await M77Field.updateOne({ legacySource: 'CroppingField', legacyId: cf._id }, { $set: regSet });
      lines.push(`${cf.field}: ${cf.farm} -> ${mv.farm}, landlord ${mv.landlord} ${mv.sharePercentage}%`);
    }
    // Recorded only once the card exists, so a move waits for a rename that runs later.
    if (!cards.length) continue;
    await AppliedUpdate.create({ key: mv.key, summary: lines });
    results.push(`${mv.key}: ${lines.join('; ')}`);
  }
  for (const cs of UPDATES.cropSets || []) {
    if (await AppliedUpdate.findOne({ key: cs.key })) continue;
    const slot = 'crop' + cs.year;
    const cards = await CroppingField.find({ field: cs.match }).select('field ' + slot).lean();
    if (!cards.length) continue;
    const lines = [];
    for (const cf of cards) {
      if (cf[slot]) { lines.push(`${cf.field}: ${cs.year} already ${cf[slot]}, left as is`); continue; }
      await CroppingField.updateOne({ _id: cf._id }, { $set: { [slot]: cs.crop } });
      lines.push(`${cf.field}: ${cs.year} crop set to ${cs.crop}`);
    }
    await AppliedUpdate.create({ key: cs.key, summary: lines });
    results.push(`${cs.key}: ${lines.join('; ')}`);
  }
  return results;
}

module.exports = { applyFieldRecordUpdates };
