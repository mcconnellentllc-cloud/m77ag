const FieldInsurance = require('../models/fieldInsurance');
const M77Field = require('../models/m77Field');
const claim2026Wheat = require('../data/rcisWheat2026Claim');

// Claims on file that can be attached to field cards, keyed by id.
const CLAIMS = {
  'rcis-2026-wheat': claim2026Wheat
};

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
    res.json({ success: true, data: entries });
  } catch (err) {
    console.error('List field insurance error:', err);
    res.status(500).json({ success: false, message: 'Failed to load crop insurance' });
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

    const info = await fieldSnapshot(m77Field);
    if (!info) return res.status(404).json({ success: false, message: 'Field not found' });

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
      source: POLICY.source,
      ...unitData
    };

    const existing = await FieldInsurance.findOne({
      policyNumber: POLICY.policyNumber, unitNumber, cropYear: POLICY.cropYear, crop: POLICY.crop
    });
    let entry;
    if (existing) {
      // Keep a landlord share someone already set, unless the unit moved to another field.
      const moved = String(existing.m77Field) !== String(info.field._id);
      existing.set(doc);
      if (moved) existing.landlordShare = info.landlordShare;
      entry = await existing.save();
    } else {
      entry = await FieldInsurance.create({ ...doc, landlordShare: info.landlordShare, createdBy: req.userId });
    }
    res.status(existing ? 200 : 201).json({ success: true, data: entry, message: `Unit ${unitNumber} attached to ${info.field.name}` });
  } catch (err) {
    console.error('Attach insurance unit error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to attach the unit' });
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
