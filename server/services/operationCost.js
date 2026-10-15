// Machine cost for field passes from the field operation rate list.
// cost = units (acres worked; combine acres for harvest) x rate.
const rateList = require('../data/fieldOperationRates2026');

const RATE_BY_KEY = Object.fromEntries(rateList.RATES.map(r => [r.key, r]));
const SMALL_GRAINS = ['WHEAT', 'BARLEY', 'TRITICALE', 'OATS', 'RYE'];
// Sudangrass is planted with the planter (Kyle, Oct 15, 2026).
const ROW_CROPS = ['CORN', 'SORGHUM', 'MILO', 'SUNFLOWER', 'SUNFLOWERS', 'SORGHUM SUDAN', 'SUDANGRASS'];

// Default rate for a pass, or null when the pass type needs the implement to
// pick a rate (tillage, other).
function defaultRateKey(op) {
  if (op.suggestedRateKey && RATE_BY_KEY[op.suggestedRateKey]) return op.suggestedRateKey;
  const crop = String(op.crop || '').toUpperCase();
  switch (op.type) {
    case 'seeding':
      if (SMALL_GRAINS.includes(crop)) return 'drill-small-grain';
      if (ROW_CROPS.includes(crop)) return 'plant-row';
      return null;
    case 'harvest':
      if (SMALL_GRAINS.includes(crop)) return 'combine-wheat';
      if (crop === 'CORN' || crop === 'SORGHUM' || crop === 'MILO') return 'combine-corn';
      if (crop.startsWith('SUNFLOWER')) return 'combine-oilseed';
      return null;
    case 'spray':
      return 'spray-sp';
    case 'fertilizer':
      return 'fert-liquid';
    default:
      return null;
  }
}

// Units the rate applies to. Harvest uses combine acres when the delivered
// acres are not on the record. Returns null when nothing measurable is on file.
function unitsFor(op, rate) {
  if (rate.unit === 'acre') {
    if (op.type === 'harvest') return op.combineAcres > 0 ? op.combineAcres : (op.acres > 0 ? op.acres : null);
    return op.acres > 0 ? op.acres : null;
  }
  if (rate.unit === 'bushel') return op.netBu > 0 ? op.netBu : null;
  return null;
}

// Cost snapshot for a pass at a rate, or { error } when it cannot be costed.
function costFor(op, rateKey, setBy) {
  const rate = RATE_BY_KEY[rateKey];
  if (!rate) return { error: 'Unknown rate ' + rateKey };
  const units = unitsFor(op, rate);
  if (units === null) return { error: 'No ' + rate.unit + 's on the record to cost' };
  return {
    rateKey: rate.key,
    rateLabel: rate.label,
    rateYear: rateList.year,
    unit: rate.unit,
    units,
    rate: rate.rate,
    amount: Math.round(units * rate.rate * 100) / 100,
    setBy,
    appliedAt: new Date()
  };
}

module.exports = { defaultRateKey, costFor, RATE_BY_KEY, rateList };
