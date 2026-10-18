// Startup: loads the FSA-578 acreage reports in server/data/fsa578_*.js onto
// the field cards. Each CLU line is upserted (re-runs reconcile to the data
// file). Once per report, each card with CLUs placed on it gets an fsaHistory
// entry, and a card with no crop on file for the program year gets the crop
// FSA has for it. A crop already on a card is never changed; differences are
// listed in the AppliedUpdate summary.
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const FsaCropReport = require('../models/fsaCropReport');
const AppliedUpdate = require('../models/appliedUpdate');

const REPORTS = [require('../data/fsa578_2024')];
const CROP = { CORN: 'CORN', SORGH: 'SORGHUM', WHEAT: 'WHEAT', FALOW: 'FALLOW', TRICL: 'TRITICALE', MILET: 'PEARL MILLET' };
const norm = s => String(s || '').toUpperCase().replace(/\s+/g, ' ').trim();
const isoDate = mdy => { const m = String(mdy || '').match(/^(\d\d)\/(\d\d)\/(\d{4})$/); return m ? new Date(`${m[3]}-${m[1]}-${m[2]}T12:00:00Z`) : null; };

async function cardsByName() {
  const cards = await CroppingField.find({}).select('field cropHistory').lean();
  const regs = await M77Field.find({ legacySource: 'CroppingField' }).select('legacyId').lean();
  const reg = {};
  for (const r of regs) reg[String(r.legacyId)] = r._id;
  const out = {};
  for (const c of cards) out[norm(c.field)] = { card: c, m77Field: reg[String(c._id)] || null };
  return out;
}

async function applyFsaCropReports() {
  const out = [];
  const byName = await cardsByName();
  for (const { REPORT, TRACTS, LINES } of REPORTS) {
    const year = REPORT.programYear;
    const tractOf = {};
    for (const t of TRACTS) tractOf[t.farm + '|' + t.tract] = t;
    const notFound = new Set();
    const ref = name => {
      const hit = byName[norm(name)];
      if (!hit || !hit.m77Field) notFound.add(name);
      return hit ? hit.m77Field : null;
    };
    let upserts = 0;
    for (const l of LINES) {
      const t = tractOf[l.farm + '|' + l.tract] || {};
      const doc = {
        programYear: year, farm: l.farm, tract: l.tract, clu: l.clu, crop: l.crop, varType: l.varType,
        intendedUse: l.intendedUse, irrigation: l.irrigation, acres: l.acres, cropland: l.cropland,
        plantingDate: isoDate(l.plantingDate), endYear: l.endYear, shares: l.shares, location: l.location,
        napUnit: l.napUnit, legal: t.legal, tractCropland: t.cropland, tractFarmland: t.farmland,
        cards: (l.cards || []).map(c => Array.isArray(c)
          ? { fieldName: c[0], m77Field: ref(c[0]), acres: c[1] }
          : { fieldName: c, m77Field: ref(c), acres: l.acres }),
        openOn: (l.openOn || []).map(n => ({ fieldName: n, m77Field: ref(n) })),
        note: l.note, source: `${REPORT.form} ${year}, ${REPORT.source}`
      };
      await FsaCropReport.updateOne({ programYear: year, farm: l.farm, tract: l.tract, clu: l.clu, crop: l.crop, intendedUse: l.intendedUse },
        { $set: doc }, { upsert: true });
      upserts += 1;
    }
    out.push(`${REPORT.form} ${year}: ${upserts} CLU lines on file`);
    if (notFound.size) out.push(`${REPORT.form} ${year}: no card for ${[...notFound].join(', ')}`);

    // Once per report: FSA history on the registry and the program-year crop on cards without one.
    const key = `fsa-crop-report-${year}-cards`;
    if (await AppliedUpdate.exists({ key })) continue;
    const summary = [];
    const perCard = {};
    for (const l of LINES) {
      for (const c of l.cards || []) {
        const name = Array.isArray(c) ? c[0] : c;
        const acres = Array.isArray(c) ? c[1] : l.acres;
        (perCard[name] = perCard[name] || []).push({ ...l, cardAcres: acres });
      }
    }
    for (const [name, lines] of Object.entries(perCard)) {
      const hit = byName[norm(name)];
      if (!hit) continue;
      // fsaHistory, one entry per tract
      if (hit.m77Field) {
        const tractsOn = {};
        for (const l of lines) {
          const k = l.farm + '|' + l.tract;
          const t = tractsOn[k] = tractsOn[k] || { fsn: l.farm, tract: l.tract, acres: 0, owners: new Set(), seen: new Set() };
          if (l.cropland && !t.seen.has(l.clu)) { t.seen.add(l.clu); t.acres += l.cardAcres || 0; }
          for (const s of l.shares) t.owners.add(s.name);
        }
        const f = await M77Field.findById(hit.m77Field);
        for (const t of Object.values(tractsOn)) {
          if ((f.fsaHistory || []).some(h => h.programYear === year && h.fsn === t.fsn && h.tract === t.tract && h.source === REPORT.form)) continue;
          f.fsaHistory.push({ programYear: year, fsn: t.fsn, tract: t.tract, owner: [...t.owners].join('; '),
            acres: Math.round(t.acres * 100) / 100 || null, source: REPORT.form });
        }
        await f.save();
      }
      // Program-year crop: the crop on at least 90% of the card's reported cropland.
      const crops = {};
      let total = 0;
      for (const l of lines) {
        if (!l.cropland || l.intendedUse === '1-GZ' || l.cardAcres == null) continue;
        total += l.cardAcres;
        const c = CROP[l.crop];
        if (c) crops[c] = (crops[c] || 0) + l.cardAcres;
      }
      const top = Object.entries(crops).sort((a, b) => b[1] - a[1])[0];
      const onCard = (hit.card.cropHistory || []).find(h => h.year === year);
      if (!top || top[1] < total * 0.9) {
        if (!onCard && total) summary.push(`${name}: ${year} crops ${Object.entries(crops).map(([c, a]) => c + ' ' + a).join(', ') || 'grass'}; not set`);
        continue;
      }
      const crop = top[0];
      if (onCard) {
        if (norm(onCard.crop) !== crop) summary.push(`${name}: card has ${year} ${onCard.crop}, FSA-578 reports ${crop}; card kept`);
        continue;
      }
      const cluLines = lines.filter(l => CROP[l.crop] === crop && l.intendedUse !== '1-GZ');
      const planted = cluLines.map(l => isoDate(l.plantingDate)).filter(Boolean).sort((a, b) => a - b)[0];
      const grazed = cluLines.some(l => l.intendedUse === 'GZ');
      await CroppingField.updateOne({ _id: hit.card._id }, { $push: { cropHistory: {
        year, crop, plantingDate: planted || undefined,
        notes: `${REPORT.form} ${year}: farm ${cluLines[0].farm} tract ${cluLines[0].tract} CLU ${[...new Set(cluLines.map(l => l.clu))].join(', ')}${grazed ? ' (grazed)' : ''}`
      } } });
      summary.push(`${name}: ${year} ${crop} added from ${REPORT.form}`);
    }
    await AppliedUpdate.updateOne({ key }, { $set: { summary }, $setOnInsert: { appliedAt: new Date() } }, { upsert: true });
    const added = summary.filter(s => / added from /.test(s)).length;
    out.push(`${REPORT.form} ${year}: ${added} cards given their ${year} crop; ${summary.length - added} differences or open items listed`);
  }
  return out;
}

module.exports = { applyFsaCropReports };
