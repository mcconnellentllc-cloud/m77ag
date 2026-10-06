const SeedCostShare = require('../models/seedCostShare');
const M77Field = require('../models/m77Field');
const Invoice = require('../models/invoice');

const DEFAULT_LANDLORD_SHARE = 1 / 3;
const STATEMENT_DUE_DAYS = 30;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function isBlank(v) {
  return v === undefined || v === null || v === '';
}

// Price inputs: blank means "not yet known" and is stored as null.
function parsePrice(v, label) {
  if (isBlank(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a number of 0 or more`);
  return n;
}

function parseTreatments(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(t => t && String(t.name || '').trim())
    .map(t => ({
      name: String(t.name).trim(),
      pricePerBu: parsePrice(t.pricePerBu, `Price for ${t.name}`)
    }));
}

function shareLabel(share) {
  if (Math.abs(share - 1 / 3) < 0.0001) return '1/3';
  return `${round2(share * 100)}%`;
}

// GET /api/seed-cost-shares?season=&m77Field=&product=
exports.listEntries = async (req, res) => {
  try {
    const filter = {};
    for (const key of ['season', 'm77Field', 'product']) {
      if (req.query[key]) filter[key] = req.query[key];
    }
    const entries = await SeedCostShare.find(filter).sort({ fieldName: 1, createdAt: 1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    console.error('List seed cost shares error:', err);
    res.status(500).json({ success: false, message: 'Failed to load seed cost shares' });
  }
};

// POST /api/seed-cost-shares
exports.createEntry = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.m77Field || isBlank(b.season) || isBlank(b.product)) {
      return res.status(400).json({ success: false, message: 'Field, season and product are required' });
    }

    const lbPerBu = isBlank(b.lbPerBu) ? 60 : Number(b.lbPerBu);
    let quantityLb = isBlank(b.quantityLb) ? null : Number(b.quantityLb);
    if (quantityLb === null && !isBlank(b.quantityBu)) quantityLb = Number(b.quantityBu) * lbPerBu;
    if (!Number.isFinite(quantityLb) || quantityLb <= 0) {
      return res.status(400).json({ success: false, message: 'Enter the pounds (or bushels) placed on the field' });
    }

    const field = await M77Field.findById(b.m77Field).populate('farm', 'name landlordName type');
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    // Only crop-share farms carry a landlord cost share. Owned and custom
    // farms are recorded for seed tracking with a share of 0.
    const farm = field.farm;
    let landlordShare = 0;
    if (farm && farm.type === 'crop-share') {
      landlordShare = isBlank(b.landlordShare) ? DEFAULT_LANDLORD_SHARE : Number(b.landlordShare);
      if (!Number.isFinite(landlordShare) || landlordShare < 0 || landlordShare > 1) {
        return res.status(400).json({ success: false, message: 'Landlord share must be between 0 and 1' });
      }
    }

    const entry = await SeedCostShare.create({
      season: String(b.season).trim(),
      cropYear: isBlank(b.cropYear) ? undefined : Number(b.cropYear),
      m77Field: field._id,
      m77Farm: farm ? farm._id : undefined,
      fieldName: field.name,
      fieldAcres: field.acres,
      farmName: farm ? farm.name : '',
      landlordName: farm ? farm.landlordName : '',
      product: String(b.product).trim(),
      vendor: b.vendor,
      ticketNumber: b.ticketNumber,
      quantityLb: round2(quantityLb),
      lbPerBu,
      estimated: !!b.estimated,
      seedPricePerBu: parsePrice(b.seedPricePerBu, 'Seed price'),
      treatments: parseTreatments(b.treatments),
      landlordShare,
      notes: b.notes,
      createdBy: req.userId
    });

    res.status(201).json({ success: true, data: entry, message: 'Seed entry added' });
  } catch (err) {
    console.error('Create seed cost share error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to add seed entry' });
  }
};

// PUT /api/seed-cost-shares/:id
exports.updateEntry = async (req, res) => {
  try {
    const entry = await SeedCostShare.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Seed entry not found' });
    if (entry.statement) {
      return res.status(409).json({
        success: false,
        message: `This entry is already on landlord statement ${entry.statementNumber}. Cancel that statement before changing it.`
      });
    }

    const b = req.body || {};
    if (!isBlank(b.quantityLb)) {
      const q = Number(b.quantityLb);
      if (!Number.isFinite(q) || q <= 0) throw new Error('Pounds must be greater than 0');
      entry.quantityLb = round2(q);
    }
    if (b.estimated !== undefined) entry.estimated = !!b.estimated;
    for (const key of ['product', 'vendor', 'ticketNumber', 'notes']) {
      if (b[key] !== undefined) entry[key] = b[key];
    }
    if (b.seedPricePerBu !== undefined) entry.seedPricePerBu = parsePrice(b.seedPricePerBu, 'Seed price');
    if (b.treatments !== undefined) entry.treatments = parseTreatments(b.treatments);
    if (!isBlank(b.landlordShare) && entry.landlordShare > 0) {
      const s = Number(b.landlordShare);
      if (!Number.isFinite(s) || s < 0 || s > 1) throw new Error('Landlord share must be between 0 and 1');
      entry.landlordShare = s;
    }

    await entry.save();
    res.json({ success: true, data: entry, message: 'Seed entry updated' });
  } catch (err) {
    console.error('Update seed cost share error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update seed entry' });
  }
};

// DELETE /api/seed-cost-shares/:id
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await SeedCostShare.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Seed entry not found' });
    if (entry.statement) {
      return res.status(409).json({
        success: false,
        message: `This entry is already on landlord statement ${entry.statementNumber}. Cancel that statement before removing it.`
      });
    }
    await entry.deleteOne();
    res.json({ success: true, message: 'Seed entry removed' });
  } catch (err) {
    console.error('Delete seed cost share error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove seed entry' });
  }
};

// POST /api/seed-cost-shares/prices
// Body: { season, product, seedPricePerBu?, treatments? }
// Applies prices to every entry of that product and season that is not yet
// on a statement.
exports.setPrices = async (req, res) => {
  try {
    const b = req.body || {};
    if (isBlank(b.season) || isBlank(b.product)) {
      return res.status(400).json({ success: false, message: 'Season and product are required' });
    }
    const update = {};
    if (b.seedPricePerBu !== undefined) update.seedPricePerBu = parsePrice(b.seedPricePerBu, 'Seed price');
    if (b.treatments !== undefined) update.treatments = parseTreatments(b.treatments);
    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    const result = await SeedCostShare.updateMany(
      { season: b.season, product: b.product, statement: null },
      { $set: update }
    );
    res.json({
      success: true,
      data: { updated: result.modifiedCount },
      message: `Prices updated on ${result.modifiedCount} entr${result.modifiedCount === 1 ? 'y' : 'ies'}`
    });
  } catch (err) {
    console.error('Set seed prices error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update prices' });
  }
};

// POST /api/seed-cost-shares/statements
// Body: { season, dueDate? }
// Creates one draft landlord statement per landlord farm from every entry
// that is priced, final (not estimated) and not yet billed.
exports.generateStatements = async (req, res) => {
  try {
    const season = (req.body && req.body.season) || '';
    if (!season) return res.status(400).json({ success: false, message: 'Season is required' });

    let dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (!dueDate || isNaN(dueDate.getTime())) {
      dueDate = new Date(Date.now() + STATEMENT_DUE_DAYS * 24 * 60 * 60 * 1000);
    }

    const entries = await SeedCostShare.find({ season, statement: null, landlordShare: { $gt: 0 } })
      .sort({ fieldName: 1 });

    const skipped = [];
    const groups = new Map();
    for (const e of entries) {
      if (e.estimated) {
        skipped.push({ fieldName: e.fieldName, product: e.product, reason: 'Pounds are still an estimate' });
        continue;
      }
      if (!e.priced) {
        skipped.push({ fieldName: e.fieldName, product: e.product, reason: 'Price not entered yet' });
        continue;
      }
      const key = e.m77Farm ? String(e.m77Farm) : `name:${e.landlordName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }

    const created = [];
    for (const group of groups.values()) {
      const first = group[0];
      const items = [];
      for (const e of group) {
        for (const line of e.landlordLines()) {
          const what = line.kind === 'seed' ? `${line.name} seed` : `${line.name} seed treatment`;
          items.push({
            description: `${e.fieldName}: ${what}, ${e.bushels} bu at $${line.pricePerBu.toFixed(2)}/bu, landlord share ${shareLabel(e.landlordShare)}`,
            category: 'seed',
            quantity: e.bushels,
            unit: 'bushel',
            unitPrice: round4(line.pricePerBu * e.landlordShare),
            amount: line.amount,
            m77Field: e.m77Field,
            acres: e.fieldAcres,
            cropYear: e.cropYear
          });
        }
      }
      const subtotal = round2(items.reduce((sum, i) => sum + i.amount, 0));

      const invoice = await Invoice.create({
        invoiceNumber: await Invoice.generateInvoiceNumber('LS'),
        type: 'landlord_statement',
        status: 'draft',
        to: { name: first.landlordName || first.farmName || 'Landlord' },
        items,
        subtotal,
        total: subtotal,
        balanceDue: subtotal,
        dueDate,
        terms: 'net_30',
        m77Farm: first.m77Farm,
        cropYear: first.cropYear,
        notes: `Landlord share of seed and seed treatment, ${season} (${first.farmName}).`,
        createdBy: req.userId
      });

      await SeedCostShare.updateMany(
        { _id: { $in: group.map(e => e._id) } },
        { $set: { statement: invoice._id, statementNumber: invoice.invoiceNumber } }
      );

      created.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        landlordName: invoice.to.name,
        farmName: first.farmName,
        entryCount: group.length,
        total: invoice.total
      });
    }

    res.json({
      success: true,
      data: { created, skipped },
      message: created.length
        ? `Created ${created.length} draft landlord statement${created.length === 1 ? '' : 's'}`
        : 'No entries are ready to bill'
    });
  } catch (err) {
    console.error('Generate landlord statements error:', err);
    res.status(500).json({ success: false, message: 'Failed to create landlord statements: ' + err.message });
  }
};
