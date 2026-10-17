// Loads the 2018-2025 crop history in server/data/cropHistoryImport.js onto
// the field cards, once. Nothing entered on a card is overwritten: a year
// already on the card keeps its crop, and differences are listed in the
// AppliedUpdate summary.
//
// Which record wins for a card and year:
//   1. harvest records (OVERVIEW yield tables and harvest operations,
//      WHEAT INSURANCE harvest operations), which also carry the yield
//   2. the rotation sheet and the 2025 spray records, when they agree.
//      When they disagree the year is left blank and listed.
// Wheat fertilizer passes (25WFERT) alone do not set a crop: a fall pass
// belongs to the next year's wheat. The Claude Project notes (claude/*.md)
// repeat the workbook yields by insurance unit and are not loaded.
const CroppingField = require('../models/croppingField');
const AppliedUpdate = require('../models/appliedUpdate');
const { ROWS, FIELD_MAP, HOLD } = require('../data/cropHistoryImport');
const { fieldNumber, labCrop2025 } = require('./fieldBackfill');

const KEY = 'crop-history-import-2018-2025';
const normName = v => String(v || '').toUpperCase().replace(/\s+/g, ' ').trim();
const CROP_NAMES = { BUILDING: 'BUILDING SITE' };
const cropName = c => CROP_NAMES[normName(c)] || normName(c);

const HARVEST = /(OVERVIEW row \d+ \([^)]*(yield table|YIELD table|harvest op)\)|WHEAT INSURANCE row \d+ \(combine harvest op\))/i;

function tier(source) {
  if (/^claude\//.test(source)) return null;
  if (HARVEST.test(source)) return 'harvest';
  if (/ROTATION PROGRAMS/.test(source)) return 'rotation';
  if (/SPRAYED row/.test(source)) return 'spray';
  const tables = source.match(/Table \d+ \(([^)]+)\)/g) || [];
  if (tables.some(t => !/25WFERT/.test(t))) return 'spray';
  return null;
}

function held(row) {
  const [, field, year, , , , source] = row;
  return HOLD.find(h => h.field.test(normName(field)) &&
    (!h.years || h.years.includes(year)) &&
    (!h.source || h.source.test(source)) &&
    !(h.keepHarvest && tier(source) === 'harvest'));
}

// Card names a record field name stands for.
function targetsFor(field) {
  const n = normName(field);
  const mapped = Object.entries(FIELD_MAP).find(([k]) => normName(k) === n);
  return mapped ? { names: mapped[1], whole: mapped[1].length > 1 } : { names: [n], whole: false };
}

// Card for a name: same name, else the one card with the same field number and half.
function findCard(cards, name) {
  const n = normName(name);
  const exact = cards.filter(c => normName(c.field) === n);
  if (exact.length === 1) return exact[0];
  const f = fieldNumber(n);
  if (!f || !f.suffix) return null;
  const same = cards.filter(c => {
    const g = fieldNumber(c.field);
    return g && g.num === f.num && g.suffix === f.suffix;
  });
  return same.length === 1 ? same[0] : null;
}

// Decide crop and yield for each card and year. Pure; used by apply() and tests.
function resolve(cards) {
  const report = { held: [], unmatched: [], conflicts: [], ignored: 0 };
  const byCard = new Map(); // card id -> Map(year -> { specific: [], whole: [] })
  const ownYears = new Map(); // card id -> Set of years with a half-field record (held included)
  const slot = (id, year) => {
    if (!byCard.has(id)) byCard.set(id, new Map());
    const m = byCard.get(id);
    if (!m.has(year)) m.set(year, { specific: [], whole: [] });
    return m.get(year);
  };

  const ownCrops = new Map(); // card id|year -> Set of crops on half-field rows (held included)
  const wholeRows = [];
  for (const row of ROWS) {
    const [, field, year, crop, , yld, source] = row;
    const t = targetsFor(field);
    const cs = t.names.map(nm => findCard(cards, nm));
    const h = held(row);
    if (cs.some(c => !c)) {
      if (h) report.held.push(`${field} ${year} ${crop}: ${h.reason}`);
      else if (tier(source)) report.unmatched.push(`${field} ${year} ${crop}`);
      continue;
    }
    if (!t.whole) {
      const id = String(cs[0]._id);
      if (!ownYears.has(id)) ownYears.set(id, new Set());
      ownYears.get(id).add(year);
      const k = id + '|' + year;
      if (!ownCrops.has(k)) ownCrops.set(k, new Set());
      ownCrops.get(k).add(cropName(crop));
    } else {
      wholeRows.push({ row, cs });
    }
    if (h) { report.held.push(`${field} ${year} ${crop}: ${h.reason}`); continue; }
    const tr = tier(source);
    if (!tr) { report.ignored++; continue; }
    const rec = { crop: cropName(crop), yield: yld, tier: tr, source, field };
    cs.forEach(c => slot(String(c._id), year)[t.whole ? 'whole' : 'specific'].push({ ...rec, siblings: cs.map(x => String(x._id)) }));
  }

  // A whole-field sheet row that contradicts the half-field rows in a year
  // both cover is not used for any year.
  const badWhole = new Set();
  for (const { row: [, field, year, crop, , , source], cs } of wholeRows) {
    const own = cs.map(c => ownCrops.get(String(c._id) + '|' + year)).filter(Boolean);
    if (own.length && !own.some(set => set.has(cropName(crop)))) {
      const k = normName(field) + '|' + source;
      if (!badWhole.has(k)) report.held.push(`${field} (${source}): whole-field row disagrees with the half-field rows (${year}: ${crop} vs ${own.map(set => [...set].join('/')).join(', ')})`);
      badWhole.add(k);
    }
  }
  for (const years of byCard.values()) {
    for (const s of years.values()) s.whole = s.whole.filter(r => !badWhole.has(normName(r.field) + '|' + r.source));
  }

  const out = new Map(); // card id -> [{ year, crop, yieldPerAcre, notes }]
  for (const [id, years] of byCard) {
    const card = cards.find(c => String(c._id) === id);
    for (const [year, s] of years) {
      let recs = s.specific;
      if (!recs.length) {
        // Whole-field record: only when no split card kept its own record that year.
        recs = s.whole.filter(r => !r.siblings.some(sid => ownYears.get(sid) && ownYears.get(sid).has(year)));
      }
      if (!recs.length) continue;
      const harvest = recs.filter(r => r.tier === 'harvest');
      const other = recs.filter(r => r.tier !== 'harvest');
      const crops = list => [...new Set(list.map(r => r.crop))];
      let crop = null; let note = '';
      if (harvest.length) {
        const hc = crops(harvest);
        const oc = crops(other);
        if (hc.length > 1) { report.conflicts.push(`${card.field} ${year}: harvest records disagree (${hc.join(', ')})`); continue; }
        crop = hc[0];
        if (/GRAZED/.test(crop) && oc.length === 1 && !/GRAZED/.test(oc[0])) {
          note = `${crop.charAt(0)}${crop.slice(1).toLowerCase()} per the forage yield table. `;
          crop = oc[0];
        } else if (oc.some(c => c !== crop)) {
          note = `Harvest record used; rotation or spray records list ${oc.filter(c => c !== crop).join(', ')}. `;
        }
      } else {
        const oc = crops(other);
        if (oc.length > 1) {
          report.conflicts.push(`${card.field} ${year}: ${other.map(r => `${r.crop} (${r.source.replace(/^2025 /, '')})`).join(' vs ')}`);
          continue;
        }
        crop = oc[0];
      }
      const yields = harvest.map(r => r.yield).filter(v => typeof v === 'number' && v > 0);
      const whole = recs[0].field !== card.field && targetsFor(recs[0].field).whole ? `Recorded for the whole field ${recs[0].field}. ` : '';
      const sources = [...new Set(recs.map(r => r.source))].join('; ');
      if (!out.has(id)) out.set(id, []);
      out.get(id).push({ year, crop, yieldPerAcre: yields.length ? yields[0] : undefined, notes: `${whole}${note}Source: ${sources}` });
    }
  }
  return { entries: out, report };
}

async function applyCropHistoryImport() {
  if (await AppliedUpdate.findOne({ key: KEY }).lean()) return [];
  const cards = await CroppingField.find({ farm: { $ne: 'LUEKING' } }).lean();
  const { entries, report } = resolve(cards);
  const summary = [];
  let added = 0; let filled = 0; let crop2025Set = 0;

  for (const [id, list] of entries) {
    const card = cards.find(c => String(c._id) === id);
    const history = (card.cropHistory || []).map(h => ({ ...h }));
    let changed = false;
    for (const e of list.sort((a, b) => a.year - b.year)) {
      const cur = history.find(h => h.year === e.year);
      if (!cur) {
        const add = { year: e.year, crop: e.crop, notes: e.notes };
        if (e.yieldPerAcre) add.yieldPerAcre = e.yieldPerAcre;
        history.push(add); added++; changed = true;
        continue;
      }
      if (!cur.crop) {
        cur.crop = e.crop; filled++; changed = true;
        if (e.yieldPerAcre && !cur.yieldPerAcre) cur.yieldPerAcre = e.yieldPerAcre;
        if (!cur.notes) cur.notes = e.notes;
      } else if (normName(cur.crop) !== e.crop) {
        report.conflicts.push(`${card.field} ${e.year}: card has ${cur.crop}, records show ${e.crop}; card kept`);
      } else if (e.yieldPerAcre && !cur.yieldPerAcre) {
        cur.yieldPerAcre = e.yieldPerAcre; filled++; changed = true;
      }
    }

    const set = {};
    if (changed) set.cropHistory = history.sort((a, b) => b.year - a.year);
    const c25 = list.find(e => e.year === 2025);
    if (c25) {
      const cur = card.crop2025;
      const lab = labCrop2025(card.field);
      if (!cur || !String(cur).trim() || (lab && normName(cur) === lab && lab !== c25.crop)) {
        set.crop2025 = c25.crop; crop2025Set++;
      } else if (normName(cur) !== c25.crop) {
        report.conflicts.push(`${card.field} 2025 crop: card has ${cur}, records show ${c25.crop}; card kept`);
      }
    }
    if (Object.keys(set).length) await CroppingField.updateOne({ _id: card._id }, { $set: set });
  }

  // 2025 crops set earlier from the soil lab samples, on cards the records
  // leave without a 2025 crop: cleared, since the lab crop is usually 2024's.
  let cleared = 0;
  for (const card of cards) {
    if ((entries.get(String(card._id)) || []).some(e => e.year === 2025)) continue;
    const lab = labCrop2025(card.field);
    if (lab && card.crop2025 && normName(card.crop2025) === lab) {
      await CroppingField.updateOne({ _id: card._id }, { $set: { crop2025: '' } });
      summary.push(`${card.field}: 2025 crop ${card.crop2025} (from the soil lab sample) cleared; confirm the 2025 crop`);
      cleared++;
    }
  }

  summary.unshift(`2025 crop cleared on ${cleared} cards`);
  summary.unshift(`${added} crop years added, ${filled} filled, 2025 crop set on ${crop2025Set} cards`);
  report.conflicts.forEach(c => summary.push('Not loaded, records disagree: ' + c));
  report.held.forEach(h => summary.push('Held: ' + h));
  report.unmatched.forEach(u => summary.push('No card for: ' + u));
  await AppliedUpdate.create({ key: KEY, summary });
  return summary;
}

module.exports = { applyCropHistoryImport, resolve, KEY };
