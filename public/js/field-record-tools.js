// Field record tools shared by Field Records (/admin/field-manager) and Field
// Setup (/admin/fields.html): the season records review panel, the gap
// check, costing passes from the rate list, and the per-pass cost line.
//
// const tools = FieldRecordTools.create({
//   seasonEl, gapEl,            // containers for the two panels
//   getYear: () => 2026,        // crop year the gap check runs for
//   notify: (kind, message) => {}, // 'success' | 'error'
//   onChange: async () => {}    // reload the cards after records change
// });
(function (global) {
  'use strict';

  const SEASON_IMPORT_ID = 'season-2026';
  const OP_LABELS = { tillage: 'Tillage', spray: 'Spray', fertilizer: 'Fertilizer', seeding: 'Seeding', harvest: 'Harvest', other: 'Other' };

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtNum(n, d) {
    return n === null || n === undefined ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtDay(d) {
    return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
  }
  function fmtRange(a, b) {
    if (!a) return 'Date not on file';
    if (!b || fmtDay(a) === fmtDay(b)) return fmtDay(a);
    return fmtDay(a) + ' to ' + fmtDay(b);
  }
  function yy(y) { return String(y).slice(-2); }
  function money2(n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function authHeaders() {
    let t = null;
    try { t = localStorage.getItem('adminToken'); } catch (e) { /* storage blocked */ }
    return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) };
  }
  async function opsRequest(path, opts) {
    const res = await fetch('/api/field-operations' + path, { ...(opts || {}), headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.message || 'Request failed (' + res.status + ')');
    return data;
  }

  function create(cfg) {
    const notify = cfg.notify || function () {};
    const onChange = cfg.onChange || async function () {};
    let opRates = [];
    let seasonData = null;
    let gapData = [];

    async function loadRates() {
      if (opRates.length) return opRates;
      try {
        const res = await fetch('/api/field-operation-rates', { headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) opRates = data.data.RATES || [];
      } catch (e) {
        console.warn('Rate list load failed:', e.message);
      }
      return opRates;
    }

    // Machine cost line for one pass, with a rate selector on completed passes.
    function costLine(o) {
      const c = o.cost && o.cost.rateKey ? o.cost : null;
      const opts = '<option value="">No cost</option>' + opRates.map(r =>
        `<option value="${esc(r.key)}" ${c && c.rateKey === r.key ? 'selected' : ''}>${esc(r.label)} (${money2(r.rate)}/${esc(r.unit)})</option>`).join('');
      const text = c
        ? `<strong>${money2(c.amount)}</strong> <span style="color:#888;">${fmtNum(c.units, c.unit === 'bushel' ? 2 : 1)} ${esc(c.unit)}${c.units === 1 ? '' : 's'} × ${money2(c.rate)} · ${esc(c.rateLabel)}${c.setBy === 'manual' ? ' · set by hand' : ''}</span>`
        : (o.status === 'planned' ? '<span style="color:#888;">Planned; costed once completed</span>' : '<span style="color:#a02818;">Not costed</span>');
      return `<div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;"><span style="color:#888;">Machine cost</span><span style="text-align:right;">${text}</span></div>` +
        (o.status === 'completed' && opRates.length ? `<select data-op-rate="${esc(o._id)}" aria-label="Rate for this pass" style="padding:6px; border:1px solid #ddd; border-radius:5px; font-size:16px; max-width:100%;">${opts}</select>` : '');
    }

    // Full record block (used by Field Records cards).
    function recordBlock(o, fieldAcres) {
      const line = (label, value) => `<div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:#888;">${label}</span><span style="text-align:right;">${value}</span></div>`;
      const parts = [];
      if (o.acres != null) parts.push(line('Acres', fmtNum(o.acres, 1)));
      if (o.variety) parts.push(line('Variety', esc(o.variety)));
      if (o.operator || o.equipment) parts.push(line('Operator', esc([o.operator, o.equipment].filter(Boolean).join(' · '))));
      if (o.seedLb != null) parts.push(line('Seed', fmtNum(o.seedLb, 0) + ' lb' + (o.seedLbPerAcre != null ? ' · ' + fmtNum(o.seedLbPerAcre, 1) + ' lb/ac' : '')));
      if (o.products && o.products.length) parts.push(line('Products', o.products.map(p => esc(p.name) +
        (p.rate != null ? ' ' + p.rate + ' ' + esc(p.rateUnit || '') : '') + (p.total != null ? ' (' + fmtNum(p.total, 2) + ' ' + esc(p.totalUnit || '') + ')' : '')).join('<br>')));
      if (o.netBu != null) parts.push(line('Delivered', '<strong>' + fmtNum(o.netBu, 2) + ' bu</strong>' + (fieldAcres ? ' · ' + fmtNum(o.netBu / fieldAcres, 1) + ' bu/ac' : '')));
      if (o.combineAcres != null) parts.push(line('Combine monitor', fmtNum(o.combineAcres, 1) + ' ac · ' + fmtNum(o.combineBu, 0) + ' bu'));
      const tickets = (o.tickets || []).map(t => `<div style="border-top:1px dashed #e3e3e3; padding-top:4px; margin-top:4px;">
        <strong>${esc(t.ticketNo)}</strong> · ${fmtDay(t.date)} · ${esc(t.elevator || '')} · ${fmtNum(t.netBu, 2)} bu</div>`).join('');
      const badge = o.status === 'planned' ? 'Planned' : o.assumed ? 'Assumed, not recorded' : '';
      return `<div style="background:#fff; border:1px solid #e6e1d6; border-radius:5px; padding:10px 12px; margin-top:8px; font-size:12px; display:grid; gap:4px;">
        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
          <strong style="font-size:13px;">${OP_LABELS[o.type] || esc(o.type)}: ${esc(o.title || '')}</strong>
          <span>${badge ? `<span style="background:#fbf3e2; color:#8a6d00; border:1px solid #d4a54a; padding:1px 8px; border-radius:10px; font-size:11px; font-weight:600;">${badge}</span> ` : ''}<span style="color:#888;">${esc(o.crop)} ${yy(o.cropYear)}</span></span>
        </div>
        <div style="color:#666;">${fmtRange(o.startDate, o.endDate)}</div>
        ${parts.join('')}${tickets}
        ${costLine(o)}
        ${o.notes ? `<div style="color:#8a6d00;">${esc(o.notes)}</div>` : ''}
        ${o.source ? `<div style="color:#999; font-size:11px;">Source: ${esc(o.source)}</div>` : ''}
      </div>`;
    }

    // Year total for a set of records: { total, perAcre, costed, uncosted }.
    function costSummary(ops, acres) {
      const costed = ops.filter(o => o.cost && o.cost.rateKey);
      const total = costed.reduce((s, o) => s + (o.cost.amount || 0), 0);
      return { total, perAcre: acres ? total / acres : null, costed: costed.length,
        uncosted: ops.filter(o => o.status === 'completed' && !(o.cost && o.cost.rateKey) &&
          // Nothing harvested (appraised or abandoned): no combine pass to cost.
          !(o.type === 'harvest' && !(o.combineAcres > 0) && !(o.acres > 0) && !(o.netBu > 0))).length };
    }

    async function setRate(id, rateKey) {
      try {
        const r = await opsRequest('/' + id + '/cost', { method: 'PUT', body: JSON.stringify({ rateKey: rateKey || null }) });
        notify('success', r.message);
      } catch (e) {
        notify('error', 'Could not set the rate: ' + e.message);
      }
      await onChange();
    }

    async function costAll(btn) {
      if (btn) btn.disabled = true;
      try {
        const r = await opsRequest('/costs/apply', { method: 'POST', body: JSON.stringify({}) });
        const skipped = r.data.skipped || [];
        notify(skipped.length ? 'error' : 'success', r.message + (skipped.length ? '. Needs a rate or acres: ' +
          skipped.slice(0, 12).map(x => (x.field || '') + ' ' + (x.title || '') + ' (' + x.reason + ')').join('; ') +
          (skipped.length > 12 ? '; and ' + (skipped.length - 12) + ' more' : '') : ''));
        await onChange();
      } catch (e) {
        notify('error', 'Could not cost the records: ' + e.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    // ---------- Season records review ----------
    function seasonSummary(r) {
      const bits = [];
      if (r.variety) bits.push(r.variety);
      if (r.acres != null) bits.push(fmtNum(r.acres, 1) + ' ac');
      if (r.seedLb != null) bits.push(fmtNum(r.seedLb, 0) + ' lb');
      if (r.netBu != null) bits.push(fmtNum(r.netBu, 2) + ' bu');
      return bits.join(' · ');
    }
    function renderSeason() {
      const el = cfg.seasonEl;
      if (!seasonData) { el.innerHTML = '<p>Loading...</p>'; return; }
      const opts = seasonData.fields.map(fl => `<option value="${esc(fl._id)}">${esc(fl.name)}${fl.farmName ? ' (' + esc(fl.farmName) + ')' : ''}</option>`).join('');
      function isOps(r) { return /^(app26|sd26|till26)-/.test(String(r.key)); }
      const groups = [
        ['Wheat 2026 harvest', r => r.cropYear === 2026 && r.type === 'harvest'],
        ['Wheat 2026 planting (fall 2025)', r => !isOps(r) && r.cropYear === 2026 && r.type === 'seeding'],
        ['Wheat 2027 drilling (Oct 2026)', r => !isOps(r) && r.cropYear === 2027 && r.type === 'seeding'],
        ['Fall chemfallow for corn 2027', r => !isOps(r) && r.cropYear === 2027 && r.type === 'spray'],
        ['Planting (Ops Center Seeding 2026; 2025 milo)', r => isOps(r) && r.type === 'seeding'],
        ['Spray passes (Ops Center Application 2026)', r => isOps(r) && r.type === 'spray'],
        ['Tillage (Ops Center Tillage 2026)', r => isOps(r) && r.type === 'tillage']
      ];
      const rows = groups.map(([label, test]) => {
        const recs = seasonData.records.filter(test);
        if (!recs.length) return '';
        return `<tr><td colspan="4" style="background:#f5f3f0; font-weight:700; color:#2d5016; padding:8px;">${label}</td></tr>` + recs.map(r => {
          const target = r.addedTo ? String(r.addedTo.m77Field) : (r.suggested || '');
          const status = r.outdated ? '<span style="color:#8a6d00; font-weight:600;">Update available</span>'
            : r.addedTo ? '<span style="color:#2d5016; font-weight:600;">On card</span>'
            : r.suggested ? '<span style="color:#2d5016;">Matched</span>'
            : '<span style="color:#a02818;">' + (r.candidateCount > 1 ? 'Pick field (' + r.candidateCount + ' match)' : 'Pick field') + '</span>';
          return `<tr>
            <td style="padding:6px;"><input type="checkbox" data-season-check="${esc(r.key)}" ${(!r.addedTo && r.suggested && !r.review) || r.outdated ? 'checked' : ''} aria-label="Add ${esc(r.key)}"></td>
            <td style="padding:6px;"><strong>${esc(r.fieldHint)}</strong> · ${esc(r.title || '')}<br><span style="color:#888; font-size:12px;">${fmtRange(r.startDate, r.endDate)}${seasonSummary(r) ? ' · ' + esc(seasonSummary(r)) : ''}</span></td>
            <td style="padding:6px;"><select data-season-field="${esc(r.key)}" style="padding:6px; border:1px solid #ddd; border-radius:5px; font-size:16px; max-width:220px;"><option value="">Choose field</option>${opts}</select></td>
            <td style="padding:6px; font-size:12px;">${status}${r.review && !r.addedTo ? `<div style="color:#8a6d00; margin-top:2px;">${esc(r.review)}</div>` : ''}${r.cropFromCard ? '<div style="color:#888; margin-top:2px;">Crop from the card</div>' : ''}${r.cropFromRotation ? '<div style="color:#888; margin-top:2px;">Charged to the next harvested crop (card, else wheat → corn → milo → fallow → wheat)</div>' : ''}</td>
          </tr>`.replace(`<option value="${esc(target)}">`, target ? `<option value="${esc(target)}" selected>` : '<option value="__none__">');
        }).join('');
      }).join('');
      const pending = seasonData.records.filter(r => !r.addedTo).length;
      const outdated = seasonData.records.filter(r => r.outdated).length;
      const retired = seasonData.retired || [];
      const retiredHtml = retired.length ? `
        <div style="background:#fbf3e2; border-radius:6px; padding:10px 12px; margin-bottom:10px; font-size:13px;">
          <strong>Replaced by newer data: remove from the cards</strong>
          <div style="color:#666; margin:2px 0 6px;">These records came from an earlier version of this list (for example planting inferred from starter, now replaced by the seeding report).</div>
          ${retired.map(r => `<label style="display:flex; gap:8px; align-items:center; padding:3px 0;"><input type="checkbox" data-season-retire="${esc(r.id)}" checked> ${esc(r.fieldName || '')} · ${esc(r.title || '')} · ${esc(r.crop || '')} ${yy(r.cropYear)}</label>`).join('')}
        </div>` : '';
      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
          <div>
            <h2 style="font-family:'Oswald',sans-serif; color:#2d5016; font-size:20px; margin:0;">2026 Season Records</h2>
            <p style="margin:4px 0 0; color:#666; font-size:13px;">Harvest tickets, planting, drilling, spray and tillage passes. Check the field for each record, then add the checked records to their cards. Add planting before tillage. ${pending} not on a card yet.${outdated ? ' ' + outdated + ' on a card with newer data available.' : ''}</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-sm" data-frt="season-apply">Add checked records</button>
            <button class="btn btn-secondary btn-sm" data-frt="season-close">Close</button>
          </div>
        </div>
        ${retiredHtml}
        <div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; font-size:13px; min-width:560px;"><tbody>${rows}</tbody></table></div>`;
    }
    async function openSeason() {
      const el = cfg.seasonEl;
      el.style.display = '';
      seasonData = null;
      renderSeason();
      try {
        seasonData = (await opsRequest('/imports/' + SEASON_IMPORT_ID)).data;
        renderSeason();
      } catch (e) {
        el.innerHTML = '<p style="color:#a02818;">Could not load the records: ' + esc(e.message) + '</p>';
      }
    }
    async function applySeason() {
      const el = cfg.seasonEl;
      const assignments = [];
      const missing = [];
      el.querySelectorAll('[data-season-check]:checked').forEach(cb => {
        const key = cb.getAttribute('data-season-check');
        const sel = el.querySelector(`[data-season-field="${CSS.escape(key)}"]`);
        if (sel && sel.value && sel.value !== '__none__') assignments.push({ key, m77Field: sel.value });
        else missing.push(key);
      });
      const retire = [...el.querySelectorAll('[data-season-retire]:checked')].map(cb => cb.getAttribute('data-season-retire'));
      if (missing.length) return notify('error', 'Choose a field for: ' + missing.join(', '));
      if (!assignments.length && !retire.length) return notify('error', 'Check at least one record.');
      try {
        const data = await opsRequest('/imports/' + SEASON_IMPORT_ID, { method: 'POST', body: JSON.stringify({ assignments, retire }) });
        notify('success', data.message || 'Records added.');
        seasonData = (await opsRequest('/imports/' + SEASON_IMPORT_ID)).data;
        renderSeason();
        await onChange();
      } catch (e) {
        notify('error', 'Could not add the records: ' + e.message);
      }
    }

    // ---------- Gap check ----------
    async function openGaps() {
      const el = cfg.gapEl;
      const year = cfg.getYear();
      el.style.display = '';
      el.innerHTML = '<p>Checking ' + year + ' field records...</p>';
      try {
        gapData = (await opsRequest('/gaps?cropYear=' + year)).data;
        renderGaps(year);
      } catch (e) {
        el.innerHTML = '<p style="color:#a02818;">Could not check: ' + esc(e.message) + '</p>';
      }
    }
    function renderGaps(year) {
      const el = cfg.gapEl;
      const blocks = gapData.map((g, i) => `
        <div style="border:1px solid #eee; border-radius:6px; padding:12px; margin-top:10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <strong>${esc(g.crop)} ${yy(g.cropYear)} · ${OP_LABELS[g.pass.type] || esc(g.pass.type)}: ${esc(g.pass.title || '')}</strong>
            <span style="color:#666; font-size:13px;">On ${g.pass.count} of ${g.fieldCount} ${esc(g.crop.toLowerCase())} fields${g.pass.startDate ? ' · ' + fmtDay(g.pass.startDate) : ''}</span>
          </div>
          ${g.pass.products && g.pass.products.length ? `<div style="color:#888; font-size:12px; margin-top:2px;">${g.pass.products.map(p => esc(p.name)).join(', ')}</div>` : ''}
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
            ${g.missing.map(f => `<label style="display:flex; gap:6px; align-items:center; background:#fbf3e2; border-radius:5px; padding:6px 10px; font-size:13px;">
              <input type="checkbox" data-gap="${i}" value="${esc(f.id)}" checked> ${esc(f.name)} <span style="color:#888;">${fmtNum(f.acres, 1)} ac${f.plannedId ? ' · planned on card' : ''}</span></label>`).join('')}
          </div>
          <button class="btn btn-sm" style="margin-top:8px;" data-frt="gap-fill" data-gap-index="${i}">Add as assumed (not recorded)</button>
        </div>`).join('');
      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
          <div>
            <h2 style="font-family:'Oswald',sans-serif; color:#2d5016; font-size:20px; margin:0;">Gaps · ${year}</h2>
            <p style="margin:4px 0 0; color:#666; font-size:13px;">Passes that more than half the fields of a crop got, and the fields of that crop without them. Uncheck any field that truly was not done. Assumed passes copy the date, products and rate from a recorded field and use the card's acres.</p>
          </div>
          <button class="btn btn-secondary btn-sm" data-frt="gap-close">Close</button>
        </div>
        ${blocks || '<p style="margin-top:10px; color:#2d5016;">No gaps: every pass is on all fields of its crop, or on half or fewer (not treated as a standard pass).</p>'}`;
    }
    async function fillGap(i, btn) {
      const g = gapData[i];
      const ids = [...cfg.gapEl.querySelectorAll(`[data-gap="${i}"]:checked`)].map(c => c.value);
      if (!ids.length) return;
      btn.disabled = true;
      try {
        const r = await opsRequest('/gaps/fill', { method: 'POST', body: JSON.stringify({ exampleId: g.pass.exampleId, m77Fields: ids }) });
        notify('success', r.message + ' for ' + g.crop + ' ' + yy(g.cropYear) + ': ' + (g.pass.title || g.pass.type) + '.');
        await onChange();
        await openGaps();
      } catch (e) {
        notify('error', 'Could not add the passes: ' + e.message);
        btn.disabled = false;
      }
    }

    // Panel buttons and rate selectors (event delegation).
    cfg.seasonEl.addEventListener('click', e => {
      const b = e.target.closest('[data-frt]');
      if (!b) return;
      if (b.dataset.frt === 'season-apply') applySeason();
      if (b.dataset.frt === 'season-close') cfg.seasonEl.style.display = 'none';
    });
    cfg.gapEl.addEventListener('click', e => {
      const b = e.target.closest('[data-frt]');
      if (!b) return;
      if (b.dataset.frt === 'gap-close') cfg.gapEl.style.display = 'none';
      if (b.dataset.frt === 'gap-fill') fillGap(Number(b.dataset.gapIndex), b);
    });
    function bindRateSelects(root) {
      root.addEventListener('change', e => {
        const sel = e.target.closest('[data-op-rate]');
        if (sel) setRate(sel.getAttribute('data-op-rate'), sel.value);
      });
    }

    return { loadRates, costLine, recordBlock, costSummary, setRate, costAll, openSeason, openGaps, bindRateSelects, opsRequest, OP_LABELS, money2 };
  }

  global.FieldRecordTools = { create, opsRequest };
})(window);
