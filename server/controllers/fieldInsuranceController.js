const FieldInsurance = require('../models/fieldInsurance');
const M77Field = require('../models/m77Field');
const claim2026Wheat = require('../data/rcisWheat2026Claim');
const rh2025 = require('../data/rainHail2025Insurance');

// Policies and claims on file whose units can be attached to field cards, keyed by id.
const CLAIMS = {
  'rcis-2026-wheat': claim2026Wheat,
  'rh-2025-corn-m77': rh2025.M77_CORN,
  'rh-2025-wheat-m77': rh2025.M77_WHEAT,
  'rh-2025-corn-kyle': rh2025.KYLE_CORN,
  'rh-2025-wheat-kyle': rh2025.KYLE_WHEAT,
  'rh-2025-milo-me': rh2025.ME_MILO,
  'rh-2025-corn-me': rh2025.ME_CORN,
  'rh-2025-wheat-me': rh2025.ME_WHEAT
};
exports.CLAIMS = CLAIMS;

function isBlank(v) {
  return v === undefined || v === null || v === '';
}

async function fieldSnapshot(fieldId) {
  const field = await M77Field.findById(fieldId).populate('farm', 'name landlordName type defaultShare');
  if (!field) return null;
  const farm = field.farm;
  const share = field.shareOverride !== null && field.shareOverride !== undefined
    ? field.shareOverride
    : (farm && farm.type === 'crop-share' ? (farm.defaultShare || 0) : 0);
  return {
    field,
    snapshot: {
      m77Field: field._id,
      m77Farm: farm ? farm._id : undefined,
      fieldName: field.name,
      farmName: farm ? farm.name : '',
      landlordName: farm ? farm.landlordName : ''
    },
    landlordShare: share
  };
}

// GET /api/field-insurance?cropYear=&crop=&m77Field=
exports.listEntries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.cropYear) filter.cropYear = Number(req.query.cropYear);
    if (req.query.crop) filter.crop = String(req.query.crop).toUpperCase();
    if (req.query.m77Field) filter.m77Field = req.query.m77Field;
    const entries = await FieldInsurance.find(filter).sort({ fieldName: 1, unitNumber: 1 });
    // Field Manager cards are CroppingField records; M77Field keeps the link in legacyId.
    const fields = await M77Field.find({ _id: { $in: entries.map(e => e.m77Field) } }).select('legacySource legacyId');
    const legacy = {};
    for (const f of fields) {
      if (f.legacySource === 'CroppingField' && f.legacyId) legacy[String(f._id)] = String(f.legacyId);
    }
    const data = entries.map(e => ({ ...e.toJSON(), croppingFieldId: legacy[String(e.m77Field)] || null }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('List field insurance error:', err);
    res.status(500).json({ success: false, message: 'Failed to load crop insurance' });
  }
};

// GET /api/field-insurance/claims  All claims on file, each with its units.
exports.listClaims = async (req, res) => {
  try {
    const out = [];
    for (const [id, claim] of Object.entries(CLAIMS)) {
      const { POLICY, UNITS } = claim;
      const attached = await FieldInsurance.find({ policyNumber: POLICY.policyNumber, cropYear: POLICY.cropYear, crop: POLICY.crop })
        .select('unitNumber m77Field fieldName').lean();
      const byUnit = {};
      for (const a of attached) byUnit[a.unitNumber] = a;
      out.push({ id, policy: POLICY, units: UNITS.map(u => ({ ...u, attachedTo: byUnit[u.unitNumber] ? { m77Field: byUnit[u.unitNumber].m77Field, fieldName: byUnit[u.unitNumber].fieldName } : null })) });
    }
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('List insurance claims error:', err);
    res.status(500).json({ success: false, message: 'Failed to load the claims' });
  }
};

// GET /api/field-insurance/claims/:claimId
// The claim's units, each marked with the field it is attached to (if any).
exports.getClaim = async (req, res) => {
  const claim = CLAIMS[req.params.claimId];
  if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
  try {
    const { POLICY, UNITS } = claim;
    const attached = await FieldInsurance.find({
      policyNumber: POLICY.policyNumber, cropYear: POLICY.cropYear, crop: POLICY.crop
    }).select('unitNumber m77Field fieldName');
    const byUnit = {};
    for (const a of attached) byUnit[a.unitNumber] = a;
    res.json({
      success: true,
      data: {
        policy: POLICY,
        units: UNITS.map(u => ({
          ...u,
          attachedTo: byUnit[u.unitNumber]
            ? { m77Field: byUnit[u.unitNumber].m77Field, fieldName: byUnit[u.unitNumber].fieldName }
            : null
        }))
      }
    });
  } catch (err) {
    console.error('Get insurance claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to load the claim' });
  }
};

// Attaches one claim unit to a registry field (re-attaching moves it).
// Returns { entry, created, fieldName } or throws.
async function attachUnit(claim, unit, m77Field, userId) {
  const info = await fieldSnapshot(m77Field);
  if (!info) throw new Error('Field not found');
  const { POLICY } = claim;
  const { fieldHint, ...unitData } = unit;
  const doc = {
    ...info.snapshot,
    cropYear: POLICY.cropYear,
    crop: POLICY.crop,
    company: POLICY.company,
    policyNumber: POLICY.policyNumber,
    agent: POLICY.agent,
    plan: POLICY.plan,
    coverageLevel: POLICY.coverageLevel,
    projectedPrice: POLICY.projectedPrice,
    harvestPrice: POLICY.harvestPrice,
    claimNumber: POLICY.claimNumber,
    claimDate: POLICY.claimDate,
    checkNumber: POLICY.checkNumber,
    insuredName: POLICY.insuredName,
    source: POLICY.source,
    ...unitData
  };
  const existing = await FieldInsurance.findOne({
    policyNumber: POLICY.policyNumber, unitNumber: unit.unitNumber, cropYear: POLICY.cropYear, crop: POLICY.crop
  });
  let entry;
  if (existing) {
    // Keep a landlord share someone already set, unless the unit moved to another field.
    const moved = String(existing.m77Field) !== String(info.field._id);
    existing.set(doc);
    if (moved) existing.landlordShare = info.landlordShare;
    entry = await existing.save();
  } else {
    entry = await FieldInsurance.create({ ...doc, landlordShare: info.landlordShare, createdBy: userId });
  }
  return { entry, created: !existing, fieldName: info.field.name };
}
exports.attachUnit = attachUnit;

// POST /api/field-insurance/claims/:claimId/attach  Body: { unitNumber, m77Field }
// Attaches one unit of the claim to a field card. Re-attaching moves it.
exports.attachClaimUnit = async (req, res) => {
  const claim = CLAIMS[req.params.claimId];
  if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
  try {
    const { unitNumber, m77Field } = req.body || {};
    const unit = claim.UNITS.find(u => u.unitNumber === unitNumber);
    if (!unit) return res.status(400).json({ success: false, message: 'Unit not found on this claim' });
    if (!m77Field) return res.status(400).json({ success: false, message: 'Field is required' });
    const { entry, created, fieldName } = await attachUnit(claim, unit, m77Field, req.userId);
    res.status(created ? 201 : 200).json({ success: true, data: entry, message: `Unit ${unitNumber} attached to ${fieldName}` });
  } catch (err) {
    console.error('Attach insurance unit error:', err);
    res.status(err.message === 'Field not found' ? 404 : 400).json({ success: false, message: err.message || 'Failed to attach the unit' });
  }
};

// PUT /api/field-insurance/:id  Body: { landlordShare?, notes? }
exports.updateEntry = async (req, res) => {
  try {
    const entry = await FieldInsurance.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Insurance entry not found' });
    const b = req.body || {};
    if (!isBlank(b.landlordShare)) {
      const s = Number(b.landlordShare);
      if (!Number.isFinite(s) || s < 0 || s > 1) throw new Error('Landlord share must be between 0 and 1');
      entry.landlordShare = s;
    }
    if (b.notes !== undefined) entry.notes = b.notes;
    await entry.save();
    res.json({ success: true, data: entry, message: 'Insurance entry updated' });
  } catch (err) {
    console.error('Update field insurance error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update insurance entry' });
  }
};

// DELETE /api/field-insurance/:id  (detaches the unit from the field)
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await FieldInsurance.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Insurance entry not found' });
    await entry.deleteOne();
    res.json({ success: true, message: 'Insurance unit removed from the field' });
  } catch (err) {
    console.error('Delete field insurance error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove insurance entry' });
  }
};
