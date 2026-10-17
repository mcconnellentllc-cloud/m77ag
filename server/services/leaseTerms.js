const AppliedUpdate = require('../models/appliedUpdate');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');
const CroppingField = require('../models/croppingField');
const TERMS = require('../data/leaseTerms');

// Applies the farm lease terms once to farms, the field registry and the
// Field Records cards. Uses direct updates so a legacy validation problem
// elsewhere on a record cannot block it.
async function applyLeaseTerms() {
  const out = [];
  if (!(await AppliedUpdate.exists({ key: TERMS.key }))) out.push(...(await applyFarmTerms()));
  for (const u of TERMS.followUps || []) {
    if (await AppliedUpdate.exists({ key: u.key })) continue;
    const blank = { $in: [null, ''] };
    const cards = await CroppingField.updateMany({ farm: u.farm, field: u.match, 'lease.landlord': blank }, { $set: { 'lease.landlord': u.landlord } });
    const farm = await M77Farm.findOne({ name: u.farm }).select('_id').lean();
    const regs = farm ? await M77Field.updateMany({ farm: farm._id, name: u.match, landlordName: blank }, { $set: { landlordName: u.landlord } }) : { modifiedCount: 0 };
    const line = `${u.key}: landlord ${u.landlord} on ${cards.modifiedCount} cards, ${regs.modifiedCount} registry fields`;
    await AppliedUpdate.create({ key: u.key, summary: [line] });
    out.push(line);
  }
  out.push(...(await fillBlanks()));
  for (const r of TERMS.rents || []) {
    if (await AppliedUpdate.exists({ key: r.key })) continue;
    const lines = [];
    for (const l of r.lines) {
      const rent = Math.round(l.acres * l.rate * 100) / 100;
      const owed = Math.round((rent - l.paid) * 100) / 100;
      const note = l.note || `${r.year} cash rent (${r.source}): workbook line "${l.workbook}", ${l.acres} ac at $${l.rate.toFixed(2)}/ac = $${rent.toFixed(2)}, ` +
        `paid $${l.paid.toFixed(2)}${owed > 0 ? `, owed $${owed.toFixed(2)}` : ', paid in full'}.`;
      const res = await CroppingField.updateMany({ farm: r.farm, field: l.match },
        { $set: { 'lease.type': 'cash-rent', 'lease.rentPerAcre': l.rate, 'lease.terms': note } });
      lines.push(`${l.workbook}: $${l.rate}/ac on ${res.modifiedCount} cards`);
    }
    await AppliedUpdate.create({ key: r.key, summary: lines });
    out.push(`${r.key}: ` + lines.join('; '));
  }
  return out;
}

// Landlord a card on this farm gets when none is entered: the field's own
// landlord (MEFARMS), else the farm's from the follow-ups or the farm terms.
function defaultLandlord(farmTerms, fieldName) {
  const hit = (farmTerms.fieldLandlords || []).find(l => l.match.test(fieldName || ''));
  if (hit) return hit.landlord;
  if (farmTerms.fieldLandlords) return '';
  const fu = (TERMS.followUps || []).find(u => u.farm === farmTerms.name && String(u.match) === '/./');
  return fu ? fu.landlord : (farmTerms.farmLandlord || '');
}

// Every start: fill lease type, landlord share and landlord on cards and
// registry fields that are still blank, from the farm terms. Values entered
// by hand are never changed. Cards added or renamed after the one-time
// updates get the same terms as the rest of their farm.
async function fillBlanks() {
  const isBlank = v => v === undefined || v === null || String(v).trim() === '';
  let cardsFilled = 0; let regsFilled = 0;
  const stillBlank = [];
  for (const f of TERMS.farms) {
    const share = f.type === 'crop-share' ? Math.round(f.landlordShare * 100) : null;
    const cards = await CroppingField.find({ farm: f.name }).select('field lease').lean();
    for (const c of cards) {
      const lease = c.lease || {};
      const set = {};
      if (isBlank(lease.type)) set['lease.type'] = f.type;
      const type = set['lease.type'] || lease.type;
      if (type === 'crop-share' && share !== null && (lease.sharePercentage === undefined || lease.sharePercentage === null)) set['lease.sharePercentage'] = share;
      if (isBlank(lease.landlord)) {
        const ll = defaultLandlord(f, c.field);
        if (ll) set['lease.landlord'] = ll;
        else stillBlank.push(`${f.name} ${c.field}`);
      }
      if (Object.keys(set).length) { await CroppingField.updateOne({ _id: c._id }, { $set: set }); cardsFilled++; }
    }
    const farm = await M77Farm.findOne({ name: f.name }).select('_id').lean();
    if (farm) {
      // Registry fields still at the defaults (owner M77, no landlord) get the farm terms.
      const regs = await M77Field.find({ farm: farm._id, owner: { $in: [null, 'm77'] }, landlordName: { $in: [null, ''] } }).select('name').lean();
      for (const r of regs) {
        const set = f.type === 'crop-share'
          ? { owner: 'shared', m77SharePercent: 100 - share, landlordSharePercent: share }
          : { owner: 'landlord', m77SharePercent: 100, landlordSharePercent: 0 };
        const ll = defaultLandlord(f, r.name);
        if (ll) set.landlordName = ll;
        await M77Field.updateOne({ _id: r._id }, { $set: set });
        regsFilled++;
      }
    }
  }
  for (const o of TERMS.otherFarms || []) {
    const r = await CroppingField.updateMany({ farm: o.name, 'lease.landlord': { $in: [null, ''] } }, { $set: { 'lease.landlord': o.landlord } });
    cardsFilled += r.modifiedCount;
  }
  const out = [];
  if (cardsFilled || regsFilled) out.push(`lease blanks filled: ${cardsFilled} cards, ${regsFilled} registry fields`);
  if (stillBlank.length) out.push(`landlord not on file: ${stillBlank.join(', ')}`);
  return out;
}

async function applyFarmTerms() {
  const summary = [];
  for (const f of TERMS.farms) {
    const farm = await M77Farm.findOne({ name: f.name }).lean();
    const share = f.type === 'crop-share' ? f.landlordShare : 0;
    let farmLandlord = farm ? farm.landlordName : '';
    if (farm) {
      const set = { type: f.type, defaultShare: share };
      if (f.farmLandlord && (!farm.landlordName || (f.farmLandlordFrom || []).includes(farm.landlordName))) {
        set.landlordName = f.farmLandlord; farmLandlord = f.farmLandlord;
      }
      await M77Farm.updateOne({ _id: farm._id }, { $set: set });
    }
    const landlordFor = name => {
      const hit = (f.fieldLandlords || []).find(l => l.match.test(name || ''));
      if (hit) return hit.landlord;
      return f.fieldLandlords ? '' : farmLandlord; // farms with per-field landlords: unknown stays blank
    };

    // Field registry (Field Setup)
    let regCount = 0;
    if (farm) {
      const regs = await M77Field.find({ farm: farm._id }).select('name landlordName').lean();
      for (const r of regs) {
        const set = f.type === 'crop-share'
          ? { owner: 'shared', m77SharePercent: Math.round((1 - share) * 100), landlordSharePercent: Math.round(share * 100) }
          : { owner: 'landlord', m77SharePercent: 100, landlordSharePercent: 0 };
        const ll = landlordFor(r.name);
        if (ll) set.landlordName = ll;
        await M77Field.updateOne({ _id: r._id }, { $set: set });
        regCount++;
      }
    }

    // Field Records cards
    const cards = await CroppingField.find({ farm: f.name }).select('field').lean();
    for (const c of cards) {
      const set = { 'lease.type': f.type };
      const unset = {};
      if (f.type === 'crop-share') set['lease.sharePercentage'] = Math.round(share * 100);
      else unset['lease.sharePercentage'] = '';
      const ll = landlordFor(c.field);
      if (ll) set['lease.landlord'] = ll;
      await CroppingField.updateOne({ _id: c._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    }
    summary.push(`${f.name}: ${f.type}${f.type === 'crop-share' ? ' ' + Math.round((1 - share) * 100) + '/' + Math.round(share * 100) : ''}, ${cards.length} cards, ${regCount} registry fields${farm ? '' : ' (farm record not found)'}`);
  }
  await AppliedUpdate.create({ key: TERMS.key, summary });
  return summary;
}

module.exports = { applyLeaseTerms, fillBlanks };
