// Published fertility guidelines, loaded into the Fertility Standards sheet.
// Each standard is the parameter set the calculator in
// public/js/fertility-guidelines.js applies to a field's soil sample.
//
// Soil tests are read as the lab reports them: Olsen (NaHCO3) P, ammonium
// acetate K, DTPA Zn, nitrate-N in ppm.
//
// Raise seedRev on a standard to push a corrected default to every database
// whose copy has not been edited on the sheet.

const CSU_CORN_URL = 'https://extension.colostate.edu/resource/fertilizing-dryland-corn';
const CSU_CORN_IRR_URL = 'https://extension.colostate.edu/resource/fertilizing-irrigated-corn';
const CSU_WHEAT_URL = 'https://webdoc.agsci.colostate.edu/wheat/linksfiles/CSUFertilizingWinterWheat.pdf';
const CSU_SMALL_GRAIN_URL = 'https://erams.com/agnutrient/wp-content/uploads/2017/04/00534.pdf';
const UNL_SORGHUM_URL = 'https://extensionpubs.unl.edu/publication/g1669/na/pdf/view';

// Nitrogen tables: rows of { maxPpm, rates: [OM 0-1.0%, OM 1.1-2.0%, OM >2.0%] }
const SMALL_GRAIN_IRR_N_ROWS = [
  { maxPpm: 6, rates: [125, 95, 75] }, { maxPpm: 12, rates: [105, 75, 55] }, { maxPpm: 18, rates: [85, 55, 35] },
  { maxPpm: 24, rates: [65, 35, 15] }, { maxPpm: 30, rates: [45, 15, 0] }, { maxPpm: 36, rates: [25, 0, 0] },
  { maxPpm: null, rates: [0, 0, 0] }
];
const CORN_P = [
  { maxPpm: 6, level: 'low', band: 40, broadcast: 80 }, { maxPpm: 14, level: 'medium', band: 20, broadcast: 40 },
  { maxPpm: 22, level: 'high', band: 0, broadcast: 0 }, { maxPpm: null, level: 'very high', band: 0, broadcast: 0 }
];
const CORN_K = [{ maxPpm: 60, level: 'low', rate: 60 }, { maxPpm: 120, level: 'medium', rate: 30 }, { maxPpm: null, level: 'high', rate: 0 }];
const CORN_ZN = [
  { maxPpm: 0.9, level: 'low', band: 2, broadcast: 10 }, { maxPpm: 1.5, level: 'marginal', band: 1, broadcast: 5 },
  { maxPpm: null, level: 'adequate', band: 0, broadcast: 0 }
];
const SMALL_GRAIN_K = [{ maxPpm: 60, level: 'low', rate: 40 }, { maxPpm: 120, level: 'medium', rate: 20 }, { maxPpm: null, level: 'high', rate: 0 }];
const NO_ZN = { none: true, note: 'CSU: no confirmed zinc deficiency in this crop in Colorado.' };

const CORN_NOTES_COMMON = [
  'Expected yield: 5-year average plus 5%, leaving out hail or frost years.',
  'Iron: above pH 7.8 choose chlorosis-tolerant hybrids first; if chlorosis persists, 50-100 lb/A ferrous sulfate heptahydrate in the seed row.',
  'No confirmed boron, copper, manganese or molybdenum deficiencies in Colorado corn.'
];

module.exports = [
  {
    key: 'CORN-DRYLAND', crop: 'CORN', water: 'dryland', seedRev: 1,
    title: 'Corn, dryland',
    source: 'CSU Extension, Fertilizing Dryland Corn', sourceUrl: CSU_CORN_URL,
    n: { method: 'csu-corn', base: 35, perBu: 1.2, perPpm: 8, omPerBuPct: 0.14, nitrateDepth: '0-2 ft average ppm' },
    p: { rows: CORN_P },
    k: { rows: CORN_K },
    zn: { rows: CORN_ZN, note: 'Rates as zinc sulfate; effective chelates at about one-third the rate.' },
    ironPh: 7.8,
    notes: CORN_NOTES_COMMON.concat(['Sulfur: most Colorado soils are adequate; sandy, low organic matter soils may need S.'])
  },
  {
    key: 'CORN-IRRIGATED', crop: 'CORN', water: 'irrigated', seedRev: 1,
    title: 'Corn, irrigated',
    source: 'CSU Extension, Fertilizing Irrigated Corn (reviewed 9/2025)', sourceUrl: CSU_CORN_IRR_URL,
    n: { method: 'csu-corn', base: 35, perBu: 1.2, perPpm: 8, omPerBuPct: 0.14, nitrateDepth: '0-2 ft average ppm' },
    p: { rows: CORN_P },
    k: { rows: CORN_K },
    zn: { rows: CORN_ZN, note: 'Rates as zinc sulfate; effective chelates at about one-third the rate. Foliar option 0.5% zinc sulfate at 20-30 gal/A.' },
    ironPh: 7.8,
    notes: CORN_NOTES_COMMON.concat([
      'Irrigation water N credit: 2.7 lb N per acre-foot per ppm nitrate-N in the water. Enter it under other credits.',
      'Sulfur (sandy soils only, CSU Table 7): soil SO4-S under 6 ppm with irrigation water under 6 ppm SO4-S: 20 lb S/A broadcast or 10 lb banded when organic matter is under 1%.'
    ])
  },
  {
    key: 'WHEAT-DRYLAND', crop: 'WHEAT', water: 'dryland', seedRev: 1,
    title: 'Winter wheat, dryland',
    source: 'CSU Extension fact sheet 0.544, Fertilizing Winter Wheat (rev. 5/09), Tables 1, 3 and 4', sourceUrl: CSU_WHEAT_URL,
    n: {
      method: 'table', basisYield: 50, perTenBu: 25, max: 75, ppmMultiplier: 1, nitrateDepth: '0-1 ft ppm',
      rows: [
        { maxPpm: 3, rates: [75, 75, 75] }, { maxPpm: 6, rates: [75, 70, 50] }, { maxPpm: 9, rates: [75, 45, 25] },
        { maxPpm: 12, rates: [50, 20, 0] }, { maxPpm: 15, rates: [25, 0, 0] }, { maxPpm: null, rates: [0, 0, 0] }
      ]
    },
    p: { rows: [{ maxPpm: 6, level: 'low', band: 40, broadcast: 80 }, { maxPpm: 14, level: 'medium', band: 20, broadcast: 40 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }], note: 'CSU gives band rates; broadcast is about double.' },
    k: { rows: [{ maxPpm: 60, level: 'low', rate: 30 }, { maxPpm: null, level: 'high', rate: 0 }] },
    zn: NO_ZN,
    notes: [
      'Keep N placed with the seed under 20 lb/A.',
      'Protein check: under 11% suggests N was short; 20-30 lb N/A raises protein about one point (CSU 0.555).',
      'Sulfur: response possible on sandy soils at pH 7.5 or higher with organic matter 1.5% or lower.'
    ]
  },
  {
    key: 'WHEAT-IRRIGATED', crop: 'WHEAT', water: 'irrigated', seedRev: 1,
    title: 'Winter wheat, irrigated',
    source: 'CSU Extension fact sheet 0.544, Fertilizing Winter Wheat (rev. 5/09), Tables 2, 3 and 4', sourceUrl: CSU_WHEAT_URL,
    n: { method: 'table', basisYield: 100, perTenBu: 20, max: null, ppmMultiplier: 1.67, nitrateDepth: 'sum of ppm 0-2 ft (a 1 ft sample is multiplied by 1.67)', rows: SMALL_GRAIN_IRR_N_ROWS },
    p: { rows: [{ maxPpm: 6, level: 'low', band: 40, broadcast: 80 }, { maxPpm: 14, level: 'medium', band: 20, broadcast: 40 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }], note: 'CSU gives band rates; broadcast is about double.' },
    k: { rows: [{ maxPpm: 60, level: 'low', rate: 30 }, { maxPpm: null, level: 'high', rate: 0 }] },
    zn: NO_ZN,
    notes: ['Keep N placed with the seed under 20 lb/A.', 'Irrigation water N credit: 2.7 lb N per acre-foot per ppm nitrate-N. Enter it under other credits.']
  },
  {
    key: 'SORGHUM-ALL', crop: 'SORGHUM', water: 'any', seedRev: 1,
    title: 'Grain sorghum, after a cereal crop',
    source: 'UNL Extension NebGuide G1669, Nutrient Management Suggestions for Grain Sorghum (rev. 1/2013). CSU has no grain sorghum sheet.', sourceUrl: UNL_SORGHUM_URL,
    n: { method: 'unl-sorghum', base: 70, perBu: 1.1, omPer: 20, omCap: 3, perPpm: 14, priceFactor: 0.11, defaultPpm: 3, nitrateDepth: '2-3 ft average ppm' },
    p: { rows: [{ maxPpm: 3, level: 'low', band: 40, broadcast: 80 }, { maxPpm: 10, level: 'medium', band: 20, broadcast: 40 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }] },
    k: { rows: [{ maxPpm: 40, level: 'very low', rate: 120, row: 20 }, { maxPpm: 75, level: 'low', rate: 80, row: 10 }, { maxPpm: 125, level: 'medium', rate: 40, row: 10 }, { maxPpm: null, level: 'high', rate: 0, row: 0 }] },
    zn: {
      rows: [{ maxPpm: 0.4, level: 'low', band: 2, broadcast: 10 }, { maxPpm: 0.8, level: 'medium', band: 1, broadcast: 5 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }],
      rowsNonCalcareous: [{ maxPpm: 0.4, level: 'low', band: 2, broadcast: 5 }, { maxPpm: 0.8, level: 'medium', band: 1, broadcast: 3 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }],
      note: 'Rates as zinc sulfate.'
    },
    ironPh: 7.8,
    notes: [
      'Expected yield: 1.05 x the 5-year (or longer) average sorghum yield.',
      'Apply no more than a third of the N at or before planting; side-dress the rest before sorghum is 1 ft tall. Fall N is not recommended.',
      'Iron: above pH 7.8, 40-80 lb/A ferrous sulfate heptahydrate in the seed row, or 2-4 lb/A FeEDDHA with the seed.'
    ]
  },
  {
    key: 'MILLET-DRYLAND', crop: 'PEARL MILLET', water: 'dryland', seedRev: 1,
    title: 'Proso and pearl millet, dryland',
    source: 'CSU Extension fact sheet 0.534, Fertilizing Spring-Seeded Small Grains (rev. 5/09), Tables 4, 6 and 7', sourceUrl: CSU_SMALL_GRAIN_URL,
    n: {
      method: 'ppm-table', basisYield: 40, onlyWithPKRate: 10, nitrateDepth: '0-1 ft ppm',
      rows: [{ maxPpm: 3, level: 'very low', rate: 40 }, { maxPpm: 6, level: 'low', rate: 20 }, { maxPpm: 10, level: 'medium', rate: 10 }, { maxPpm: null, level: 'high', rate: 0 }]
    },
    p: { rows: [{ maxPpm: 4, level: 'very low', band: 35, broadcast: 70 }, { maxPpm: 8, level: 'low', band: 25, broadcast: 50 }, { maxPpm: 12, level: 'medium', band: 15, broadcast: 30 }, { maxPpm: null, level: 'high', band: 0, broadcast: 0 }] },
    k: { rows: SMALL_GRAIN_K },
    zn: NO_ZN,
    notes: [
      'CSU gives the millet rates at a 40 bu/A expected yield, with no yield adjustment.',
      'The 10 lb N rate applies only when P or K is being applied.',
      'Drought-stressed millet hay can carry high nitrate; test forage before feeding.'
    ]
  },
  {
    key: 'OATS-IRRIGATED', crop: 'OATS', water: 'irrigated', seedRev: 1,
    title: 'Oats, irrigated',
    source: 'CSU Extension fact sheet 0.534, Fertilizing Spring-Seeded Small Grains (rev. 5/09), Tables 2, 5 and 7', sourceUrl: CSU_SMALL_GRAIN_URL,
    n: { method: 'table', basisYield: 100, perTenBu: 20, max: null, ppmMultiplier: 1.67, nitrateDepth: 'sum of ppm 0-2 ft (a 1 ft sample is multiplied by 1.67)', rows: SMALL_GRAIN_IRR_N_ROWS },
    p: { rows: [{ maxPpm: 6, level: 'low', band: 60, broadcast: 120 }, { maxPpm: 14, level: 'medium', band: 40, broadcast: 80 }, { maxPpm: 22, level: 'high', band: 20, broadcast: 40 }, { maxPpm: null, level: 'very high', band: 0, broadcast: 0 }] },
    k: { rows: SMALL_GRAIN_K },
    zn: NO_ZN,
    notes: ['CSU publishes oat rates for irrigated ground only. There is no dryland oat standard.']
  }
];

// Market inputs the sheet keeps for equations that use them.
module.exports.PRICE_DEFAULTS = { sorghumPrice: null, nPrice: null };
