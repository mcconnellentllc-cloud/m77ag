// M77 AG field operation rate list, 2026.
//
// Rate = 85% x the average of the two university range midpoints:
//   midpoint = (low + high) / 2 for each publication's reported range
//   rate     = 0.85 x (ISU midpoint + CSU midpoint) / 2
// Where only one publication lists an operation, rate = 0.85 x that midpoint
// and the entry is marked singleSource.
//
// Sources:
//   ISU: 2026 Iowa Farm Custom Rate Survey, Ag Decision Maker File A3-10
//        (FM 1698, revised March 2026). Ranges exclude the min and max reply.
//        https://www.extension.iastate.edu/agdm/crops/pdf/a3-10.pdf
//   CSU: 2025 Land Rental & Custom Rates for Colorado Farms & Ranches,
//        Eastern Region (April 2026).
//        https://abm.extension.colostate.edu/wp-content/uploads/sites/61/2026/04/2025-CustomRates-Final.pdf
// Rates include tractor, fuel and operator labor; materials are not included.

const FACTOR = 0.85;

// [key, label, category, unit, isu [low, high, item] | null, csu [low, high, item] | null, note]
const ITEMS = [
  // Tillage
  ['disk-tandem', 'Disk, tandem (sunflower disc)', 'tillage', 'acre', [10.00, 30.00, 'Disking, tandem'], [20.00, 24.00, 'Disk']],
  ['disk-heavy', 'Disk, heavy or offset', 'tillage', 'acre', [16.00, 30.00, 'Disking, heavy or offset'], [20.00, 24.00, 'Disk']],
  ['chisel', 'Chisel plow, dryland', 'tillage', 'acre', [10.00, 28.00, 'Chisel plowing'], [12.00, 18.00, 'Plow - Chisel (dryland)']],
  ['sweep', 'Sweep plow / undercutter', 'tillage', 'acre', [7.60, 32.00, 'Field cultivating'], [10.00, 20.00, 'Plow - Sweep'], 'ISU has no sweep plow line; field cultivating is the closest match.'],
  ['field-cultivate', 'Field cultivate', 'tillage', 'acre', [7.60, 32.00, 'Field cultivating'], [20.00, 24.00, 'Cultivating - Field']],
  ['field-finisher', 'Field finisher', 'tillage', 'acre', [10.00, 33.00, 'Soil finishing'], [20.00, 24.00, 'Cultivating - Field'], 'CSU has no soil finishing line; field cultivating is the closest match.'],
  ['vertical-tillage', 'Vertical tillage', 'tillage', 'acre', [12.00, 30.00, 'Vertical tillage'], [10.00, 35.00, 'Vertical Tillage']],
  ['strip-till', 'Strip till, tillage only', 'tillage', 'acre', [15.00, 30.00, 'Strip tillage without fertilizer'], [15.00, 30.00, 'Strip Till (tillage only)']],
  ['moldboard', 'Moldboard plow', 'tillage', 'acre', [14.00, 24.00, 'Moldboard plowing'], [35.00, 60.00, 'Plow - Moldboard']],
  ['stalk-shred', 'Stalk shredding / chopping', 'tillage', 'acre', [8.00, 20.00, 'Chopping cornstalks'], [12.00, 21.00, 'Stalk Shredding']],
  ['harrow', 'Harrow', 'tillage', 'acre', [7.00, 18.00, 'Harrowing or dragging'], [7.00, 10.00, 'Harrow']],
  ['subsoil', 'Subsoil / rip', 'tillage', 'acre', [13.00, 35.00, 'Subsoiling (8 to 15 in)'], null],
  ['land-roll', 'Land rolling', 'tillage', 'acre', [4.00, 18.00, 'Land rolling'], null],
  // Planting
  ['drill-small-grain', 'Drill wheat / small grain', 'planting', 'acre', [10.00, 27.00, 'Drilling small grain'], [20.00, 27.00, 'Plant - Drill']],
  ['drill-no-till', 'No-till drill, small grain', 'planting', 'acre', [15.00, 32.00, 'Drilling soybean, no-till'], [15.00, 20.00, 'Plant - No Till (Grain Crops)'], 'ISU has no no-till small grain line; no-till soybean drilling is the closest match.'],
  ['air-seeder', 'Air seeder', 'planting', 'acre', [10.00, 27.00, 'Drilling small grain'], [12.50, 28.00, 'Plant - Air Seeder'], 'ISU has no air seeder line; small grain drilling is the closest match.'],
  ['plant-row', 'Plant row crop (corn, sunflower)', 'planting', 'acre', [15.00, 38.00, 'Planting without attachments'], [16.00, 30.00, 'Plant - Row (30-inch)']],
  ['plant-no-till', 'Plant row crop, no-till', 'planting', 'acre', [15.00, 46.00, 'No-till planter'], [20.00, 30.00, 'Plant - No Till (Row Crops)']],
  // Spraying (materials not included)
  ['spray-sp', 'Spray, self-propelled boom', 'spraying', 'acre', [5.00, 18.00, 'Ground broadcast, self-propelled'], [6.00, 35.00, 'Boom Sprayer']],
  ['spray-tractor', 'Spray, tractor boom', 'spraying', 'acre', [5.00, 14.00, 'Ground broadcast, tractor'], [6.00, 35.00, 'Boom Sprayer']],
  ['spray-aerial', 'Spray, aerial', 'spraying', 'acre', [9.00, 18.00, 'Aerial'], [6.75, 33.00, 'Aerial Spraying']],
  ['spray-drone', 'Spray, drone', 'spraying', 'acre', [8.00, 16.00, 'Drone'], null],
  // Fertilizer application (materials not included)
  ['fert-dry', 'Fertilizer, dry broadcast', 'fertilizer', 'acre', [4.00, 13.50, 'Dry bulk applied'], [6.50, 15.00, 'Dry Fertilizer']],
  ['fert-liquid', 'Fertilizer, liquid broadcast', 'fertilizer', 'acre', [5.00, 15.00, 'Liquid spraying'], [8.00, 20.00, 'Liquid Fertilizer']],
  ['fert-sidedress', 'Fertilizer, liquid side-dress', 'fertilizer', 'acre', [9.00, 20.00, 'Liquid side dressing'], [18.00, 25.00, 'Side-Dress']],
  ['fert-nh3', 'Anhydrous, toolbar', 'fertilizer', 'acre', [7.00, 28.00, 'Anhydrous injecting with tool bar'], null],
  // Harvest
  ['combine-wheat', 'Combine wheat / small grain', 'harvest', 'acre', [35.00, 65.00, 'Small grain combining'], [28.00, 70.00, 'Combine - Small Grains (irrigated)'], 'CSU prices dryland small grain combining per bushel ($0.24-$0.40); its per-acre small grain line is used here.'],
  ['combine-corn', 'Combine corn / sorghum, dryland', 'harvest', 'acre', [25.00, 80.00, 'Corn combining'], [25.00, 70.00, 'Combine - Corn/Sorghum (dryland)']],
  ['combine-oilseed', 'Combine sunflower / oilseed', 'harvest', 'acre', [24.00, 70.00, 'Soybean combining'], [27.50, 70.00, 'Combine - Oil Seeds, Soybeans, Dry Beans']],
  ['swath-small-grain', 'Swath small grain', 'harvest', 'acre', [15.00, 22.00, 'Swathing hay or small grain'], [14.00, 18.00, 'Swath - Small Grains']],
  ['grain-cart', 'Grain cart, corn', 'harvest', 'acre', [3.00, 22.00, 'Hauling grain, grain cart, corn'], null],
  ['haul-grain', 'Haul grain to market by truck', 'harvest', 'bushel', [0.09, 0.35, 'Truck to market, 25 miles one way'], [0.25, 0.45, 'Hauling - Grains']],
  // Hay
  ['hay-mow', 'Hay, mow / swath', 'hay', 'acre', [10.00, 25.00, 'Hay mowing/conditioning'], [15.00, 22.00, 'Hay - Swathing']],
  ['hay-rake', 'Hay, rake', 'hay', 'acre', [7.50, 15.00, 'Hay raking'], [2.00, 8.00, 'Hay - Raking']],
  ['bale-round', 'Bale, large round (no wrap)', 'hay', 'bale', [10.00, 20.00, 'Large round bales without wrap'], [16.00, 22.00, 'Baling - Round Bales']],
  ['bale-large-square', 'Bale, large square', 'hay', 'bale', [13.00, 18.00, 'Large square bales'], [10.00, 20.00, 'Baling - 4x4x8 Bales']],
  ['bale-small-square', 'Bale, small square', 'hay', 'bale', [0.50, 1.50, 'Small square bales'], [0.90, 8.00, 'Baling - Small Square Bales']],
  ['haul-round-bales', 'Haul round bales', 'hay', 'bale', null, [5.00, 8.00, 'Hauling - Round Bales']],
  // Other
  ['mow-pasture', 'Mow CRP / pasture', 'other', 'acre', [12.00, 50.00, 'Mowing CRP or pasture'], null],
  ['transport', 'Equipment transport', 'other', 'mile', null, [4.00, 6.00, 'Equipment Transport Charges']],
  ['labor-tractor', 'Tractor driver labor', 'other', 'hour', [15.00, 40.00, 'Labor, other operations'], [20.00, 35.00, 'Tractor Drivers - High Level']]
];

function round2(n) { return Math.round(n * 100) / 100; }
function source([a, b, item]) {
  const low = Math.min(a, b), high = Math.max(a, b);
  return { low, high, midpoint: round2((low + high) / 2), item };
}

const RATES = ITEMS.map(([key, label, category, unit, isu, csu, note]) => {
  const s = { isu: isu ? source(isu) : null, csu: csu ? source(csu) : null };
  const mids = [s.isu, s.csu].filter(Boolean).map(x => x.midpoint);
  const average = mids.reduce((a, b) => a + b, 0) / mids.length;
  const precision = unit === 'bushel' ? 3 : 2;
  const f = Math.pow(10, precision);
  return {
    key, label, category, unit,
    isu: s.isu, csu: s.csu,
    averageMidpoint: Math.round(average * f) / f,
    rate: Math.round(average * FACTOR * f) / f,
    singleSource: mids.length === 1,
    note: note || null
  };
});

module.exports = {
  year: 2026,
  factor: FACTOR,
  formula: 'Rate = 85% x average of the ISU and CSU range midpoints',
  sources: {
    isu: { title: '2026 Iowa Farm Custom Rate Survey (AgDM A3-10, March 2026)', url: 'https://www.extension.iastate.edu/agdm/crops/pdf/a3-10.pdf' },
    csu: { title: '2025 Land Rental & Custom Rates for Colorado Farms & Ranches, Eastern Region (April 2026)', url: 'https://abm.extension.colostate.edu/wp-content/uploads/sites/61/2026/04/2025-CustomRates-Final.pdf' }
  },
  RATES
};
