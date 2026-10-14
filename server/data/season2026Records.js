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

function atrazinePass(key, fieldHint, acres) {
  return {
    key, fieldHint, cropYear: 2027, crop: 'CORN', type: 'spray', status: 'planned',
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

  // ---- Wheat 2026 planting (fall 2025), dates from the insurance summary ----
  ...[['13', '2025-10-02', 70.50], ['60', '2025-10-02', 76.36], ['41', '2025-09-29', 78.18], ['42.W', '2025-09-30', 79.00],
      ['23.W', '2025-10-11', 69.70], ['55.N', '2025-09-22', 75.67]].map(([hint, date, acres]) => ({
    key: 'p26-' + hint.replace('.', ''), fieldHint: hint, cropYear: 2026, crop: 'WHEAT', type: 'seeding', title: 'Wheat planted',
    startDate: date, acres, source: '2026 Insurance Summary (Hofmeister, Oct 22, 2025)', notes: 'Planting date and insured acres. Variety and rate not on file.'
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

module.exports = { RECORDS };
