// Prepared season records (harvest tickets, seed ledgers and the John Deere
// Operations Center seeding, application and tillage reports) matched to the
// Field Records cards, and machine costs for completed passes.
//
// The Fields page review panel and the startup load share this code, so a
// record lands on the same card either way.
const FieldOperation = require('../models/fieldOperation');
const M77Field = require('../models/m77Field');
require('../models/m77Farm'); // populated on the field list
const CroppingField = require('../models/croppingField');
const AppliedUpdate = require('../models/appliedUpdate');
const operationCost = require('./operationCost');
const season2026 = require('../data/season2026Records');

const IMPORTS = {
  'season-2026': season2026
};

// "42.W E/2 N/4" -> { num: '42', suffix: 'W', sub: '' }
// "73.C.SE SE CORNER" -> { num: '73', suffix: '', sub: 'C.SE' }: a corner or
// other sub-field is its own field, not a half of 73. M is a middle strip
// (16.M), a part like E and W.
function fieldNumber(name) {
  const t = String(name || '').trim();
  const m = t.match(/^#?(\d+)(?:\.?([NSEW]{1,2}|M(?![A-Z])))?(?![\d])/i);
  if (!m) return null;
  const sub = t.match(/^#?\d+\.([A-Z](?:\.[A-Z]{1,2})?)(?![A-Z.])/i);
  if (sub && !/^([NSEW]{1,2}|M)$/i.test(sub[1])) return { num: m[1], suffix: '', sub: sub[1].toUpperCase() };
  return { num: m[1], suffix: (m[2] || '').toUpperCase(), sub: '' };
}

function matches(hint, name) {
  const h = fieldNumber(hint);
  if (!h) return String(name || '').trim().toLowerCase() === String(hint).trim().toLowerCase();
  const f = fieldNumber(name);
  if (!f || f.num !== h.num || f.sub !== h.sub) return false;
  return !h.suffix || h.suffix === f.suffix;
}

// Crop on a card for a year: the linked CroppingField's cropYYYY, else the
// M77Field 2026 crop, else the crop of a completed planting record on the
// card for that year (wheat drilled in October 2026 is the 2027 crop even
// before the card's 2027 crop is set). Upper case, milo read as sorghum.
async function cardCrops(fields) {
  const legacyIds = fields.filter(f => f.legacySource === 'CroppingField' && f.legacyId).map(f => f.legacyId);
  const cfs = legacyIds.length ? await CroppingField.find({ _id: { $in: legacyIds } })
    .select('crop2025 crop2026 crop2027 crop2028 crop2029 crop2030').lean() : [];
  const byId = {};
  for (const c of cfs) byId[String(c._id)] = c;
  const planted = {};
  const seedings = await FieldOperation.find({ type: 'seeding', status: 'completed', m77Field: { $in: fields.map(f => f._id) } })
    .select('m77Field cropYear crop').lean();
  for (const o of seedings) {
    const k = String(o.m77Field) + '|' + o.cropYear;
    // Two different crops planted for one year (replant, double crop): leave it to the card.
    planted[k] = planted[k] === undefined || planted[k] === o.crop ? o.crop : null;
  }
  return (field, year) => {
    const c = field.legacyId ? byId[String(field.legacyId)] : null;
    let crop = (c && c['crop' + year]) || (year === 2026 ? field.crop2026 : '') || planted[String(field._id) + '|' + year] || '';
    crop = String(crop).toUpperCase().trim();
    if (crop.startsWith('MILO') || crop === 'SORGHUM' || crop.startsWith('SORGHUM (')) return 'SORGHUM';
    if (crop.startsWith('SUDAN') || crop.startsWith('SORGHUM SUDAN') || crop.startsWith('SORGHUM-SUDAN')) return 'SORGHUM SUDAN';
    return crop;
  };
}
const IMPORT_ONLY_KEYS = ['key', 'fieldHint', 'rev', 'matchBy', 'opsName', 'matchCropYear', 'matchCrop', 'matchCrops', 'pickIndex', 'area', 'cropFromCard', 'cropFromRotation', 'acresFromField', 'review'];
// An expense is charged to the crop that pays it back: the next harvested
// crop on the field after the pass (Kyle, Oct 15, 2026). The card's crops
// decide; when the next year is not set yet, the usual rotation does:
// wheat -> corn -> milo -> fallow -> wheat.
const ROTATION_NEXT = { WHEAT: 'CORN', CORN: 'SORGHUM', SORGHUM: 'FALLOW', FALLOW: 'WHEAT' };
const NOT_HARVESTED = ['FALLOW', 'PASTURE', 'WASTE', 'BUILDING SITE', 'CRP', ''];
function payingCrop(cropOn, field, firstYear) {
  for (let y = firstYear; y <= firstYear + 2; y++) {
    const c = cropOn(field, y);
    if (c && !NOT_HARVESTED.includes(c)) return { crop: c, cropYear: y };
    if (!c) {
      const prev = cropOn(field, y - 1);
      if (ROTATION_NEXT[prev]) return { crop: ROTATION_NEXT[prev], cropYear: y };
      return null;
    }
  }
  return null;
}

// Each prepared record with the card it is already on, or the suggested card.
async function resolveImport(importId) {
  const imp = IMPORTS[importId];
  if (!imp) return null;
  const fields = await M77Field.find({}).select('name acres farm crop2026 legacySource legacyId').populate('farm', 'name').sort({ name: 1 });
  const cropOn = await cardCrops(fields);
  // Row-crop planting dates on the cards: no tillage on a half after its
  // corn, milo or sudangrass was planted (Kyle, Oct 15, 2026).
  const plantings = await FieldOperation.find({ type: 'seeding', crop: { $in: ['CORN', 'SORGHUM', 'SORGHUM SUDAN'] } })
    .select('m77Field startDate cropYear').lean();
  const plantedBefore = (fieldId, date) => plantings.some(p => String(p.m77Field) === String(fieldId) && p.startDate &&
    new Date(p.startDate) < new Date(date) && new Date(p.startDate).getUTCFullYear() === new Date(date).getUTCFullYear());
  const done = await FieldOperation.find({ sourceKey: { $in: imp.RECORDS.map(r => importId + ':' + r.key) } })
    .select('sourceKey sourceRev m77Field fieldName');
  const doneByKey = {};
  for (const d of done) doneByKey[d.sourceKey] = d;
  const records = imp.RECORDS.map(r => {
    const d = doneByKey[importId + ':' + r.key];
    let candidates = fields.filter(f => matches(r.fieldHint, f.name));
    // Operations Center names are not reliable for the half, so match by
    // field number and then by the crop on the card.
    let cropNote = null;
    // Group of crops (tillage: spring passes go to the spring-planted half,
    // early summer passes to the fallow half).
    if (r.type === 'tillage' && r.startDate && candidates.length > 1) {
      const open = candidates.filter(f => !plantedBefore(f._id, r.startDate));
      if (open.length) candidates = open;
    }
    // matchCrops is a list of crop groups in order of preference.
    if (r.matchBy === 'crops' && candidates.length > 1) {
      for (const group of r.matchCrops) {
        const narrowed = candidates.filter(f => group.includes(cropOn(f, r.matchCropYear)));
        if (narrowed.length) { candidates = narrowed; break; }
      }
    }
    // Ops Center name breaks a tie: use its half when that card exists.
    if ((r.matchBy === 'name' || r.matchBy === 'crops') && r.opsName && candidates.length > 1 && r.pickIndex === undefined) {
      const named = candidates.filter(f => matches(r.opsName, f.name));
      if (named.length === 1) candidates = named;
    }
    // Whole-quarter pass split into one record per half.
    if (r.pickIndex !== undefined && candidates.length === 2) {
      candidates = [candidates.slice().sort((a, b) => a.name.localeCompare(b.name))[r.pickIndex]];
    } else if (r.pickIndex > 0 && candidates.length === 1) {
      cropNote = 'Only one half was open for tillage on this date (the other was growing a crop); this second-half record is likely not needed.';
    }
    if (r.matchBy === 'crop') {
      const year = r.matchCropYear || r.cropYear;
      const crop = r.matchCrop || r.crop;
      if (crop && candidates.length > 1) candidates = candidates.filter(f => cropOn(f, year) === crop);
      else if (crop && candidates.length === 1 && cropOn(candidates[0], year) !== crop) {
        cropNote = `${candidates[0].name} is ${cropOn(candidates[0], year) || 'not set'} for ${year} on its card; the report says ${crop}. Check before adding.`;
      }
    }
    const target = candidates.length === 1 ? candidates[0] : null;
    if (!cropNote && target && r.type === 'tillage' && r.startDate && plantedBefore(target._id, r.startDate)) {
      cropNote = `${target.name} was planted to a row crop before ${r.startDate}; no tillage over a growing crop. Pick the other half or leave it off.`;
    }
    // The pass is charged to a crop on the card; with no crop set it cannot go on yet.
    if (!cropNote && target && r.cropFromRotation && !payingCrop(cropOn, target, r.cropYear)) {
      cropNote = `Set the ${r.cropYear} crop on ${target.name}; there is no crop to charge this pass to yet.`;
    }
    if (!cropNote && target && r.cropFromCard && !cropOn(target, r.cropYear)) {
      cropNote = `Set the ${r.cropYear} crop on ${target.name} first.`;
    }
    if (!cropNote && target && r.area !== undefined && target.acres > 0 && r.area < 0.25 * target.acres) {
      cropNote = `Logged ${r.area} ac on the ${target.acres}-ac field; likely a patch, headland or overlap. Check before adding.`;
    }
    return {
      ...r,
      review: r.review || cropNote,
      addedTo: d ? { m77Field: d.m77Field, fieldName: d.fieldName } : null,
      outdated: !!d && (d.sourceRev || 1) < (r.rev || 1),
      suggested: candidates.length === 1 ? String(candidates[0]._id) : null,
      candidateCount: candidates.length
    };
  });
  // Two records of the same kind landing on one card are likely the same
  // pass logged twice (wrong half picked in the cab); flag all but the first.
  const seen = {};
  for (const r of records) {
    const target = r.addedTo ? String(r.addedTo.m77Field) : r.suggested;
    if (!target || !/^(app26|sd26|till26)-/.test(r.key)) continue;
    const k = [target, r.type, r.cropYear, r.title, r.startDate].join('|');
    if (seen[k]) r.review = r.review || ('Same card and pass as ' + seen[k] + '; likely logged twice.');
    else seen[k] = r.fieldHint + ' ' + r.startDate;
  }
  // Records on cards from an earlier version of this import whose data was
  // replaced (for example starter-based planting replaced by the seeding
  // report); offered for removal.
  const current = new Set(imp.RECORDS.map(r => importId + ':' + r.key));
  const retired = await FieldOperation.find({ sourceKey: { $regex: '^' + importId.replace(/[^a-z0-9-]/gi, '') + ':' } })
    .select('sourceKey fieldName title cropYear crop startDate').lean();
  return {
    retired: retired.filter(r => !current.has(r.sourceKey)).map(r => ({ id: r._id, sourceKey: r.sourceKey, fieldName: r.fieldName, title: r.title, cropYear: r.cropYear, crop: r.crop, startDate: r.startDate })),
    records,
    fields
  };
}

// Writes one prepared record to a card (adds it, or moves and refreshes it).
// Returns an error message, or null when written.
async function writeRecord(importId, rec, field, cropOn, userId) {
  const data = { ...rec };
  for (const k of IMPORT_ONLY_KEYS) delete data[k];
  const { key, rev } = rec;
  if (rec.cropFromRotation) {
    const pays = payingCrop(cropOn, field, rec.cropYear);
    if (!pays) return `${key}: set the ${rec.cropYear} crop on ${field.name}; no crop to charge this pass to`;
    data.crop = pays.crop;
    data.cropYear = pays.cropYear;
  }
  if (rec.cropFromCard) {
    data.crop = cropOn(field, rec.cropYear);
    if (!data.crop) return `${key}: set the ${rec.cropYear} crop on ${field.name} first`;
  }
  if (rec.acresFromField) data.acres = field.acres || null;
  const sourceKey = importId + ':' + key;
  const update = { ...data, sourceKey, sourceRev: rev || 1, m77Field: field._id, fieldName: field.name, farmName: field.farm ? field.farm.name : '' };
  if (userId) update.createdBy = userId;
  await FieldOperation.findOneAndUpdate({ sourceKey }, update, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  return null;
}

// Costs every completed pass that has no cost yet, at the default rate for
// its type and crop. Hand-picked rates are never changed. recost also
// refreshes default-rate costs (for example after acres were corrected).
async function costPending({ recost = false } = {}) {
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
    // A recost that changes nothing is not a write.
    if (has && cost.amount === op.cost.amount && cost.rateKey === op.cost.rateKey) continue;
    op.cost = cost;
    await op.save();
    costed += 1;
  }
  return { costed, skipped };
}

// Startup: puts each prepared record on its card when the match is certain
// (one card, nothing to review), the same records the review panel checks
// by default, and refreshes records on a card whose data was revised. Each
// record revision is handled once, so a record taken off a card stays off.
// Records that need a person (several possible cards, or a review note)
// wait in the 2026 Season Records panel. Planting goes on first because
// tillage matching reads the planting dates.
const AUTO_KEY = 'season-records-auto-load';
async function autoLoad(importId = 'season-2026') {
  const doc = await AppliedUpdate.findOne({ key: AUTO_KEY + ':' + importId });
  const handled = new Set(doc ? doc.summary : []);
  const newlyHandled = [];
  let added = 0, refreshed = 0;
  const waiting = [];
  for (const phase of [r => r.type === 'seeding', r => r.type !== 'seeding']) {
    const resolved = await resolveImport(importId);
    const cropOn = await cardCrops(resolved.fields);
    const fieldById = {};
    for (const f of resolved.fields) fieldById[String(f._id)] = f;
    for (const r of resolved.records.filter(phase)) {
      const tag = r.key + '@' + (r.rev || 1);
      if (handled.has(tag)) continue;
      if (r.addedTo && !r.outdated) { handled.add(tag); newlyHandled.push(tag); continue; }
      const field = r.addedTo ? fieldById[String(r.addedTo.m77Field)] : (!r.review && r.suggested ? fieldById[r.suggested] : null);
      if (!field) { waiting.push(r.key); continue; }
      const err = await writeRecord(importId, r, field, cropOn, null);
      if (err) { waiting.push(r.key); continue; }
      if (r.addedTo) refreshed += 1; else added += 1;
      handled.add(tag);
      newlyHandled.push(tag);
    }
  }
  if (newlyHandled.length) {
    await AppliedUpdate.updateOne({ key: AUTO_KEY + ':' + importId },
      { $addToSet: { summary: { $each: newlyHandled } }, $setOnInsert: { appliedAt: new Date() } }, { upsert: true });
  }
  const cost = await costPending();
  const out = [];
  if (added || refreshed) out.push(`${importId}: ${added} added to cards, ${refreshed} refreshed`);
  if (waiting.length) out.push(`${importId}: ${waiting.length} wait for review in 2026 Season Records`);
  if (cost.costed) out.push(`${cost.costed} completed passes costed at the default rates`);
  if (cost.skipped.length) out.push(`${cost.skipped.length} completed passes need a rate or acres`);
  return out;
}

module.exports = { IMPORTS, matches, cardCrops, payingCrop, resolveImport, writeRecord, costPending, autoLoad };
