// 2026 season records for the Fields page cards, prepared from the scale
// tickets, combine report, RCIS claim, seed ledgers and the fall work plan.
// fieldHint suggests the matching card (field number with an optional N/S/E/W,
// or an exact field name). Nothing is added to a card until someone confirms
// the field on the Fields page.

const ATRAZINE_RATES = [
  { name: 'Atrazine 4L', rate: 0.330, rateUnit: 'gal/ac', totalUnit: 'gal', perAc: 0.330 },
  { name: 'Xsate', rate: 18, rateUnit: 'fl oz/ac', totalUnit: 'gal', perAc: 18 / 128 },
  { name: 'Flumioxazin 51WDG Select', rate: 3, rateUnit: 'oz/ac', totalUnit: 'lb', perAc: 3 / 16 },
  { name: 'Hydrovant-fA', rate: 1.5, rateUnit: 'fl oz/ac', totalUnit: 'gal', perAc: 1.5 / 128 }
];

function round(n, d) { const f = Math.pow(10, d); return Math.round(n * f) / f; }

// Fall atrazine passes that appear in the Operations Center Application 2026
// report (Corn27 26Fall Atrazine or the Hydrovant-fA pass of the same mix).
// A field listed there counts as sprayed (Kyle, Oct 15, 2026); the logged
// coverage is not used.
const ATRAZINE_DONE = {
  'cf27-23W': '2026-10-14', 'cf27-30W': '2026-10-13', 'cf27-54S': '2026-10-14', 'cf27-55N': '2026-10-13',
  'cf27-32N': '2026-10-14', 'cf27-41': '2026-10-13', 'cf27-42W': '2026-10-14', 'cf27-61S': '2026-10-14'
};

function atrazinePass(key, fieldHint, acres) {
  const done = ATRAZINE_DONE[key];
  if (done) {
    return {
      key, rev: 2, fieldHint, matchBy: 'crop', cropYear: 2027, crop: 'CORN', type: 'spray', status: 'completed',
      title: 'Fall chemfallow: atrazine, flumioxazin, Xsate', startDate: done, endDate: done, acres,
      carrierGalPerAcre: 10,
      products: ATRAZINE_RATES.map(p => ({ name: p.name, rate: p.rate, rateUnit: p.rateUnit, total: round(p.perAc * acres, 2), totalUnit: p.totalUnit })),
      source: 'Operations Center work plan Corn27 26Fall Atrazine; listed in the Application 2026 report',
      notes: 'Completed per the Application 2026 report. Planned rates shown; sprayer coverage logging is not reliable.'
    };
  }
  return {
    key, fieldHint, matchBy: 'crop', cropYear: 2027, crop: 'CORN', type: 'spray', status: 'planned',
    title: 'Fall chemfallow: atrazine, flumioxazin, Xsate', startDate: '2026-10-13', acres,
    carrierGalPerAcre: 10,
    products: ATRAZINE_RATES.map(p => ({ name: p.name, rate: p.rate, rateUnit: p.rateUnit, total: round(p.perAc * acres, 2), totalUnit: p.totalUnit })),
    source: 'Operations Center work plan Corn27 26Fall Atrazine, Oct 13, 2026',
    notes: 'Planned rates. Replace with as-applied when the pass is finished.'
  };
}

const HAXTUN = 'Haxtun (CHS Southern Plains)';
const PAOLI = "Roggen Farmers' Elevator, Paoli";

const RECORDS = [
  // ---- Wheat 2026 harvest ----
  { key: 'h26-55N', fieldHint: '55.N', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-02', endDate: '2026-07-07', netBu: 562.26, combineAcres: 86.9, combineBu: 1471,
    tickets: [{ ticketNo: 'X045342', date: '2026-07-03', elevator: HAXTUN, account: '950891 M77 AG', netBu: 562.26, moisture: 9.8, testWeight: 56.8, protein: 12.6, fieldSource: 'assigned by operator' }],
    source: 'Scale tickets; John Deere combine report',
    notes: 'RCIS counted 1,386.3 bu production on unit 0005-0007 for this field. Tickets on file total 562.26 bu. Confirm with Hofmeister.' },
  { key: 'h26-41', fieldHint: '41', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-07', endDate: '2026-07-07', netBu: 360.23, combineAcres: 82.7, combineBu: 2171,
    tickets: [{ ticketNo: 'X045452', date: '2026-07-07', elevator: HAXTUN, account: '950891 M77 AG', netBu: 360.23, moisture: 10.2, testWeight: 52.6, protein: 13.5, fieldSource: 'RCIS unit 0004-0003 production' }],
    source: 'Scale tickets; RCIS claim 3154486; John Deere combine report',
    notes: 'Kyle\'s ticket file assigns X045452 to 55.N. RCIS counted 360.2 bu on unit 0004-0003, which is this field.' },
  { key: 'h26-42W', fieldHint: '42.W', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-07', endDate: '2026-07-08', netBu: 2074.99,
    tickets: [
      { ticketNo: 'X045469', date: '2026-07-07', elevator: HAXTUN, account: '950895 M77 AG 50% / McConnell Enterprises 50%', netBu: 1250.80, moisture: 9.6, testWeight: 55.3, protein: 12.0, fieldSource: 'printed on ticket' },
      { ticketNo: '80000577', date: '2026-07-08', elevator: PAOLI, account: '805091 M77 AG 412.09 / 805097 McConnell Enterprises 412.10', netBu: 824.19, moisture: 9.5, testWeight: 58.0, protein: 16.2, fieldSource: 'printed on ticket (Farm #42)' }
    ],
    source: 'Scale tickets; RCIS claim 3154486',
    notes: 'Combine logged this ground as "Over East 1/2" (82 ac, 1,315 bu, Jul 7-8).' },
  { key: 'h26-54S', fieldHint: '54.S', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-08', endDate: '2026-07-08', netBu: 1061.44, combineAcres: 71.3, combineBu: 1275,
    tickets: [{ ticketNo: 'X045500', date: '2026-07-09', elevator: HAXTUN, account: '124813 McConnell Enterprises', netBu: 1061.44, moisture: 13.6, testWeight: 57.7, protein: 16.4, fieldSource: 'assigned by operator' }],
    source: 'Scale tickets; John Deere combine report' },
  { key: 'h26-60W', fieldHint: '60', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-11', endDate: '2026-07-11', netBu: 1089.55, combineAcres: 80.2, combineBu: 1297,
    tickets: [{ ticketNo: 'X045539', date: '2026-07-12', elevator: HAXTUN, account: '950891 M77 AG', netBu: 1089.55, moisture: 11.7, testWeight: 56.2, protein: 14.8, fieldSource: 'printed on ticket' }],
    source: 'Scale tickets; John Deere combine report' },
  { key: 'h26-13', fieldHint: '13', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-12', endDate: '2026-07-12', netBu: 535.38, combineAcres: 73.2, combineBu: 792,
    tickets: [{ ticketNo: 'X045543', date: '2026-07-12', elevator: HAXTUN, account: '950891 M77 AG', netBu: 535.38, moisture: 13.2, testWeight: 56.4, protein: 15.3, fieldSource: 'printed on ticket' }],
    source: 'Scale tickets; John Deere combine report' },
  { key: 'h26-30W', fieldHint: '30', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Wheat harvest',
    startDate: '2026-07-12', endDate: '2026-07-13', netBu: 1451.04, combineAcres: 80.3, combineBu: 2020,
    tickets: [
      { ticketNo: 'X045560', date: '2026-07-13', elevator: HAXTUN, account: '391145 Kyle D McConnell', netBu: 1189.73, moisture: 13.5, testWeight: 58.4, protein: 11.6, fieldSource: 'printed on ticket (#30)' },
      { ticketNo: 'X045565', date: '2026-07-13', elevator: HAXTUN, account: '391145 Kyle D McConnell', netBu: 261.31, moisture: 13.1, testWeight: 58.0, protein: 12.7, fieldSource: 'printed on ticket (#30)' }
    ],
    source: 'Scale tickets; John Deere combine report' },
  { key: 'h26-23W', fieldHint: '23.W', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Not harvested: appraised 48.8 bu by RCIS',
    startDate: '2026-07-11', combineAcres: 6.8, combineBu: 96,
    source: 'RCIS claim 3154486 (unit 0005-0002, UH); John Deere combine report',
    notes: 'Combine ran a 6.8 ac strip only.' },
  { key: 'h26-32N', fieldHint: '32.N', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Not harvested',
    source: '2026 wheat harvest records', notes: 'Not on the M77 AG RCIS claim. Confirm which policy covers it.' },
  { key: 'h26-61S', fieldHint: '61.S', cropYear: 2026, crop: 'WHEAT', type: 'harvest', title: 'Not harvested',
    source: '2026 wheat harvest records', notes: 'Not on the M77 AG RCIS claim. Confirm which policy covers it.' },

  // ---- Wheat 2026 planting (fall 2025) ----
  // John Deere Operations Center Field Report "2025 Seeding", printed Oct 14,
  // 2026. Field names in Operations Center changed since fall 2025; the report
  // names are mapped to current fields (confirmed by Kyle, Oct 14, 2026):
  // 12.E->12.W, 13.W->13, 23.E->23.W, 30.W->30, 41.E->41, 42.E->42.W,
  // 61.N->61.S. Report area and applied pounds disagree by about 2x on most
  // passes, so acres are the insured or field acres and the report's own
  // numbers are kept in the notes until the drill records are reconciled.
  ...[
    // hint, start, end, acres, variety, target lb/ac, operator, report passes, RCIS planting date and unit
    ['13', '2025-10-02', '2025-10-02', 70.50, 'WB4347', 61, 'Kyle McConnell',
      '13.W: 154.2 ac, 62 lb/ac applied, 4,745 lb', '2025-10-02 (unit 0002-0001, 70.50 ac)'],
    ['12.W', '2025-10-02', '2025-10-02', undefined, 'WB4347', 60, 'Kyle McConnell',
      '12.E: 4.9 ac, 60 lb/ac applied, 148 lb', null],
    ['60', '2025-10-01', '2025-10-02', 76.36, 'WB4347', 60, 'Kyle McConnell',
      '60.E: 168.7 ac, 60 lb/ac applied, 5,038 lb', '2025-10-02 (unit 0002-0003, 76.36 ac)'],
    ['41', '2025-09-29', '2025-09-29', 78.18, 'KS Providence', 61, 'Kyle McConnell',
      '41.E: 168.4 ac, 57 lb/ac applied, 4,769 lb', '2025-09-29 (unit 0004-0003, 78.18 ac)'],
    ['42.W', '2025-09-30', '2025-10-31', 79.00, 'KS Providence, WB4347; fill-in AP Bigfoot, WB4595', 60, 'Kyle McConnell; fill-in Matt Allphin',
      '42.E Sep 30: 76.6 ac, 57 lb/ac applied, 2,155 lb. 42.E Oct 31 fill-in: 10.3 ac, 69 lb/ac, 353 lb', '2025-09-30 (unit 0004-0004, 79.00 ac)'],
    ['23.W', '2025-10-22', '2025-10-22', 69.70, 'AP Bigfoot', 70, 'Matt Allphin',
      '23.E: 145.2 ac, 69 lb/ac applied, 5,008 lb', '2025-10-11 (unit 0005-0002, 69.70 ac, CC practice)'],
    ['55.N', '2025-09-26', '2025-10-07', 75.67, 'KS Providence; fill-in AP Bigfoot', 62, 'Kyle McConnell',
      '55.N Sep 26: 169.2 ac, 60 lb/ac applied, 5,049 lb. Oct 7 fill-in (8370R): 11.1 ac, 39 lb/ac, 436 lb', '2025-09-22 (unit 0005-0007, 75.67 ac)'],
    ['30', '2025-10-23', '2025-10-24', undefined, 'AP Bigfoot, WB4595', 70, 'Matt Allphin',
      '30.W: 171.7 ac, 63 lb/ac applied, 5,439 lb', null],
    ['32.N', '2025-10-03', '2025-10-04', undefined, 'AP Bigfoot', 60, 'Kyle McConnell, Matt Allphin',
      '32.N: 126.7 ac, 61 lb/ac applied, 5,206 lb (8320R and 8370R)', null],
    ['61.S', '2025-10-03', '2025-10-24', undefined, 'AP Bigfoot; fill-in AP Bigfoot, WB4595', 30, 'Matt Allphin',
      '61.N Oct 3: 39.2 ac, 62 lb/ac applied against a 30 lb/ac target, 1,197 lb, first variety blank. Oct 24 fill-in: 7.4 ac, 68 lb/ac, 253 lb', null]
  ].map(([hint, start, end, acres, variety, target, operator, report, rcis]) => ({
    key: 'p26-' + hint.replace('.', ''), rev: 2, fieldHint: hint, cropYear: 2026, crop: 'WHEAT', type: 'seeding', title: 'Wheat planted',
    startDate: start, endDate: end, acres, variety, operator, equipment: '8320R',
    source: 'John Deere Operations Center Field Report, 2025 Seeding' + (rcis ? '; 2026 Insurance Summary (Hofmeister, Oct 22, 2025)' : ''),
    notes: 'Target ' + target + ' lb/ac. Report: ' + report + '. Report acres and pounds not reconciled.' +
      (rcis ? ' RCIS planting date ' + rcis + '.' : '')
  })),

  // ---- Wheat 2027 drilling (Oct 2026) ----
  ...[
    ['42.E', 'KS Providence', '2026-10-01', '2026-10-01', 82.4, 5905, 71.7],
    ['31.E', 'KS Providence', '2026-10-02', '2026-10-02', 54.4, 4595, 84.5],
    ['12.E', 'KS Providence', '2026-10-02', '2026-10-02', 84.2, 6280, 74.6],
    ['61.N', 'KS Providence', '2026-10-02', '2026-10-07', 85.1, 6025, 70.8],
    ['54.N', 'KS Providence', '2026-10-05', '2026-10-05', 83.7, 6568, 78.5],
    ['44.W', 'KS Providence', '2026-10-07', '2026-10-07', 82.0, 6423, 78.3],
    ['33.N', 'KS Providence', '2026-10-05', '2026-10-07', 11.8, 924, 78.3]
  ].map(([hint, variety, start, end, acres, lb, lbac]) => ({
    key: 's27-prov-' + hint.replace('.', ''), fieldHint: hint, cropYear: 2027, crop: 'WHEAT', type: 'seeding', title: 'Wheat drilled',
    startDate: start, endDate: end, acres, variety, seedLb: lb, seedLbPerAcre: lbac,
    products: [{ name: 'Pivot Bio (treated by Andersons)' }],
    source: 'KS Providence ledger (locked Oct 11, 2026): drill scale pounds, Operations Center acres. Andersons ticket 21901.',
    notes: hint === '33.N' ? 'KS Providence ran out at 11.8 ac; the rest of 33.N is Byrd CL.' : undefined
  })),
  ...[
    ['33.N', '2026-10-05', '2026-10-07', 71.7, 5223, 72.8],
    ['14.S', '2026-10-07', '2026-10-08', 68.8, 5021, 73.0],
    ['22', '2026-10-08', '2026-10-09', 119.7, 8754, 73.1],
    ['76.W', '2026-10-09', '2026-10-09', 61.1, 4354, 71.3],
    ['78', '2026-10-09', '2026-10-09', 29.1, 2058, 70.7],
    ['79.N', '2026-10-09', '2026-10-10', 67.0, 4710, 70.3]
  ].map(([hint, start, end, acres, lb, lbac]) => ({
    key: 's27-byrd-' + hint.replace('.', ''), fieldHint: hint, cropYear: 2027, crop: 'WHEAT', type: 'seeding', title: 'Wheat drilled',
    startDate: start, endDate: end, acres, variety: 'Byrd CL Plus', seedLb: lb, seedLbPerAcre: lbac,
    products: [{ name: 'CruiserMaxx Vibrance' }, { name: 'Pivot Bio (treated on farm)' }],
    source: 'Byrd CL ledger: Carlson ticket 2476 (30,120 lb), split by Operations Center monitor pounds corrected x1.24 for drill calibration',
    notes: hint === '79.N'
      ? 'Estimate. 79.N is 99.1 ac with Byrd CL and Fortify; which variety covered 64 ac is still open.'
      : 'Pounds are an estimate from the calibration correction.'
  })),
  { key: 's27-fortify-79N', fieldHint: '79.N', cropYear: 2027, crop: 'WHEAT', type: 'seeding', title: 'Wheat drilled',
    startDate: '2026-10-10', endDate: '2026-10-10', variety: 'Fortify (solid stem; WB4347 on the monitor)', seedLb: 3140,
    source: 'Fill log, load 7', notes: 'Acres pending: 79.N is 99.1 ac total with Byrd CL.' },
  { key: 's27-prov-23E', fieldHint: '23.E', cropYear: 2027, crop: 'WHEAT', type: 'seeding', title: 'Wheat drilled',
    startDate: '2026-10-12', endDate: '2026-10-12', acres: 38.6, variety: 'KS Providence',
    products: [{ name: 'Seed treatment (Andersons, treated)' }],
    source: 'Andersons/DDLM ticket 21987, 4,560 lb loaded (76.0 bu)', notes: 'Acres are the planned 38.6. Pounds used and seeded acres pending.' },

  // ---- Fall chemfallow on wheat stubble, billed to corn 2027 ----
  atrazinePass('cf27-30W', '30', 80.64),
  atrazinePass('cf27-32N', '32.N', 78.48),
  atrazinePass('cf27-55N', '55.N', 82.75),
  atrazinePass('cf27-12W', '12.W', 77.80),
  atrazinePass('cf27-41', '41', 79.93),
  atrazinePass('cf27-42W', '42.W', 78.83),
  atrazinePass('cf27-54S', '54.S', 67.99),
  atrazinePass('cf27-61S', '61.S', 78.61),
  atrazinePass('cf27-23W', '23.W', 65.29),
  atrazinePass('cf27-60W', '60', 79.70),
  atrazinePass('cf27-nbins', 'N Bins', 138.69),
  atrazinePass('cf27-westgary', "West Gary's", 110.70),
  atrazinePass('cf27-southcrick', 'South Crick Field', 55.58),
  atrazinePass('cf27-northkeith', "North Keith's", 117.13),
  atrazinePass('cf27-shouse', 'S House', 153.10)
];

// ---- Operations Center Application 2026 report ----
// Field names in Operations Center are not reliable (often the wrong half or
// the whole quarter), so each pass carries the field number and is matched to
// the half by crop: starter at planting to the half planted to that crop, the
// July wheat-stubble burndown to the wheat 26 half, the October wheat
// burndown to the wheat 27 half. A field listed counts as done; acres are the
// card's acres because logged coverage is not reliable. Entries that logged
// under 1 acre are left unchecked for review.
const OPS_APP = require('./opsCenterApplication2026.json');
const FALL_ATRAZINE_PLANS = ['Corn27 26Fall Atrazine', 'Hydrovant®-fA'];

// "42.E" -> "42" (the half is not trusted); "46.P", "73.C.SE" stay whole
// because they are separate fields, not halves.
function opsNumber(name) {
  const m = String(name).trim().match(/^(\d+)(?:[.\- ]?([NSEW]))?(?:\b|\s|$)/i);
  if (m && String(name).trim().replace(/[.\- ]?[NSEW]?(\s.*)?$/i, '') === m[1]) return m[1];
  return String(name).trim();
}
function cropOf(label) {
  const c = String(label || '').toUpperCase();
  if (c.startsWith('CORN')) return 'CORN';
  if (c.startsWith('SORGHUM')) return 'SORGHUM';
  if (c.startsWith('WHEAT')) return 'WHEAT';
  return null;
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function smallArea(e) { return e.area !== null && e.area < 1; }
function reportLine(e) {
  return 'Report: ' + e.opsName + ', ' + (e.plan || 'no work plan') + ' - ' + (e.crop || 'no crop') + ', ' +
    (e.area === null ? 'coverage not logged' : e.area + ' ac logged') + '.';
}

const OPS_RECORDS = [];

// Planting: Operations Center Seeding 2026 report (unfiltered), spring 2026
// row crops and June 2025 milo. Wheat 27 drilling is already on the cards
// from the seed ledgers. The UpShiftC starter from the Application report
// rides on the matching planting pass. Matched by field number and the crop
// on the card; acres are the card's acres.
const OPS_SEED = require('./opsCenterSeeding2026.json');
const SEED_CROP = { 'Corn': 'CORN', 'Sorghum (Milo)': 'SORGHUM', 'Sudangrass': 'SORGHUM SUDAN' };
// Crops logged wrong in the cab, corrected by Kyle: field|year -> crop.
const CROP_CORRECTIONS = { '73.C.SW|2026': 'SORGHUM SUDAN' };
function correctedCrop(field, year, crop) {
  return CROP_CORRECTIONS[opsNumber(field) + '|' + year] || crop;
}

const plantGroups = new Map();
for (const e of OPS_SEED) {
  const year = Number(e.start.slice(0, 4));
  const crop = SEED_CROP[e.crop] && correctedCrop(e.opsField, year, SEED_CROP[e.crop]);
  if (!crop) continue;
  const k = opsNumber(e.opsField) + '|' + year + '|' + crop;
  if (!plantGroups.has(k)) plantGroups.set(k, { num: opsNumber(e.opsField), year, crop, entries: [] });
  plantGroups.get(k).entries.push(e);
}
// A group that seeded nothing, on a field with a real planting that year, is
// the planter passing through; drop it.
for (const [k, g] of plantGroups) {
  if (g.entries.some(e => e.area >= 1)) continue;
  const other = [...plantGroups.values()].some(x => x !== g && x.num === g.num && x.year === g.year && x.entries.some(e => e.area >= 1));
  if (other) plantGroups.delete(k);
}
function starterFor(num, year, crop) {
  const products = [];
  for (const e of OPS_APP) {
    if (opsNumber(e.opsField) !== num || Number(e.start.slice(0, 4)) !== year) continue;
    if (!/upshift|starter/i.test(e.plan)) continue;
    const c = cropOf(e.crop) && correctedCrop(e.opsField, year, cropOf(e.crop));
    if (c && c !== crop) continue;
    for (const p of e.products) if (!products.some(x => x.name === p.name && x.rateUnit === p.rateUnit)) products.push(p);
  }
  return products;
}
for (const g of plantGroups.values()) {
  const entries = g.entries.sort((a, b) => a.start.localeCompare(b.start));
  const vars = [];
  for (const e of entries) for (const v of e.varieties) vars.push(v);
  vars.sort((a, b) => b.acres - a.acres);
  const area = Math.round(entries.reduce((sum, e) => sum + e.area, 0) * 10) / 10;
  OPS_RECORDS.push({
    key: 'sd26-' + g.num + '-' + g.year + '-' + slug(g.crop),
    fieldHint: g.num, matchBy: 'crop', cropYear: g.year, crop: g.crop, acresFromField: true,
    type: 'seeding', status: 'completed', title: 'Planted',
    startDate: entries[0].start, endDate: entries[entries.length - 1].end || entries[entries.length - 1].start,
    variety: vars.map(v => v.variety).join(', '),
    products: starterFor(g.num, g.year, g.crop),
    review: area >= 1 ? null : 'Under 1 acre seeded; check that this field was planted.',
    source: 'Operations Center Seeding 2026 report' + (starterFor(g.num, g.year, g.crop).length ? '; starter from the Application 2026 report' : ''),
    notes: (CROP_CORRECTIONS[g.num + '|' + g.year] ? 'Logged as ' + entries[0].crop + ' in the cab; corrected to ' + g.crop.toLowerCase() + ' (Kyle). ' : '') +
      entries.map(e => 'Report: ' + e.opsName + ', ' + e.crop + ', ' + e.area + ' ac logged: ' +
      e.varieties.map(v => v.variety + ' ' + v.acres + ' ac' + (v.rate ? ' at ' + v.rate : '') + (v.target ? ' (target ' + v.target + ')' : '')).join('; ') + '.').join(' ')
  });
}

// Spray passes.
for (const e of OPS_APP) {
  if (FALL_ATRAZINE_PLANS.includes(e.plan)) continue; // on the fall atrazine records above
  let spec = null;
  // Summer and fall fallow sprays are charged to the crop that pays them
  // back: the next harvested crop on the card, else by rotation (2026 wheat
  // -> 2027 corn, 2026 fallow -> 2027 wheat). Kyle, Oct 15, 2026.
  if (e.plan === 'WSBD126') spec = { title: 'Wheat stubble burndown', cropYear: 2027, rotation: true, matchCrop: { year: 2026, crop: 'WHEAT' } };
  else if (e.plan === 'WSBDParapex') spec = { title: 'Burndown (Parapex)', cropYear: 2027, rotation: true, matchCrop: null };
  else if (e.plan === '27wheatBD') spec = { title: 'Wheat 27 burndown', cropYear: 2027, crop: 'WHEAT', matchCrop: { year: 2027, crop: 'WHEAT' } };
  else if (e.plan === '---' && e.start >= '2026-07-01') spec = { title: 'Spray, work plan not recorded', cropYear: 2027, rotation: true, matchCrop: null, review: 'No work plan or product recorded; check this pass.' };
  if (!spec) continue;
  OPS_RECORDS.push({
    key: 'app26-spray-' + slug(e.opsField) + '-' + e.start + '-' + slug(e.plan), rev: spec.rotation ? 2 : 1,
    fieldHint: opsNumber(e.opsField), matchBy: spec.matchCrop ? 'crop' : 'name', opsName: e.opsField,
    matchCropYear: spec.matchCrop ? spec.matchCrop.year : undefined, matchCrop: spec.matchCrop ? spec.matchCrop.crop : undefined,
    cropYear: spec.cropYear, crop: spec.crop || null, cropFromRotation: !!spec.rotation, cropFromCard: !spec.crop && !spec.rotation, acresFromField: true,
    type: 'spray', status: 'completed', title: spec.title,
    startDate: e.start, endDate: e.end || e.start,
    products: e.products,
    review: spec.review || (smallArea(e) ? 'Under 1 acre logged; likely overlap from the other half.' : null),
    source: 'Operations Center Application 2026 report, work plan ' + e.plan + ' (target rates)',
    notes: reportLine(e) + (spec.rotation ? ' Charged to the next harvested crop on the field, which pays this pass back.' : '')
  });
}

// ---- Tillage: Operations Center Field Report Tillage 2026 ----
// Every listed pass counts as done; acres are the card's acres. The report
// names the tractor but not the implement, so the machine rate is picked on
// the card (or set once Kyle names the implement per tractor and period).
// Tillage is charged to the upcoming crop (Kyle, Oct 15, 2026): passes before
// June go to the 2026 crop, later passes to the next harvested crop.
// Card match, by what was on each half at the time: spring passes go to the
// half planted in spring (else the fallow half), June to early July passes to
// the fallow half (wheat still standing), later passes to the fallow or
// wheat-stubble half (row crops still growing); the Ops name breaks a tie. A pass over 120 ac on
// a split field (name ends in N/S/E/W) covered the whole quarter and is added
// to both halves.
const OPS_TILL = require('./opsCenterTillage2026.json');
for (const e of OPS_TILL) {
  const num = opsNumber(e.opsField);
  const split = /[.\- ][NSEW]$/i.test(e.opsField);
  const spring = e.start < '2026-06-01';
  const earlySummer = !spring && e.start < '2026-07-06';
  const matchCrops = spring ? [['CORN', 'SORGHUM', 'SORGHUM SUDAN'], ['FALLOW']]
    : earlySummer ? [['FALLOW']] : [['FALLOW', 'WHEAT']];
  const halves = split && e.area > 120 ? [1, 2] : [0];
  for (const h of halves) {
    OPS_RECORDS.push({
      key: 'till26-' + slug(e.opsField) + '-' + e.start + '-' + slug(e.equipment.join('-')) + (h ? '-half' + h : ''),
      fieldHint: num, opsName: e.opsField,
      matchBy: 'crops', matchCrops, matchCropYear: 2026, pickIndex: h ? h - 1 : undefined,
      area: e.area,
      cropYear: spring ? 2026 : 2027, crop: null, cropFromRotation: true, acresFromField: true,
      type: 'tillage', status: 'completed',
      title: e.kind === 'Shank' ? 'Shank' : 'Primary tillage',
      startDate: e.start, endDate: e.end || e.start,
      operator: e.operator, equipment: e.equipment.join(', '),
      review: null,
      source: 'Operations Center Field Report Tillage 2026',
      notes: 'Report: ' + e.field + ', ' + e.area + ' ac logged, target depth ' + e.depth + ', ' + e.hours + ', ' + e.fuel + ' fuel.' +
        (h ? ' Whole-quarter pass; this record is for half ' + h + '.' : '') + ' Implement not in the report.'
    });
  }
}

RECORDS.push(...OPS_RECORDS);

module.exports = { RECORDS };
