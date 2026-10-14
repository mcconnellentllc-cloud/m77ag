const mongoose = require('mongoose');
const User = require('../models/user');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');
const CroppingField = require('../models/croppingField');
const FieldOperation = require('../models/fieldOperation');
const FieldInsurance = require('../models/fieldInsurance');
const SeedCostShare = require('../models/seedCostShare');

const STAFF_ROLES = ['admin', 'employee'];
const NON_CROP = ['PASTURE', 'WASTE', 'BUILDING SITE', 'FALLOW', 'CRP', 'GRASS'];

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

function isSet(v) {
  return v !== null && v !== undefined;
}

// Farms the requesting user may see. Staff see every crop-share landlord
// farm. A landlord sees a farm when they are listed on M77Farm.landlordUsers
// or the farm code is on their User.landlordFarms.
async function visibleFarms(req) {
  if (STAFF_ROLES.includes(req.userRole)) {
    return M77Farm.find({
      type: 'crop-share',
      $or: [{ defaultShare: { $gt: 0 } }, { 'landlordUsers.0': { $exists: true } }]
    }).sort({ landlordName: 1, name: 1 }).lean();
  }
  if (req.userRole !== 'landlord') return null;
  const user = await User.findById(req.userId).select('landlordFarms').lean();
  const codes = (user && user.landlordFarms) || [];
  return M77Farm.find({
    $or: [{ landlordUsers: req.userId }, { name: { $in: codes } }]
  }).sort({ landlordName: 1, name: 1 }).lean();
}

// Crop on a field for a harvest year: CroppingField crop-by-year first, then
// the M77Field 2026 crop, then crop history.
function cropFor(field, cropping, year) {
  if (cropping && cropping['crop' + year]) return cropping['crop' + year];
  if (year === 2026 && field.crop2026) return field.crop2026;
  const h = cropping && (cropping.cropHistory || []).find(x => x.year === year);
  return h && h.crop ? h.crop : '';
}

function fieldShare(field, farm) {
  if (isSet(field.shareOverride)) return field.shareOverride;
  return farm.type === 'crop-share' ? (farm.defaultShare || 0) : 0;
}

// GET /api/landlord-summary?cropYear=2026&farm=<M77Farm id>
exports.getSummary = async (req, res) => {
  try {
    const cropYear = parseInt(req.query.cropYear, 10) || new Date().getFullYear();
    if (cropYear < 2000 || cropYear > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid crop year' });
    }
    const staff = STAFF_ROLES.includes(req.userRole);

    let farms = await visibleFarms(req);
    if (!farms) {
      return res.status(403).json({ success: false, message: 'Landlord access required' });
    }
    if (req.query.farm) {
      if (!mongoose.Types.ObjectId.isValid(req.query.farm)) {
        return res.status(400).json({ success: false, message: 'Invalid farm id' });
      }
      farms = farms.filter(f => String(f._id) === String(req.query.farm));
      if (!farms.length) {
        return res.status(403).json({ success: false, message: 'You do not have access to this farm' });
      }
    }

    const farmIds = farms.map(f => f._id);
    const fields = await M77Field.find({ farm: { $in: farmIds } })
      .select('name acres county farm crop2026 shareOverride legacySource legacyId')
      .sort({ name: 1 })
      .lean();
    const fieldIds = fields.map(f => f._id);

    const legacyIds = fields
      .filter(f => f.legacySource === 'CroppingField' && f.legacyId)
      .map(f => f.legacyId)
      .filter(id => mongoose.Types.ObjectId.isValid(String(id)));

    const [croppings, operations, insurance, seed] = await Promise.all([
      CroppingField.find({ _id: { $in: legacyIds } })
        .select('crop2025 crop2026 crop2027 crop2028 crop2029 crop2030 cropHistory.year cropHistory.crop')
        .lean(),
      FieldOperation.find({ m77Field: { $in: fieldIds }, cropYear })
        .sort({ startDate: 1 })
        .lean(),
      FieldInsurance.find({ m77Field: { $in: fieldIds }, cropYear }).lean(),
      SeedCostShare.find({ m77Field: { $in: fieldIds }, cropYear })
    ]);

    const croppingById = {};
    for (const c of croppings) croppingById[String(c._id)] = c;
    const group = (list) => {
      const out = {};
      for (const x of list) (out[String(x.m77Field)] = out[String(x.m77Field)] || []).push(x);
      return out;
    };
    const opsBy = group(operations);
    const insBy = group(insurance);
    const seedBy = group(seed);

    const farmOut = farms.map(farm => ({
      id: farm._id,
      name: farm.name,
      landlordName: farm.landlordName,
      type: farm.type,
      defaultShare: farm.defaultShare || 0,
      totals: {
        fields: 0, acres: 0, cropAcres: 0,
        harvestBu: 0, landlordBu: 0,
        insurancePayable: 0, landlordInsurance: 0,
        seedLandlordAmount: 0, seedBilled: 0, seedUnbilled: 0, seedUnpriced: 0,
        passesCompleted: 0, passesPlanned: 0
      },
      cropMix: {},
      fields: []
    }));
    const farmById = {};
    farmOut.forEach((f, i) => { farmById[String(farms[i]._id)] = { out: f, doc: farms[i] }; });

    for (const field of fields) {
      const entry = farmById[String(field.farm)];
      if (!entry) continue;
      const { out, doc } = entry;
      const share = fieldShare(field, doc);
      const cropping = field.legacyId ? croppingById[String(field.legacyId)] : null;
      const crop = (cropFor(field, cropping, cropYear) || '').toUpperCase();
      const acres = field.acres || 0;

      const ops = (opsBy[String(field._id)] || []).map(o => ({
        id: o._id,
        type: o.type,
        status: o.status,
        title: o.title,
        crop: o.crop,
        startDate: o.startDate,
        endDate: o.endDate,
        acres: o.acres,
        variety: o.variety,
        seedLbPerAcre: o.seedLbPerAcre,
        products: (o.products || []).map(p => ({ name: p.name, rate: p.rate, rateUnit: p.rateUnit })),
        netBu: o.netBu,
        tickets: o.type === 'harvest'
          ? (o.tickets || []).map(t => ({ ticketNo: t.ticketNo, date: t.date, elevator: t.elevator, netBu: t.netBu, moisture: t.moisture, testWeight: t.testWeight, protein: t.protein }))
          : undefined,
        notes: staff ? o.notes : undefined
      }));
      const harvestBu = round2(ops
        .filter(o => o.type === 'harvest' && o.status === 'completed')
        .reduce((s, o) => s + (o.netBu || 0), 0));
      const landlordBu = round2(harvestBu * share);

      const ins = (insBy[String(field._id)] || []).map(i => {
        const payable = i.totalPayable || 0;
        const lShare = isSet(i.landlordShare) ? i.landlordShare : share;
        const row = {
          id: i._id,
          crop: i.crop,
          unitNumber: i.unitNumber,
          plan: i.plan,
          coverageLevel: i.coverageLevel,
          insuredAcres: i.insuredAcres,
          aph: i.aph,
          guaranteeBuPerAcre: i.guaranteeBuPerAcre,
          productionToCountBu: i.productionToCountBu,
          insuredShare: i.insuredShare,
          totalPayable: payable,
          landlordShare: lShare,
          landlordAmount: round2(payable * lShare),
          claimDate: i.claimDate
        };
        if (staff) {
          Object.assign(row, {
            company: i.company, policyNumber: i.policyNumber, claimNumber: i.claimNumber,
            checkNumber: i.checkNumber, notes: i.notes
          });
        }
        return row;
      });
      const insurancePayable = round2(ins.reduce((s, i) => s + i.totalPayable, 0));
      const landlordInsurance = round2(ins.reduce((s, i) => s + i.landlordAmount, 0));

      const seedRows = (seedBy[String(field._id)] || []).map(s => ({
        id: s._id,
        season: s.season,
        product: s.product,
        quantityLb: s.quantityLb,
        bushels: s.bushels,
        estimated: s.estimated,
        priced: s.priced,
        totalCost: s.totalCost,
        landlordShare: s.landlordShare,
        landlordAmount: s.landlordAmount,
        statementNumber: s.statementNumber || null
      }));

      const f = {
        id: field._id,
        name: field.name,
        acres,
        county: field.county,
        crop,
        share,
        harvestBu,
        landlordBu,
        insurancePayable,
        landlordInsurance,
        operations: ops,
        insurance: ins,
        seed: seedRows
      };
      out.fields.push(f);

      const t = out.totals;
      t.fields += 1;
      t.acres += acres;
      if (crop && !NON_CROP.includes(crop)) t.cropAcres += acres;
      out.cropMix[crop || 'UNASSIGNED'] = round2((out.cropMix[crop || 'UNASSIGNED'] || 0) + acres);
      t.harvestBu += harvestBu;
      t.landlordBu += landlordBu;
      t.insurancePayable += insurancePayable;
      t.landlordInsurance += landlordInsurance;
      for (const s of seedRows) {
        if (!s.priced) { t.seedUnpriced += 1; continue; }
        t.seedLandlordAmount += s.landlordAmount;
        if (s.statementNumber) t.seedBilled += s.landlordAmount;
        else t.seedUnbilled += s.landlordAmount;
      }
      for (const o of ops) {
        if (o.status === 'completed') t.passesCompleted += 1;
        else t.passesPlanned += 1;
      }
    }

    const grand = {
      farms: farmOut.length, fields: 0, acres: 0, cropAcres: 0, harvestBu: 0, landlordBu: 0,
      insurancePayable: 0, landlordInsurance: 0, seedLandlordAmount: 0, seedBilled: 0, seedUnbilled: 0, seedUnpriced: 0
    };
    for (const f of farmOut) {
      for (const k of Object.keys(f.totals)) {
        if (k === 'fields' || k === 'seedUnpriced' || k.startsWith('passes')) continue;
        f.totals[k] = round2(f.totals[k]);
      }
      for (const k of Object.keys(grand)) {
        if (k !== 'farms') grand[k] = round2(grand[k] + (f.totals[k] || 0));
      }
    }

    res.json({
      success: true,
      data: { cropYear, scope: staff ? 'all' : 'landlord', totals: grand, farms: farmOut }
    });
  } catch (error) {
    console.error('Error building landlord summary:', error);
    res.status(500).json({ success: false, message: 'Failed to build landlord summary' });
  }
};

// Farm codes the legacy landlord portal reads from User.landlordFarms.
const LEGACY_FARM_CODES = ['LAFARMS', 'KBFARMS', 'PETERSON', 'HDFARMS', 'MEFARMS', 'A1FARMS'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/landlord-summary/access
// Landlord farms with the portal logins that can see each one.
exports.listAccess = async (req, res) => {
  try {
    const farms = await M77Farm.find({
      type: 'crop-share',
      $or: [{ defaultShare: { $gt: 0 } }, { 'landlordUsers.0': { $exists: true } }]
    }).sort({ landlordName: 1 }).populate('landlordUsers', 'name email phone isActive role').lean();
    const codes = farms.map(f => f.name).filter(n => LEGACY_FARM_CODES.includes(n));
    const legacy = await User.find({ role: 'landlord', landlordFarms: { $in: codes } })
      .select('name email phone isActive landlordFarms').lean();

    const data = farms.map(f => {
      const users = new Map();
      for (const u of f.landlordUsers || []) users.set(String(u._id), { ...u, linkedBy: 'farm' });
      for (const u of legacy) {
        if (!(u.landlordFarms || []).includes(f.name) || users.has(String(u._id))) continue;
        users.set(String(u._id), { ...u, linkedBy: 'user' });
      }
      return {
        id: f._id,
        name: f.name,
        landlordName: f.landlordName,
        defaultShare: f.defaultShare || 0,
        users: [...users.values()].map(u => ({
          id: u._id, name: u.name, email: u.email, phone: u.phone, isActive: u.isActive, linkedBy: u.linkedBy
        }))
      };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing landlord access:', error);
    res.status(500).json({ success: false, message: 'Failed to list landlord access' });
  }
};

// POST /api/landlord-summary/access { farm, email, name, phone, password }
// Grants a landlord login access to one farm. Creates the login when the
// email is new; an existing login must already have the landlord role.
exports.grantAccess = async (req, res) => {
  try {
    const { farm: farmId } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(farmId)) {
      return res.status(400).json({ success: false, message: 'Farm is required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }
    const farm = await M77Farm.findById(farmId);
    if (!farm || farm.type !== 'crop-share') {
      return res.status(404).json({ success: false, message: 'Landlord farm not found' });
    }

    let user = await User.findOne({ email });
    let created = false;
    if (user) {
      if (user.role !== 'landlord') {
        return res.status(409).json({
          success: false,
          message: `${email} is an existing ${user.role} login. Use a separate email for landlord portal access.`
        });
      }
    } else {
      const name = String(req.body.name || '').trim();
      const phone = String(req.body.phone || '').trim();
      const password = String(req.body.password || '');
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required for a new login' });
      }
      if (password.length < 10) {
        return res.status(400).json({ success: false, message: 'Temporary password must be at least 10 characters' });
      }
      user = new User({ name, email, phone, password, role: 'landlord', isActive: true, emailVerified: true });
      created = true;
    }

    if (LEGACY_FARM_CODES.includes(farm.name) && !(user.landlordFarms || []).includes(farm.name)) {
      user.landlordFarms = [...(user.landlordFarms || []), farm.name];
    }
    await user.save();
    await M77Farm.updateOne({ _id: farm._id }, { $addToSet: { landlordUsers: user._id } });

    res.json({
      success: true,
      data: { userId: user._id, farm: farm._id, created },
      message: created ? `Login created for ${email} with access to ${farm.name}` : `${email} now has access to ${farm.name}`
    });
  } catch (error) {
    console.error('Error granting landlord access:', error);
    res.status(500).json({ success: false, message: 'Failed to grant access' });
  }
};

// DELETE /api/landlord-summary/access/:farmId/:userId
// Removes one login's access to one farm. The login itself is kept.
exports.revokeAccess = async (req, res) => {
  try {
    const { farmId, userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(farmId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const farm = await M77Farm.findById(farmId);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    await M77Farm.updateOne({ _id: farm._id }, { $pull: { landlordUsers: userId } });
    await User.updateOne({ _id: userId, role: 'landlord' }, { $pull: { landlordFarms: farm.name } });
    res.json({ success: true, message: `Access to ${farm.name} removed` });
  } catch (error) {
    console.error('Error revoking landlord access:', error);
    res.status(500).json({ success: false, message: 'Failed to remove access' });
  }
};
