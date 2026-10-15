const FieldOperation = require('../models/fieldOperation');
const M77Field = require('../models/m77Field');
const season2026 = require('../data/season2026Records');
const operationCost = require('../services/operationCost');

const IMPORTS = {
  'season-2026': season2026
};

// "42.W E/2 N/4" -> { num: '42', suffix: 'W' }
function fieldNumber(name) {
  const m = String(name || '').trim().match(/^#?(\d+)(?:\.?([NSEW]{1,2}))?(?![\d])/i);
  return m ? { num: m[1], suffix: (m[2] || '').toUpperCase() } : null;
}

function matches(hint, name) {
  const h = fieldNumber(hint);
  if (!h) return String(name || '').trim().toLowerCase() === String(hint).trim().toLowerCase();
  const f = fieldNumber(name);
  if (!f || f.num !== h.num) return false;
  return !h.suffix || h.suffix === f.suffix;
}

// GET /api/field-operations?cropYear=&m77Field=
exports.listEntries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.cropYear) filter.cropYear = Number(req.query.cropYear);
    if (req.query.m77Field) filter.m77Field = req.query.m77Field;
    const entries = await FieldOperation.find(filter).sort({ startDate: 1, createdAt: 1 });
    // Field Manager cards are CroppingField records; M77Field keeps the link in legacyId.
    const fields = await M77Field.find({ _id: { $in: [...new Set(entries.map(e => String(e.m77Field)))] } }).select('legacySource legacyId acres');
    const legacy = {};
    for (const f of fields) {
      if (f.legacySource === 'CroppingField' && f.legacyId) legacy[String(f._id)] = String(f.legacyId);
    }
    res.json({ success: true, data: entries.map(e => ({ ...e.toJSON(), croppingFieldId: legacy[String(e.m77Field)] || null })) });
  } catch (err) {
    console.error('List field operations error:', err);
    res.status(500).json({ success: false, message: 'Failed to load field records' });
  }
};

// GET /api/field-operations/imports/:importId
// Each prepared record with the card it is already on, or the suggested card.
exports.getImport = async (req, res) => {
  const imp = IMPORTS[req.params.importId];
  if (!imp) return res.status(404).json({ success: false, message: 'Import not found' });
  try {
    const fields = await M77Field.find({}).select('name acres farm').populate('farm', 'name').sort({ name: 1 });
    const done = await FieldOperation.find({ sourceKey: { $in: imp.RECORDS.map(r => req.params.importId + ':' + r.key) } })
      .select('sourceKey sourceRev m77Field fieldName');
    const doneByKey = {};
    for (const d of done) doneByKey[d.sourceKey] = d;
    const records = imp.RECORDS.map(r => {
      const d = doneByKey[req.params.importId + ':' + r.key];
      const candidates = fields.filter(f => matches(r.fieldHint, f.name));
      return {
        ...r,
        addedTo: d ? { m77Field: d.m77Field, fieldName: d.fieldName } : null,
        outdated: !!d && (d.sourceRev || 1) < (r.rev || 1),
        suggested: candidates.length === 1 ? String(candidates[0]._id) : null,
        candidateCount: candidates.length
      };
    });
    res.json({
      success: true,
      data: {
        records,
        fields: fields.map(f => ({ _id: f._id, name: f.name, acres: f.acres, farmName: f.farm ? f.farm.name : '' }))
      }
    });
  } catch (err) {
    console.error('Get field record import error:', err);
    res.status(500).json({ success: false, message: 'Failed to load the records' });
  }
};

// POST /api/field-operations/imports/:importId  Body: { assignments: [{ key, m77Field }] }
// Adds (or moves) each record to the confirmed card.
exports.applyImport = async (req, res) => {
  const imp = IMPORTS[req.params.importId];
  if (!imp) return res.status(404).json({ success: false, message: 'Import not found' });
  try {
    const assignments = Array.isArray(req.body && req.body.assignments) ? req.body.assignments : [];
    if (!assignments.length) return res.status(400).json({ success: false, message: 'Pick at least one record to add' });
    const byKey = {};
    for (const r of imp.RECORDS) byKey[r.key] = r;
    const fieldIds = Array.from(new Set(assignments.map(a => a.m77Field).filter(Boolean)));
    const fields = await M77Field.find({ _id: { $in: fieldIds } }).populate('farm', 'name');
    const fieldById = {};
    for (const f of fields) fieldById[String(f._id)] = f;

    let added = 0;
    const errors = [];
    for (const a of assignments) {
      const rec = byKey[a.key];
      const field = fieldById[String(a.m77Field)];
      if (!rec) { errors.push(a.key + ': record not found'); continue; }
      if (!field) { errors.push(a.key + ': field not found'); continue; }
      const { key, fieldHint, rev, ...data } = rec;
      const sourceKey = req.params.importId + ':' + key;
      await FieldOperation.findOneAndUpdate(
        { sourceKey },
        { ...data, sourceKey, sourceRev: rev || 1, m77Field: field._id, fieldName: field.name, farmName: field.farm ? field.farm.name : '', createdBy: req.userId },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      added += 1;
    }
    res.json({
      success: errors.length === 0,
      data: { added, errors },
      message: `${added} record${added === 1 ? '' : 's'} added to field cards` + (errors.length ? `; ${errors.length} not added` : '')
    });
  } catch (err) {
    console.error('Apply field record import error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to add the records' });
  }
};

// DELETE /api/field-operations/:id
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await FieldOperation.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Record not found' });
    await entry.deleteOne();
    res.json({ success: true, message: 'Record removed from the field' });
  } catch (err) {
    console.error('Delete field operation error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove the record' });
  }
};

// POST /api/field-operations/costs/apply  Body: { recost: false }
// Costs every completed pass that has no cost yet, using the default rate
// for its type and crop. Hand-picked rates are never changed. recost: true
// also refreshes default-rate costs (for example after acres were corrected).
exports.applyCosts = async (req, res) => {
  try {
    const recost = req.body && req.body.recost === true;
    const ops = await FieldOperation.find({ status: 'completed' });
    let costed = 0;
    const skipped = [];
    for (const op of ops) {
      const has = op.cost && op.cost.rateKey;
      if (has && (op.cost.setBy === 'manual' || !recost)) continue;
      // Nothing was harvested (appraised or abandoned): no combine pass to cost.
      if (op.type === 'harvest' && !(op.combineAcres > 0) && !(op.acres > 0) && !(op.netBu > 0)) continue;
      const key = operationCost.defaultRateKey(op);
      if (!key) { skipped.push({ id: op._id, field: op.fieldName, title: op.title, reason: 'Pick a rate (' + op.type + ' needs the implement)' }); continue; }
      const cost = operationCost.costFor(op, key, 'default');
      if (cost.error) { skipped.push({ id: op._id, field: op.fieldName, title: op.title, reason: cost.error }); continue; }
      op.cost = cost;
      await op.save();
      costed += 1;
    }
    res.json({ success: true, data: { costed, skipped }, message: `${costed} pass${costed === 1 ? '' : 'es'} costed` + (skipped.length ? `; ${skipped.length} need a rate or acres` : '') });
  } catch (err) {
    console.error('Apply field operation costs error:', err);
    res.status(500).json({ success: false, message: 'Failed to apply costs' });
  }
};

// PUT /api/field-operations/:id/cost  Body: { rateKey } (null clears the cost)
exports.setCost = async (req, res) => {
  try {
    const op = await FieldOperation.findById(req.params.id);
    if (!op) return res.status(404).json({ success: false, message: 'Record not found' });
    const key = req.body ? req.body.rateKey : undefined;
    if (key === null || key === '') {
      op.cost = undefined;
      await op.save();
      return res.json({ success: true, data: op, message: 'Cost removed' });
    }
    const cost = operationCost.costFor(op, String(key), 'manual');
    if (cost.error) return res.status(400).json({ success: false, message: cost.error });
    op.cost = cost;
    await op.save();
    res.json({ success: true, data: op, message: `Costed at ${cost.rateLabel}: $${cost.amount.toFixed(2)}` });
  } catch (err) {
    console.error('Set field operation cost error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
