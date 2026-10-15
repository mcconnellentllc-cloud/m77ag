const FertilityStandard = require('../models/fertilityStandard');
const DEFAULTS = require('../data/fertilityStandards');

const PRICES_KEY = 'PRICES';
const EDITABLE = ['title', 'source', 'sourceUrl', 'n', 'p', 'k', 'zn', 'ironPh', 'notes'];

// Adds standards missing from the sheet and refreshes unedited ones whose
// published default has a newer seedRev.
async function addMissingDefaults() {
  const existing = await FertilityStandard.find({}, { key: 1, seedRev: 1, userEdited: 1 }).lean();
  const byKey = new Map(existing.map(s => [s.key, s]));
  for (const d of DEFAULTS) {
    const saved = byKey.get(d.key);
    const rev = d.seedRev || 1;
    if (saved) {
      if (!saved.userEdited && (saved.seedRev || 1) < rev) await FertilityStandard.updateOne({ _id: saved._id, userEdited: { $ne: true } }, { ...d, seedRev: rev });
      continue;
    }
    try { await FertilityStandard.create({ ...d, seedRev: rev }); } catch (e) { if (e.code !== 11000) throw e; }
  }
  if (!byKey.has(PRICES_KEY)) {
    try {
      await FertilityStandard.create({ key: PRICES_KEY, water: 'settings', title: 'Prices', ...DEFAULTS.PRICE_DEFAULTS });
    } catch (e) { if (e.code !== 11000) throw e; }
  }
}

async function loadAll() {
  await addMissingDefaults();
  const rows = await FertilityStandard.find({}).sort({ crop: 1, water: 1 }).lean();
  return { standards: rows.filter(r => r.key !== PRICES_KEY), prices: rows.find(r => r.key === PRICES_KEY) || {} };
}

const isNum = v => typeof v === 'number' && isFinite(v);
const okMax = v => v === null || (isNum(v) && v >= 0);

// Rows must hold numbers and run from low to high soil test, ending open.
function checkRows(rows, fields, label) {
  if (!Array.isArray(rows) || !rows.length) return label + ': at least one row is required';
  let prev = -Infinity;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    if (!okMax(r.maxPpm)) return label + ' row ' + (i + 1) + ': soil test limit must be a number or open';
    if (r.maxPpm === null && i !== rows.length - 1) return label + ': only the last row can be open-ended';
    if (r.maxPpm !== null && r.maxPpm <= prev) return label + ': soil test limits must increase down the table';
    if (r.maxPpm !== null) prev = r.maxPpm;
    for (const f of fields) {
      const v = r[f];
      if (Array.isArray(v)) { if (!v.every(x => isNum(x) && x >= 0)) return label + ' row ' + (i + 1) + ': rates must be numbers 0 or more'; }
      else if (v !== undefined && !(isNum(v) && v >= 0)) return label + ' row ' + (i + 1) + ': ' + f + ' must be a number 0 or more';
    }
  }
  if (rows[rows.length - 1].maxPpm !== null) return label + ': the last row must be open-ended (no upper limit)';
  return null;
}

function validate(s) {
  const n = s.n || {};
  const numsOk = keys => keys.every(k => n[k] === undefined || n[k] === null || isNum(n[k]));
  if (!numsOk(['base', 'perBu', 'perPpm', 'omPerBuPct', 'basisYield', 'perTenBu', 'max', 'ppmMultiplier', 'omPer', 'omCap', 'priceFactor', 'defaultPpm', 'onlyWithPKRate'])) return 'Nitrogen coefficients must be numbers';
  if (n.method === 'table') { const e = checkRows(n.rows, ['rates'], 'Nitrogen table'); if (e) return e; if (!n.rows.every(r => Array.isArray(r.rates) && r.rates.length === 3)) return 'Nitrogen table: each row needs three organic matter columns'; }
  if (n.method === 'ppm-table') { const e = checkRows(n.rows, ['rate'], 'Nitrogen table'); if (e) return e; }
  if (s.p && s.p.rows) { const e = checkRows(s.p.rows, ['band', 'broadcast'], 'Phosphorus table'); if (e) return e; }
  if (s.k && s.k.rows) { const e = checkRows(s.k.rows, ['rate', 'row'], 'Potassium table'); if (e) return e; }
  if (s.zn && s.zn.rows) { const e = checkRows(s.zn.rows, ['band', 'broadcast'], 'Zinc table'); if (e) return e; }
  if (s.zn && s.zn.rowsNonCalcareous) { const e = checkRows(s.zn.rowsNonCalcareous, ['band', 'broadcast'], 'Zinc table (non-calcareous)'); if (e) return e; }
  if (s.ironPh !== undefined && s.ironPh !== null && !isNum(s.ironPh)) return 'Iron pH must be a number';
  if (s.notes && !(Array.isArray(s.notes) && s.notes.every(x => typeof x === 'string'))) return 'Notes must be text';
  return null;
}

exports.addMissingDefaults = addMissingDefaults;
exports.loadAll = loadAll;

exports.list = async (req, res) => {
  try {
    const { standards, prices } = await loadAll();
    const defaults = {};
    DEFAULTS.forEach(d => { defaults[d.key] = d; });
    res.json({ success: true, data: { standards, prices: { sorghumPrice: prices.sorghumPrice ?? null, nPrice: prices.nPrice ?? null, updatedAt: prices.updatedAt || null } }, defaults });
  } catch (error) {
    console.error('Error loading fertility standards:', error);
    res.status(500).json({ success: false, message: 'Failed to load fertility standards' });
  }
};

exports.update = async (req, res) => {
  try {
    const current = await FertilityStandard.findOne({ key: req.params.key }).lean();
    if (!current || current.key === PRICES_KEY) return res.status(404).json({ success: false, message: 'Standard not found' });
    const body = req.body || {};
    const next = { ...current };
    for (const f of EDITABLE) if (body[f] !== undefined) next[f] = body[f];
    if (next.n && current.n) next.n.method = current.n.method; // the method is fixed; only its numbers change
    const err = validate(next);
    if (err) return res.status(400).json({ success: false, message: err });
    const set = { userEdited: true, updatedBy: req.user && (req.user.email || req.user.name) };
    for (const f of EDITABLE) if (body[f] !== undefined) set[f] = next[f];
    const saved = await FertilityStandard.findOneAndUpdate({ key: current.key }, { $set: set }, { new: true }).lean();
    res.json({ success: true, data: saved, message: 'Standard saved' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.reset = async (req, res) => {
  try {
    const d = DEFAULTS.find(x => x.key === req.params.key);
    if (!d) return res.status(404).json({ success: false, message: 'No published default for this standard' });
    const saved = await FertilityStandard.findOneAndUpdate({ key: d.key }, { $set: { ...d, seedRev: d.seedRev || 1, userEdited: false, updatedBy: req.user && (req.user.email || req.user.name) } }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: saved, message: 'Standard reset to the published values' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePrices = async (req, res) => {
  try {
    const body = req.body || {};
    const set = {};
    for (const f of ['sorghumPrice', 'nPrice']) {
      if (body[f] === undefined) continue;
      if (body[f] === null || body[f] === '') { set[f] = null; continue; }
      const v = Number(body[f]);
      if (!isFinite(v) || v <= 0) return res.status(400).json({ success: false, message: 'Prices must be numbers above zero' });
      set[f] = v;
    }
    await addMissingDefaults();
    const saved = await FertilityStandard.findOneAndUpdate({ key: PRICES_KEY }, { $set: { ...set, updatedBy: req.user && (req.user.email || req.user.name) } }, { new: true }).lean();
    res.json({ success: true, data: { sorghumPrice: saved.sorghumPrice ?? null, nPrice: saved.nPrice ?? null, updatedAt: saved.updatedAt }, message: 'Prices saved' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
