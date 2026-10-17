const FieldOperation = require('../models/fieldOperation');
const M77Field = require('../models/m77Field');
const operationCost = require('../services/operationCost');
const seasonRecords = require('../services/seasonRecords');
const { IMPORTS, cardCrops } = seasonRecords;

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
  try {
    const out = await seasonRecords.resolveImport(req.params.importId);
    if (!out) return res.status(404).json({ success: false, message: 'Import not found' });
    res.json({
      success: true,
      data: {
        retired: out.retired,
        records: out.records,
        fields: out.fields.map(f => ({ _id: f._id, name: f.name, acres: f.acres, farmName: f.farm ? f.farm.name : '' }))
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
    const retire = Array.isArray(req.body && req.body.retire) ? req.body.retire : [];
    if (!assignments.length && !retire.length) return res.status(400).json({ success: false, message: 'Pick at least one record to add' });
    // Remove superseded records (only ones from this import that are no longer in it).
    const currentKeys = new Set(imp.RECORDS.map(r => req.params.importId + ':' + r.key));
    let removed = 0;
    for (const id of retire) {
      const op = await FieldOperation.findById(id);
      if (!op || !op.sourceKey || !op.sourceKey.startsWith(req.params.importId + ':') || currentKeys.has(op.sourceKey)) continue;
      await op.deleteOne();
      removed += 1;
    }
    const byKey = {};
    for (const r of imp.RECORDS) byKey[r.key] = r;
    const fieldIds = Array.from(new Set(assignments.map(a => a.m77Field).filter(Boolean)));
    const fields = await M77Field.find({ _id: { $in: fieldIds } }).populate('farm', 'name');
    const cropOn = await cardCrops(fields);
    const fieldById = {};
    for (const f of fields) fieldById[String(f._id)] = f;

    let added = 0;
    const errors = [];
    for (const a of assignments) {
      const rec = byKey[a.key];
      const field = fieldById[String(a.m77Field)];
      if (!rec) { errors.push(a.key + ': record not found'); continue; }
      if (!field) { errors.push(a.key + ': field not found'); continue; }
      const err = await seasonRecords.writeRecord(req.params.importId, rec, field, cropOn, req.userId);
      if (err) { errors.push(err); continue; }
      added += 1;
    }
    // Newly placed passes get their machine cost right away.
    const cost = await seasonRecords.costPending();
    res.json({
      success: errors.length === 0,
      data: { added, errors, costed: cost.costed },
      message: `${added} record${added === 1 ? '' : 's'} added to field cards` + (removed ? `; ${removed} superseded record${removed === 1 ? '' : 's'} removed` : '') + (errors.length ? `; ${errors.length} not added: ${errors.join('; ')}` : '')
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
    const { costed, skipped } = await seasonRecords.costPending({ recost: req.body && req.body.recost === true });
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

// ---------- Consistency check ----------
// Operations try to stay even across all acres of a crop. For each crop on
// the cards in a crop year, a completed pass that more than half of those
// fields have is expected on the rest; the fields without it are listed.
function passSignature(op) {
  return op.type + '|' + String(op.title || '').trim().toLowerCase();
}

// GET /api/field-operations/gaps?cropYear=2027
exports.listGaps = async (req, res) => {
  try {
    const cropYear = parseInt(req.query.cropYear, 10);
    if (!cropYear) return res.status(400).json({ success: false, message: 'cropYear is required' });
    const fields = await M77Field.find({}).select('name acres farm crop2026 legacySource legacyId').populate('farm', 'name type').lean();
    const active = fields.filter(f => !(f.farm && f.farm.type === 'custom'));
    const cropOn = await cardCrops(active);
    const ops = await FieldOperation.find({ cropYear, m77Field: { $in: active.map(f => f._id) } }).lean();

    const groups = {};
    for (const f of active) {
      const crop = cropOn(f, cropYear);
      if (!crop || ['FALLOW', 'PASTURE', 'WASTE', 'BUILDING SITE', 'CRP'].includes(crop)) continue;
      (groups[crop] = groups[crop] || []).push(f);
    }
    const out = [];
    for (const [crop, gFields] of Object.entries(groups)) {
      if (gFields.length < 3) continue;
      const ids = new Set(gFields.map(f => String(f._id)));
      const bySig = {};
      for (const op of ops) {
        if (!ids.has(String(op.m77Field)) || op.status !== 'completed') continue;
        if (op.type === 'harvest') continue;
        const sig = passSignature(op);
        (bySig[sig] = bySig[sig] || []).push(op);
      }
      for (const list of Object.values(bySig)) {
        const have = new Set(list.map(o => String(o.m77Field)));
        if (have.size * 2 <= gFields.length || have.size === gFields.length) continue;
        const example = list.find(o => !o.assumed) || list[0];
        out.push({
          cropYear, crop,
          fieldCount: gFields.length,
          pass: { type: example.type, title: example.title, count: have.size, exampleId: example._id, products: example.products, startDate: example.startDate },
          missing: gFields.filter(f => !have.has(String(f._id))).map(f => {
            const planned = ops.find(o => String(o.m77Field) === String(f._id) && o.status === 'planned' && passSignature(o) === passSignature(example));
            return { id: f._id, name: f.name, acres: f.acres, farm: f.farm ? f.farm.name : '', plannedId: planned ? planned._id : null };
          })
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        });
      }
    }
    out.sort((a, b) => a.crop.localeCompare(b.crop) || b.pass.count - a.pass.count);
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('Field record gap check error:', err);
    res.status(500).json({ success: false, message: 'Failed to check for gaps' });
  }
};

// POST /api/field-operations/gaps/fill  Body: { exampleId, m77Fields: [] }
// Adds the pass to each field as assumed (done, not recorded), copying the
// example's products and rate; acres are the field's acres.
exports.fillGaps = async (req, res) => {
  try {
    const example = await FieldOperation.findById(req.body && req.body.exampleId);
    if (!example) return res.status(404).json({ success: false, message: 'Example pass not found' });
    const ids = Array.isArray(req.body.m77Fields) ? req.body.m77Fields : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Pick at least one field' });
    const fields = await M77Field.find({ _id: { $in: ids } }).populate('farm', 'name');
    let added = 0;
    for (const field of fields) {
      const dup = await FieldOperation.findOne({ m77Field: field._id, cropYear: example.cropYear, type: example.type, title: example.title });
      if (dup && dup.status !== 'planned') continue;
      if (dup) {
        // Planned on this card but not recorded as done: mark it done, assumed.
        dup.status = 'completed';
        dup.assumed = true;
        dup.assumedFrom = example._id;
        if (!dup.startDate) { dup.startDate = example.startDate; dup.endDate = example.endDate; }
        dup.notes = [dup.notes, 'Marked done by the consistency check: the other ' + example.crop + ' fields had this pass; it was not in the records.'].filter(Boolean).join(' ');
        const k = (example.cost && example.cost.rateKey) || operationCost.defaultRateKey(dup);
        if (k) { const c = operationCost.costFor(dup, k, example.cost && example.cost.setBy === 'manual' ? 'manual' : 'default'); if (!c.error) dup.cost = c; }
        await dup.save();
        added += 1;
        continue;
      }
      const op = new FieldOperation({
        m77Field: field._id, fieldName: field.name, farmName: field.farm ? field.farm.name : '',
        cropYear: example.cropYear, crop: example.crop, type: example.type, status: 'completed',
        title: example.title, startDate: example.startDate, endDate: example.endDate,
        acres: field.acres || null, products: example.products, carrierGalPerAcre: example.carrierGalPerAcre,
        assumed: true, assumedFrom: example._id,
        source: 'Assumed: same pass as the other ' + example.crop + ' ' + String(example.cropYear).slice(-2) + ' fields; not in the records',
        notes: 'Added by the consistency check. Date and products copied from ' + example.fieldName + '.',
        createdBy: req.userId
      });
      const key = (example.cost && example.cost.rateKey) || operationCost.defaultRateKey(op);
      if (key) {
        const cost = operationCost.costFor(op, key, example.cost && example.cost.setBy === 'manual' ? 'manual' : 'default');
        if (!cost.error) op.cost = cost;
      }
      await op.save();
      added += 1;
    }
    res.json({ success: true, data: { added }, message: `${added} assumed pass${added === 1 ? '' : 'es'} added` });
  } catch (err) {
    console.error('Fill field record gaps error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
