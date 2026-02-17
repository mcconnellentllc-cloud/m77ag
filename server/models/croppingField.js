const mongoose = require('mongoose');

// Crop code generator: "WHEAT" + 2026 => "WHEAT26"
function makeCropCode(crop, year) {
  if (!crop || !year) return '';
  const c = crop.toUpperCase().trim();
  if (['WASTE', 'BUILDING SITE', 'PASTURE', 'FALLOW'].includes(c)) return '';
  const yr = String(year).slice(-2);
  return c.replace(/\s+/g, '-') + yr;
}

// === Crop History Entry (one per field per year) ===
const cropHistorySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  crop: String,
  cropCode: String,
  variety: String,
  plantingDate: Date,
  harvestDate: Date,
  yieldPerAcre: Number,
  pricePerBushel: Number,
  grossRevenue: Number,
  costs: {
    seed: { type: Number, default: 0 },
    fertilizer: { type: Number, default: 0 },
    chemicals: { type: Number, default: 0 },
    cropInsurance: { type: Number, default: 0 },
    fuelOil: { type: Number, default: 0 },
    repairs: { type: Number, default: 0 },
    customHire: { type: Number, default: 0 },
    landRent: { type: Number, default: 0 },
    dryingHauling: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    misc: { type: Number, default: 0 }
  },
  totalCost: Number,
  netIncome: Number,
  profitPerAcre: Number,
  notes: String
}, { _id: true });

// === Soil Sample Entry ===
const soilSampleSchema = new mongoose.Schema({
  date: Date,
  depth: String,
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  sulfur: Number,
  zinc: Number,
  iron: Number,
  ph: Number,
  organicMatter: Number,
  cec: Number,
  salts: Number,
  notes: String
}, { _id: true });

// === Main CroppingField Schema ===
const croppingFieldSchema = new mongoose.Schema({
  // --- Identity ---
  client: { type: String, default: 'MCC. ENT.' },
  farm: {
    type: String,
    required: true,
    enum: ['LAFARMS', 'KBFARMS', 'PETERSON', 'HDFARMS', 'MEFARMS', 'A1FARMS']
  },
  field: { type: String, required: true },

  // --- Location / Legal ---
  legal: String,
  fsaFarm: String,
  tract: String,
  county: String,
  section: String,
  township: String,
  range: String,

  // --- Size ---
  acres: Number,

  // --- Crop Rotation (current + planned) ---
  crop2025: String,
  crop2026: String,
  crop2027: String,
  crop2028: String,
  crop2029: String,
  crop2030: String,

  // --- Crop History (year-by-year records) ---
  cropHistory: [cropHistorySchema],

  // --- Soil Information ---
  soil: {
    type: String,
    class: String,
    irrigated: { type: Boolean, default: false },
    drainageTile: { type: Boolean, default: false },
    samples: [soilSampleSchema]
  },

  // --- Lease / Ownership ---
  lease: {
    type: { type: String, enum: ['owned', 'cash-rent', 'crop-share', 'flex-lease', ''] },
    landlord: String,
    rentPerAcre: Number,
    sharePercentage: Number,
    leaseStart: Date,
    leaseEnd: Date,
    terms: String
  },

  // --- Crop Insurance (current year) ---
  insurance: {
    provider: String,
    policyNumber: String,
    type: String,
    level: Number,
    guaranteedYield: Number,
    guaranteedPrice: Number,
    premiumPerAcre: Number,
    totalPremium: Number,
    subsidy: Number,
    netPremium: Number
  },

  // --- Taxes ---
  taxes: {
    propertyTaxPerAcre: Number,
    assessedValue: Number,
    taxYear: Number,
    taxingAuthority: String
  },

  // === 2026 Budget / Projections ===
  costs: {
    seed: { type: Number, default: 0 },
    fertilizer: { type: Number, default: 0 },
    chemicals: { type: Number, default: 0 },
    cropInsurance: { type: Number, default: 0 },
    fuelOil: { type: Number, default: 0 },
    repairs: { type: Number, default: 0 },
    customHire: { type: Number, default: 0 },
    landRent: { type: Number, default: 0 },
    dryingHauling: { type: Number, default: 0 },
    misc: { type: Number, default: 0 }
  },
  projectedYield: { type: Number, default: 0 },
  projectedPrice: { type: Number, default: 0 },
  governmentPayment: { type: Number, default: 0 },

  // Land valuation
  marketValuePerAcre: { type: Number, default: 0 },

  // Legacy
  costPerAcre: Number,
  estimatedRevenue: Number,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === Virtuals: Current Year Budget Calcs ===
croppingFieldSchema.virtual('totalCostPerAcre').get(function() {
  if (!this.costs) return 0;
  const c = this.costs;
  return (c.seed || 0) + (c.fertilizer || 0) + (c.chemicals || 0) +
         (c.cropInsurance || 0) + (c.fuelOil || 0) + (c.repairs || 0) +
         (c.customHire || 0) + (c.landRent || 0) + (c.dryingHauling || 0) +
         (c.misc || 0);
});

croppingFieldSchema.virtual('totalCost').get(function() {
  return (this.totalCostPerAcre || 0) * (this.acres || 0);
});

croppingFieldSchema.virtual('revenuePerAcre').get(function() {
  return ((this.projectedYield || 0) * (this.projectedPrice || 0)) + (this.governmentPayment || 0);
});

croppingFieldSchema.virtual('totalRevenue').get(function() {
  return (this.revenuePerAcre || 0) * (this.acres || 0);
});

croppingFieldSchema.virtual('netPerAcre').get(function() {
  return (this.revenuePerAcre || 0) - (this.totalCostPerAcre || 0);
});

croppingFieldSchema.virtual('netIncome').get(function() {
  return (this.netPerAcre || 0) * (this.acres || 0);
});

// === Virtual: Total Market Value ===
croppingFieldSchema.virtual('totalMarketValue').get(function() {
  return (this.marketValuePerAcre || 0) * (this.acres || 0);
});

// === Virtuals: Historical Averages ===
croppingFieldSchema.virtual('avgYield').get(function() {
  const history = (this.cropHistory || []).filter(h => h.yieldPerAcre > 0);
  if (history.length === 0) return 0;
  return history.reduce((sum, h) => sum + h.yieldPerAcre, 0) / history.length;
});

croppingFieldSchema.virtual('avgProfitPerAcre').get(function() {
  const history = (this.cropHistory || []).filter(h => typeof h.profitPerAcre === 'number');
  if (history.length === 0) return null;
  return history.reduce((sum, h) => sum + h.profitPerAcre, 0) / history.length;
});

// === Virtuals: Landlord vs Operator (M77 AG) Cost Split ===
// Crop-share: landlord pays their % of shared costs (seed, fert, chem, insurance, drying)
// Cash-rent / Owned: M77 AG pays 100%
// Shared cost categories that landlord participates in on crop-share
const SHARED_COSTS = ['seed', 'fertilizer', 'chemicals', 'cropInsurance', 'dryingHauling'];
// Operator-only costs (M77 AG always pays 100%)
const OPERATOR_COSTS = ['fuelOil', 'repairs', 'customHire'];

croppingFieldSchema.virtual('costSplit').get(function() {
  const c = this.costs || {};
  const leaseType = (this.lease && this.lease.type) || 'owned';
  const sharePct = (this.lease && this.lease.sharePercentage) || 0;
  const landlordShare = sharePct / 100;
  const rentPerAcre = (this.lease && this.lease.rentPerAcre) || 0;

  const allCostKeys = ['seed', 'fertilizer', 'chemicals', 'cropInsurance',
    'fuelOil', 'repairs', 'customHire', 'landRent', 'dryingHauling', 'taxes', 'misc'];

  const totalPerAcre = allCostKeys.reduce((sum, k) => sum + (c[k] || 0), 0);

  let m77Costs = 0;
  let landlordCosts = 0;
  const m77Detail = {};
  const landlordDetail = {};

  if (leaseType === 'crop-share' && landlordShare > 0) {
    // Shared costs split by percentage
    SHARED_COSTS.forEach(k => {
      const val = c[k] || 0;
      landlordDetail[k] = +(val * landlordShare).toFixed(2);
      m77Detail[k] = +(val * (1 - landlordShare)).toFixed(2);
      landlordCosts += landlordDetail[k];
      m77Costs += m77Detail[k];
    });
    // Operator costs: 100% M77
    OPERATOR_COSTS.forEach(k => {
      const val = c[k] || 0;
      m77Detail[k] = val;
      landlordDetail[k] = 0;
      m77Costs += val;
    });
    // Taxes: landlord typically pays
    landlordDetail.taxes = c.taxes || 0;
    m77Detail.taxes = 0;
    landlordCosts += landlordDetail.taxes;
    // Land rent: N/A for crop-share
    m77Detail.landRent = 0;
    landlordDetail.landRent = 0;
    // Misc: split
    const miscVal = c.misc || 0;
    landlordDetail.misc = +(miscVal * landlordShare).toFixed(2);
    m77Detail.misc = +(miscVal * (1 - landlordShare)).toFixed(2);
    landlordCosts += landlordDetail.misc;
    m77Costs += m77Detail.misc;
  } else {
    // Owned or cash-rent: M77 pays everything
    allCostKeys.forEach(k => {
      m77Detail[k] = c[k] || 0;
      landlordDetail[k] = 0;
      m77Costs += m77Detail[k];
    });
  }

  // Revenue split
  const revenuePerAcre = ((this.projectedYield || 0) * (this.projectedPrice || 0)) +
    (this.governmentPayment || 0);
  let m77Revenue = revenuePerAcre;
  let landlordRevenue = 0;

  if (leaseType === 'crop-share' && landlordShare > 0) {
    landlordRevenue = +(revenuePerAcre * landlordShare).toFixed(2);
    m77Revenue = +(revenuePerAcre * (1 - landlordShare)).toFixed(2);
  }

  // Break-even: price per bushel needed to cover costs
  const projYield = this.projectedYield || 0;
  let breakEvenPrice = 0;
  if (projYield > 0) {
    if (leaseType === 'crop-share' && landlordShare > 0) {
      // M77's break-even on their share
      breakEvenPrice = m77Costs / (projYield * (1 - landlordShare));
    } else {
      breakEvenPrice = totalPerAcre / projYield;
    }
  }

  return {
    leaseType,
    landlordName: (this.lease && this.lease.landlord) || '',
    sharePercentage: sharePct,
    totalPerAcre: +totalPerAcre.toFixed(2),
    m77: {
      costsPerAcre: +m77Costs.toFixed(2),
      revenuePerAcre: +m77Revenue.toFixed(2),
      netPerAcre: +(m77Revenue - m77Costs).toFixed(2),
      detail: m77Detail
    },
    landlord: {
      costsPerAcre: +landlordCosts.toFixed(2),
      revenuePerAcre: +landlordRevenue.toFixed(2),
      netPerAcre: +(landlordRevenue - landlordCosts).toFixed(2),
      detail: landlordDetail
    },
    breakEvenPrice: +breakEvenPrice.toFixed(2)
  };
});

// === Virtuals: Crop Codes for each year slot ===
[2025, 2026, 2027, 2028, 2029, 2030].forEach(yr => {
  croppingFieldSchema.virtual(`cropCode${yr}`).get(function() {
    return makeCropCode(this[`crop${yr}`], yr);
  });
});

// Current year crop code (2026)
croppingFieldSchema.virtual('cropCode').get(function() {
  return makeCropCode(this.crop2026, 2026);
});

// All crop codes across years (for search/filtering)
croppingFieldSchema.virtual('allCropCodes').get(function() {
  const codes = [];
  [2025, 2026, 2027, 2028, 2029, 2030].forEach(yr => {
    const code = makeCropCode(this[`crop${yr}`], yr);
    if (code) codes.push(code);
  });
  // Also from crop history
  (this.cropHistory || []).forEach(h => {
    const code = h.cropCode || makeCropCode(h.crop, h.year);
    if (code && !codes.includes(code)) codes.push(code);
  });
  return codes;
});

// Pre-save: auto-generate cropCode on history entries
croppingFieldSchema.pre('save', function(next) {
  if (this.cropHistory) {
    this.cropHistory.forEach(h => {
      if (h.crop && h.year && !h.cropCode) {
        h.cropCode = makeCropCode(h.crop, h.year);
      }
    });
  }
  next();
});

// Indexes
croppingFieldSchema.index({ farm: 1 });
croppingFieldSchema.index({ crop2026: 1 });
croppingFieldSchema.index({ fsaFarm: 1, tract: 1 });
croppingFieldSchema.index({ 'cropHistory.year': 1 });
croppingFieldSchema.index({ 'cropHistory.cropCode': 1 });

// Export the helper so routes can use it
croppingFieldSchema.statics.makeCropCode = makeCropCode;

module.exports = mongoose.model('CroppingField', croppingFieldSchema);
