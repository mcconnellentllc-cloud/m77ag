const mongoose = require('mongoose');

const croppingFieldSchema = new mongoose.Schema({
  client: {
    type: String,
    default: 'MCC. ENT.'
  },
  farm: {
    type: String,
    required: true,
    enum: ['LAFARMS', 'KBFARMS', 'PETERSON', 'HDFARMS', 'MEFARMS', 'A1FARMS']
  },
  field: {
    type: String,
    required: true
  },
  legal: {
    type: String
  },
  fsaFarm: {
    type: String
  },
  tract: {
    type: String
  },
  acres: {
    type: Number
  },
  crop2026: {
    type: String
  },
  // For future years
  crop2027: String,
  crop2028: String,
  crop2029: String,
  crop2030: String,

  // === 2026 Budget / Projections ===

  // Projected Costs (per acre)
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

  // Projected Revenue
  projectedYield: { type: Number, default: 0 },    // bu/acre
  projectedPrice: { type: Number, default: 0 },     // $/bushel

  // Government payments / crop insurance guarantees (per acre)
  governmentPayment: { type: Number, default: 0 },

  // Legacy fields
  costPerAcre: Number,
  estimatedRevenue: Number,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculated virtuals
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

// Index for efficient queries
croppingFieldSchema.index({ farm: 1 });
croppingFieldSchema.index({ crop2026: 1 });
croppingFieldSchema.index({ fsaFarm: 1, tract: 1 });

module.exports = mongoose.model('CroppingField', croppingFieldSchema);
