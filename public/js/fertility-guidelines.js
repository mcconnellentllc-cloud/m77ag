// Fertility calculator. Applies a standard from the Fertility Standards
// sheet (defaults in server/data/fertilityStandards.js) to one soil sample.
// Shared by the Field Records page and the server, which recomputes plans
// before saving them.
(function (root) {
  'use strict';

  const num = v => (v === null || v === undefined || v === '' || !isFinite(Number(v))) ? null : Number(v);
  const round5 = v => Math.round(v / 5) * 5;
  const clamp0 = v => Math.max(0, v);
  const fmt = v => String(Math.round(v * 100) / 100);

  // First row whose maxPpm holds the value; a null maxPpm is open-ended.
  function rowFor(rows, v) {
    for (const r of rows || []) if (r.maxPpm === null || r.maxPpm === undefined || v <= r.maxPpm) return r;
    return (rows || [])[rows.length - 1];
  }
  const omCol = om => (om <= 1.0 ? 0 : om <= 2.0 ? 1 : 2);
  const omLabel = ['0-1.0%', '1.1-2.0%', 'over 2.0%'];

  // The standard for a crop and water regime: exact water first, then 'any'.
  function findStandard(standards, crop, irrigated) {
    const c = String(crop || '').trim().toUpperCase();
    const want = irrigated ? 'irrigated' : 'dryland';
    const forCrop = (standards || []).filter(s => s.crop === c || (c === 'PROSO MILLET' && s.crop === 'PEARL MILLET'));
    return forCrop.find(s => s.water === want) || forCrop.find(s => s.water === 'any') || null;
  }

  // input: crop, irrigated, expectedYield, no3ppm, no3Depth, om, olsenP, k,
  // zn, ph, bufferPH, excessLime, otherCredits, grainPrice, nPrice
  function recommend(standards, input) {
    const crop = String(input.crop || '').trim().toUpperCase();
    const irrigated = !!input.irrigated;
    const out = { crop, irrigated, supported: false, standardKey: null, title: '', source: '', sourceUrl: '', n: { rate: null, basis: [] }, p: null, k: null, zn: null, notes: [], warnings: [] };
    if (!crop) { out.warnings.push('Choose a crop.'); return out; }
    if (crop === 'FALLOW') { out.notes.push('Fallow: no crop, no fertility recommendation.'); return out; }
    const st = findStandard(standards, crop, irrigated);
    if (!st) {
      out.warnings.push('No ' + (irrigated ? 'irrigated' : 'dryland') + ' standard for ' + crop + ' on the Fertility Standards sheet. Add one, or get a recommendation from the lab or agronomist.');
      return out;
    }
    Object.assign(out, { supported: true, standardKey: st.key, title: st.title, source: st.source, sourceUrl: st.sourceUrl || '' });

    const ey = num(input.expectedYield);
    let no3 = num(input.no3ppm);
    let om = num(input.om);
    const olsenP = num(input.olsenP), k = num(input.k), zn = num(input.zn), ph = num(input.ph);
    const credits = num(input.otherCredits) || 0;
    const depth = input.no3Depth || 'surface';
    if (om === null) { om = 1.5; out.warnings.push('Organic matter not on this sample; 1.5% assumed per CSU for eastern Colorado.'); }
    const n = st.n || {};
    const needYield = n.method !== 'ppm-table';
    if (needYield && !(ey > 0)) out.warnings.push('Enter the expected yield.');
    if (n.nitrateDepth) out.warnings.push('This standard reads nitrate as ' + n.nitrateDepth + '. The sample on file is ' + depth + '; enter the deeper value in Soil nitrate-N if it was sampled.');

    const setN = (v, basis) => { out.n.rate = round5(clamp0(v)); out.n.basis = basis; };
    const creditLine = credits ? 'Less other credits (manure, legume, irrigation water): ' + fmt(credits) + ' lb' : 'No other credits entered';

    // ----- Phosphorus, potassium, zinc first (millet N depends on them) -----
    if (st.p && st.p.rows) {
      if (olsenP === null) out.p = { soilTest: null, level: 'not tested', band: null, broadcast: null, note: 'Olsen P not on this sample.' };
      else { const r = rowFor(st.p.rows, Math.round(olsenP)); out.p = { soilTest: olsenP, level: r.level, band: r.band, broadcast: r.broadcast, note: st.p.note || '' }; }
    }
    if (st.k && st.k.rows) {
      if (k === null) out.k = { soilTest: null, level: 'not tested', rate: null, note: 'Potassium not on this sample.' };
      else { const r = rowFor(st.k.rows, Math.round(k)); out.k = { soilTest: k, level: r.level, rate: r.rate, row: r.row === undefined ? null : r.row, note: st.k.note || '' }; }
    }
    if (st.zn) {
      if (st.zn.none) out.zn = { soilTest: zn, level: 'n/a', band: 0, broadcast: 0, note: st.zn.note || '' };
      else if (zn === null) out.zn = { soilTest: null, level: 'not tested', band: null, broadcast: null, note: 'Zinc not on this sample.' };
      else {
        let rows = st.zn.rows, colNote = '';
        if (st.zn.rowsNonCalcareous) {
          const lime = String(input.excessLime || '').trim().toUpperCase();
          let calc;
          if (lime) calc = lime !== 'N' && lime !== 'NONE';
          else { calc = ph !== null && ph >= 7.4; colNote = 'Excess lime not on the sample; read from pH. '; }
          if (!calc) rows = st.zn.rowsNonCalcareous;
          colNote += (calc ? 'Calcareous' : 'Non-calcareous') + ' soil column. ';
        }
        const r = rowFor(rows, zn);
        out.zn = { soilTest: zn, level: r.level, band: r.band, broadcast: r.broadcast, note: colNote + (st.zn.note || '') };
      }
    }

    // ----- Nitrogen -----
    if (n.method === 'csu-corn') {
      if (no3 === null) out.warnings.push('Soil nitrate-N is needed for the N rate.');
      else if (ey > 0) {
        const need = n.base + n.perBu * ey, cNo3 = n.perPpm * no3, cOm = n.omPerBuPct * ey * om;
        setN(need - cNo3 - cOm - credits, [
          'Crop need ' + n.base + ' + ' + n.perBu + ' x ' + ey + ' bu = ' + fmt(need) + ' lb',
          'Less soil nitrate ' + n.perPpm + ' x ' + no3 + ' ppm = ' + fmt(cNo3) + ' lb',
          'Less organic matter ' + n.omPerBuPct + ' x ' + ey + ' bu x ' + om + '% = ' + fmt(cOm) + ' lb',
          creditLine
        ]);
      }
    } else if (n.method === 'table') {
      if (no3 === null) out.warnings.push('Soil nitrate-N is needed for the N rate.');
      else if (ey > 0) {
        const mult = n.ppmMultiplier || 1, ppm = no3 * mult, c = omCol(om);
        const r = rowFor(n.rows, Math.round(ppm));
        const adj = (n.perTenBu / 10) * (ey - n.basisYield);
        let v = clamp0(r.rates[c] + adj);
        const basis = [
          'Table at ' + n.basisYield + ' bu: ' + (mult !== 1 ? no3 + ' ppm x ' + mult + ' = ' + fmt(ppm) : no3) + ' ppm nitrate, organic matter ' + omLabel[c] + ' = ' + r.rates[c] + ' lb',
          'Yield adjustment ' + n.perTenBu + ' lb per 10 bu from ' + n.basisYield + ' bu: ' + (adj >= 0 ? '+' : '') + fmt(adj) + ' lb'
        ];
        if (n.max !== null && n.max !== undefined && v > n.max) { v = n.max; basis.push('Capped at ' + n.max + ' lb/A'); }
        basis.push(creditLine);
        setN(v - credits, basis);
      }
    } else if (n.method === 'ppm-table') {
      if (no3 === null) out.warnings.push('Soil nitrate-N is needed for the N rate.');
      else {
        const r = rowFor(n.rows, Math.round(no3));
        let v = r.rate;
        const basis = ['Table at ' + n.basisYield + ' bu: ' + no3 + ' ppm nitrate, ' + r.level + ' = ' + r.rate + ' lb'];
        if (n.onlyWithPKRate && r.rate === n.onlyWithPKRate && !(((out.p && out.p.band) || 0) > 0 || ((out.k && out.k.rate) || 0) > 0)) {
          v = 0; basis.push('The ' + n.onlyWithPKRate + ' lb rate applies only when P or K is applied; none is called for');
        }
        basis.push(creditLine);
        setN(v - credits, basis);
      }
    } else if (n.method === 'unl-sorghum') {
      if (no3 === null) { no3 = n.defaultPpm; out.warnings.push('Nitrate not on this sample; ' + n.defaultPpm + ' ppm used per the standard.'); }
      const gp = num(input.grainPrice), np = num(input.nPrice);
      const omUsed = Math.min(om, n.omCap);
      if (!(gp > 0 && np > 0)) out.warnings.push('Enter the grain price ($/bu) and N price ($/lb N). This standard scales the N rate by their ratio.');
      else if (ey > 0) {
        const factor = (gp / np) * n.priceFactor;
        const base = n.base + n.perBu * ey - n.omPer * omUsed - n.perPpm * no3 - credits;
        setN(base * factor, [
          n.base + ' + ' + n.perBu + ' x ' + ey + ' bu = ' + fmt(n.base + n.perBu * ey) + ' lb',
          'Less organic matter ' + n.omPer + ' x ' + omUsed + '%' + (om > n.omCap ? ' (capped at ' + n.omCap + '%)' : '') + ' = ' + fmt(n.omPer * omUsed) + ' lb',
          'Less soil nitrate ' + n.perPpm + ' x ' + no3 + ' ppm = ' + fmt(n.perPpm * no3) + ' lb',
          creditLine,
          'Price factor ($' + gp.toFixed(2) + '/bu / $' + np.toFixed(2) + '/lb N) x ' + n.priceFactor + ' = ' + factor.toFixed(2)
        ]);
      }
    }

    if (st.ironPh && ph !== null && ph > st.ironPh) out.warnings.push('pH ' + ph + ' is above ' + st.ironPh + ': iron chlorosis risk. See the iron note below.');
    if (ph !== null && ph < 6.0) out.warnings.push('pH ' + ph + ' is below 6.0. These standards give no lime rate; use the lab lime requirement from the buffer pH' + (num(input.bufferPH) !== null ? ' (' + input.bufferPH + ')' : '') + '.');
    out.notes = out.notes.concat(st.notes || []);
    return out;
  }

  // Product amounts for a recommendation. Densities: UAN 32% 11.06 lb/gal
  // (3.54 lb N/gal); 10-34-0 11.65 lb/gal (1.17 lb N, 3.96 lb P2O5 per gal).
  function products(rec) {
    const r = {};
    if (rec.n && rec.n.rate > 0) r.n = ['UAN 32%: ' + (rec.n.rate / 3.54).toFixed(1) + ' gal/A', 'Anhydrous 82-0-0: ' + Math.round(rec.n.rate / 0.82) + ' lb/A', 'Urea 46-0-0: ' + Math.round(rec.n.rate / 0.46) + ' lb/A'];
    if (rec.p && rec.p.band > 0) r.pBand = ['10-34-0: ' + (rec.p.band / 3.96).toFixed(1) + ' gal/A (adds ' + Math.round(rec.p.band / 3.96 * 1.17) + ' lb N)', 'MAP 11-52-0: ' + Math.round(rec.p.band / 0.52) + ' lb/A (adds ' + Math.round(rec.p.band / 0.52 * 0.11) + ' lb N)'];
    if (rec.p && rec.p.broadcast > 0) r.pBroadcast = ['MAP 11-52-0: ' + Math.round(rec.p.broadcast / 0.52) + ' lb/A (adds ' + Math.round(rec.p.broadcast / 0.52 * 0.11) + ' lb N)'];
    if (rec.k && rec.k.rate > 0) r.k = ['Potash 0-0-60: ' + Math.round(rec.k.rate / 0.6) + ' lb/A'];
    if (rec.zn && rec.zn.band > 0) r.zn = ['Zinc sulfate 35.5% Zn: ' + (rec.zn.band / 0.355).toFixed(1) + ' lb/A banded, or ' + Math.round(rec.zn.broadcast / 0.355) + ' lb/A broadcast'];
    return r;
  }

  const api = { recommend, products, findStandard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FertilityGuidelines = api;
})(this);
