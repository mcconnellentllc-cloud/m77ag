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

module.exports = { applyLeaseTerms };
