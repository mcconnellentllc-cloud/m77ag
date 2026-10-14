// Landlord season summary renderer. Shared by the admin management view
// (/admin/farming/landlord-summary.html) and the landlord portal, so both
// read the same numbers. Input is the data object from
// GET /api/landlord-summary.
(function (global) {
  'use strict';

  const OP_LABELS = {
    tillage: 'Tillage', spray: 'Spray', fertilizer: 'Fertilizer',
    seeding: 'Seeding', harvest: 'Harvest', other: 'Other'
  };

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function num(n, d) {
    const v = Number(n) || 0;
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function money(n) { return '$' + num(n, 2); }
  function pct(n) { return num((Number(n) || 0) * 100, 0) + '%'; }
  function date(d) {
    if (!d) return '';
    const x = new Date(d);
    if (isNaN(x)) return '';
    return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  function cropLabel(crop, year) {
    if (!crop) return 'Unassigned';
    return crop + ' ' + String(year).slice(-2);
  }

  function tile(label, value, sub) {
    return '<div class="ls-tile"><div class="ls-k">' + esc(label) + '</div><div class="ls-v">' + value +
      '</div>' + (sub ? '<div class="ls-s">' + sub + '</div>' : '') + '</div>';
  }

  function totalsTiles(t, opts) {
    const tiles = [
      tile('Fields', num(t.fields, 0), num(t.acres, 2) + ' acres'),
      tile('Crop acres', num(t.cropAcres, 2), 'excludes fallow and pasture'),
      tile('Harvest', num(t.harvestBu, 2) + ' bu', 'landlord share ' + num(t.landlordBu, 2) + ' bu'),
      tile('Crop insurance', money(t.landlordInsurance), 'landlord share of ' + money(t.insurancePayable) + ' paid'),
      tile('Seed cost share', money(t.seedLandlordAmount),
        money(t.seedBilled) + ' billed, ' + money(t.seedUnbilled) + ' not yet billed' +
        (t.seedUnpriced ? ', ' + t.seedUnpriced + ' entr' + (t.seedUnpriced === 1 ? 'y' : 'ies') + ' awaiting price' : ''))
    ];
    if (opts && opts.farmCount) tiles.unshift(tile('Landlord farms', num(opts.farmCount, 0)));
    return '<div class="ls-tiles">' + tiles.join('') + '</div>';
  }

  function opLine(o) {
    const bits = [];
    if (o.variety) bits.push(esc(o.variety));
    if (o.seedLbPerAcre) bits.push(num(o.seedLbPerAcre, 0) + ' lb/ac');
    if (o.products && o.products.length) {
      bits.push(o.products.map(p => esc(p.name) + (p.rate ? ' ' + num(p.rate, 2) + ' ' + esc(p.rateUnit || '') : '')).join(', '));
    }
    if (o.type === 'harvest' && o.netBu) bits.push(num(o.netBu, 2) + ' bu');
    const when = o.startDate ? date(o.startDate) + (o.endDate && date(o.endDate) !== date(o.startDate) ? ' to ' + date(o.endDate) : '') : '';
    let html = '<li><span class="ls-op-type">' + esc(OP_LABELS[o.type] || o.type) + '</span> ' +
      '<span class="ls-op-status ls-' + esc(o.status) + '">' + (o.status === 'planned' ? 'Planned' : 'Completed') + '</span> ' +
      esc(o.title || '') + (when ? ' <span class="ls-muted">' + when + '</span>' : '') +
      (o.acres ? ' <span class="ls-muted">' + num(o.acres, 2) + ' ac</span>' : '') +
      (bits.length ? '<div class="ls-muted">' + bits.join(' | ') + '</div>' : '');
    if (o.tickets && o.tickets.length) {
      html += '<div class="ls-tickets">' + o.tickets.map(t =>
        'Ticket ' + esc(t.ticketNo) + (t.elevator ? ' (' + esc(t.elevator) + ')' : '') + ': ' + num(t.netBu, 2) + ' bu' +
        (t.testWeight ? ', TW ' + num(t.testWeight, 1) : '') + (t.moisture ? ', ' + num(t.moisture, 1) + '% moist' : '') +
        (t.protein ? ', ' + num(t.protein, 1) + '% protein' : '')).join('<br>') + '</div>';
    }
    if (o.notes) html += '<div class="ls-note">' + esc(o.notes) + '</div>';
    return html + '</li>';
  }

  function fieldDetail(f, year) {
    let html = '<div class="ls-detail">';
    if (f.insurance.length) {
      html += '<h4>Crop insurance</h4><ul>' + f.insurance.map(i =>
        '<li>' + ['Unit ' + esc(i.unitNumber), esc(i.crop || ''), esc(i.plan || ''),
          i.coverageLevel ? num(i.coverageLevel, 0) + '%' : ''].filter(Boolean).join(' ') +
        ': ' + num(i.insuredAcres, 2) + ' ac, APH ' + num(i.aph, 0) +
        ', guarantee ' + num(i.guaranteeBuPerAcre, 1) + ' bu/ac' +
        (i.productionToCountBu !== undefined && i.productionToCountBu !== null ? ', production to count ' + num(i.productionToCountBu, 1) + ' bu' : '') +
        '<div class="ls-muted">Paid ' + money(i.totalPayable) + (i.claimDate ? ' on ' + date(i.claimDate) : '') +
        ', landlord share ' + pct(i.landlordShare) + ' = <strong>' + money(i.landlordAmount) + '</strong>' +
        (i.policyNumber ? ' | ' + esc(i.company || '') + ' policy ' + esc(i.policyNumber) + (i.claimNumber ? ', claim ' + esc(i.claimNumber) : '') + (i.checkNumber ? ', check ' + esc(i.checkNumber) : '') : '') +
        '</div>' + (i.notes ? '<div class="ls-note">' + esc(i.notes) + '</div>' : '') + '</li>').join('') + '</ul>';
    }
    if (f.seed.length) {
      html += '<h4>Seed cost share</h4><ul>' + f.seed.map(s =>
        '<li>' + esc(s.product) + ': ' + num(s.quantityLb, 0) + ' lb (' + num(s.bushels, 2) + ' bu)' +
        (s.estimated ? ' <span class="ls-muted">estimated</span>' : '') +
        '<div class="ls-muted">' + (s.priced
          ? 'Landlord share ' + pct(s.landlordShare) + ' = <strong>' + money(s.landlordAmount) + '</strong>' +
            (s.statementNumber ? ', billed on statement ' + esc(s.statementNumber) : ', not yet billed')
          : 'Awaiting price') + '</div></li>').join('') + '</ul>';
    }
    if (f.operations.length) {
      html += '<h4>Field records</h4><ul>' + f.operations.map(opLine).join('') + '</ul>';
    }
    if (!f.insurance.length && !f.seed.length && !f.operations.length) {
      html += '<p class="ls-muted">No records for the ' + year + ' crop year yet.</p>';
    }
    return html + '</div>';
  }

  function farmBlock(farm, year) {
    const t = farm.totals;
    let rows = farm.fields.map((f, i) =>
      '<tr class="ls-row" data-ls-toggle="' + esc(farm.id) + '-' + i + '" tabindex="0" aria-expanded="false">' +
      '<td><strong>' + esc(f.name) + '</strong></td>' +
      '<td class="num">' + num(f.acres, 2) + '</td>' +
      '<td>' + esc(cropLabel(f.crop, year)) + '</td>' +
      '<td class="num">' + pct(f.share) + '</td>' +
      '<td class="num">' + (f.harvestBu ? num(f.harvestBu, 2) : '-') + '</td>' +
      '<td class="num">' + (f.landlordBu ? num(f.landlordBu, 2) : '-') + '</td>' +
      '<td class="num">' + (f.landlordInsurance ? money(f.landlordInsurance) : '-') + '</td>' +
      '<td class="num">' + (f.seed.some(s => s.priced) ? money(f.seed.reduce((a, s) => a + (s.priced ? s.landlordAmount : 0), 0)) : (f.seed.length ? 'Pending' : '-')) + '</td>' +
      '<td class="num">' + f.operations.length + '</td>' +
      '</tr><tr class="ls-detail-row" id="ls-d-' + esc(farm.id) + '-' + i + '" hidden><td colspan="9">' + fieldDetail(f, year) + '</td></tr>'
    ).join('');
    if (!rows) rows = '<tr><td colspan="9" class="ls-muted">No fields linked to this farm.</td></tr>';
    return '<section class="ls-farm">' +
      '<div class="ls-farm-head"><div><h3>' + esc(farm.landlordName) + '</h3><div class="ls-muted">' + esc(farm.name) +
      ' | landlord share ' + pct(farm.defaultShare) + '</div></div></div>' +
      totalsTiles(t) +
      '<div class="ls-table-wrap"><table class="ls-table"><thead><tr>' +
      '<th>Field</th><th class="num">Acres</th><th>Crop ' + year + '</th><th class="num">Share</th>' +
      '<th class="num">Harvest bu</th><th class="num">Landlord bu</th><th class="num">Insurance (LL)</th>' +
      '<th class="num">Seed (LL)</th><th class="num">Records</th></tr></thead><tbody>' + rows +
      '</tbody></table></div><p class="ls-muted ls-hint">Select a field to see its records.</p></section>';
  }

  function overviewTable(data) {
    const rows = data.farms.map(f =>
      '<tr class="ls-pick" data-ls-farm="' + esc(f.id) + '" tabindex="0">' +
      '<td><strong>' + esc(f.landlordName) + '</strong><div class="ls-muted">' + esc(f.name) + '</div></td>' +
      '<td class="num">' + f.totals.fields + '</td>' +
      '<td class="num">' + num(f.totals.acres, 2) + '</td>' +
      '<td class="num">' + num(f.totals.harvestBu, 2) + '</td>' +
      '<td class="num">' + num(f.totals.landlordBu, 2) + '</td>' +
      '<td class="num">' + money(f.totals.landlordInsurance) + '</td>' +
      '<td class="num">' + money(f.totals.seedLandlordAmount) + '</td>' +
      '<td class="num">' + money(f.totals.seedUnbilled) + '</td>' +
      '<td class="num">' + f.totals.passesCompleted + ' / ' + f.totals.passesPlanned + '</td></tr>').join('');
    const t = data.totals;
    return '<div class="ls-table-wrap"><table class="ls-table"><thead><tr>' +
      '<th>Landlord</th><th class="num">Fields</th><th class="num">Acres</th><th class="num">Harvest bu</th>' +
      '<th class="num">Landlord bu</th><th class="num">Insurance (LL)</th><th class="num">Seed (LL)</th>' +
      '<th class="num">Seed unbilled</th><th class="num">Passes done / planned</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr><td><strong>Total</strong></td><td class="num">' + t.fields + '</td><td class="num">' + num(t.acres, 2) +
      '</td><td class="num">' + num(t.harvestBu, 2) + '</td><td class="num">' + num(t.landlordBu, 2) +
      '</td><td class="num">' + money(t.landlordInsurance) + '</td><td class="num">' + money(t.seedLandlordAmount) +
      '</td><td class="num">' + money(t.seedUnbilled) + '</td><td></td></tr></tfoot></table></div>';
  }

  // Renders into `el`. opts.overview adds the all-landlords table and grand
  // totals; opts.onPickFarm(id) is called when a landlord row is selected.
  function render(el, data, opts) {
    opts = opts || {};
    const year = data.cropYear;
    let html = '';
    if (!data.farms.length) {
      el.innerHTML = '<p class="ls-muted">No farms are linked to this login yet. Contact M77 AG to have your farms added.</p>';
      return;
    }
    if (opts.overview) {
      html += '<section class="ls-overview"><h3>All landlords, ' + year + ' crop year</h3>' +
        totalsTiles(data.totals, { farmCount: data.farms.length }) + overviewTable(data) + '</section>';
    }
    html += data.farms.map(f => farmBlock(f, year)).join('');
    el.innerHTML = html;

    el.querySelectorAll('[data-ls-toggle]').forEach(row => {
      const toggle = () => {
        const d = el.querySelector('#ls-d-' + row.getAttribute('data-ls-toggle'));
        if (!d) return;
        d.hidden = !d.hidden;
        row.setAttribute('aria-expanded', String(!d.hidden));
      };
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
    if (opts.onPickFarm) {
      el.querySelectorAll('[data-ls-farm]').forEach(row => {
        const pick = () => opts.onPickFarm(row.getAttribute('data-ls-farm'));
        row.addEventListener('click', pick);
        row.addEventListener('keydown', e => { if (e.key === 'Enter') pick(); });
      });
    }
  }

  const CSS = [
    '.ls-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0 16px}',
    '.ls-tile{background:#f5f3f0;border-radius:8px;padding:14px 16px}',
    '.ls-k{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#666}',
    '.ls-v{font-family:Oswald,sans-serif;font-size:24px;color:#2d5016;margin-top:2px}',
    '.ls-s{font-size:12px;color:#666;margin-top:2px}',
    '.ls-overview,.ls-farm{background:#fff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);padding:24px;margin-bottom:24px}',
    '.ls-overview h3,.ls-farm h3{font-family:Oswald,sans-serif;font-weight:500;font-size:22px;color:#2d5016}',
    '.ls-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}',
    '.ls-table{width:100%;border-collapse:collapse;font-size:14px}',
    '.ls-table th{text-align:left;background:#f5f3f0;color:#2d5016;font-family:Oswald,sans-serif;font-weight:500;letter-spacing:.5px;padding:10px 12px;white-space:nowrap}',
    '.ls-table td{padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top}',
    '.ls-table tfoot td{border-top:2px solid #2d5016;font-weight:600}',
    '.ls-table .num{text-align:right;white-space:nowrap}',
    '.ls-row,.ls-pick{cursor:pointer}',
    '.ls-row:hover,.ls-pick:hover{background:#faf8f4}',
    '.ls-row:focus-visible,.ls-pick:focus-visible{outline:3px solid #d4a54a;outline-offset:-3px}',
    '.ls-detail{padding:4px 0 8px;position:sticky;left:12px;max-width:calc(100vw - 88px);white-space:normal}',
    '.ls-table td:first-child{min-width:110px}',
    '.ls-detail h4{font-family:Oswald,sans-serif;font-weight:500;color:#2d5016;margin:10px 0 6px;font-size:15px}',
    '.ls-detail ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}',
    '.ls-detail li{background:#faf8f4;border-radius:6px;padding:8px 12px;font-size:13px}',
    '.ls-op-type{font-weight:600}',
    '.ls-op-status{font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:1px 8px;border-radius:999px;background:#e8efe1;color:#2d5016}',
    '.ls-op-status.ls-planned{background:#fbf3e2;color:#8a6d00}',
    '.ls-tickets{font-size:12px;color:#444;margin-top:4px}',
    '.ls-note{font-size:12px;color:#8a6d00;margin-top:4px}',
    '.ls-muted{color:#888;font-size:12px}',
    '.ls-hint{margin-top:8px}',
    '@media (max-width:700px){.ls-overview,.ls-farm{padding:18px 16px}.ls-v{font-size:20px}.ls-tiles{grid-template-columns:1fr 1fr}.ls-tile{padding:10px 12px}}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('ls-styles')) return;
    const s = document.createElement('style');
    s.id = 'ls-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  global.LandlordSummaryView = { render, injectStyles, esc };
})(window);
