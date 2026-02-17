const mongoose = require('mongoose');

// === Crop History Entry (one per field per year) ===
const cropHistorySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  crop: String,
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

// Indexes
croppingFieldSchema.index({ farm: 1 });
croppingFieldSchema.index({ crop2026: 1 });
croppingFieldSchema.index({ fsaFarm: 1, tract: 1 });
croppingFieldSchema.index({ 'cropHistory.year': 1 });

module.exports = mongoose.model('CroppingField', croppingFieldSchema);
