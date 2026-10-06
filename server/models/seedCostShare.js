const mongoose = require('mongoose');

// Seed placed on one M77Field for one season, and the landlord's share of
// its cost. Landlords on crop-share farms pay a fixed fraction of seed and
// seed treatment (1/3 by default). That input-cost share is separate from
// the crop-share percentage on M77Farm.defaultShare.
//
// Prices are per bushel. A null price means "not yet known" (for example,
// the vendor has not invoiced yet). An entry is billed only once every
// price on it is known and the quantity is final (estimated = false).
const treatmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  pricePerBu: { type: Number, min: 0, default: null }
}, { _id: false });

const seedCostShareSchema = new mongoose.Schema({
  // Free-text season label, e.g. "2026 Fall Wheat".
  season: { type: String, required: true, trim: true, index: true },
  // Harvest year the seed is for.
  cropYear: { type: Number },

  m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field', required: true, index: true },
  m77Farm: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Farm' },
  // Snapshots taken at entry time so statements read correctly later.
  fieldName: { type: String, trim: true },
  fieldAcres: { type: Number },
  farmName: { type: String, trim: true },
  landlordName: { type: String, trim: true },

  product: { type: String, required: true, trim: true },
  vendor: { type: String, trim: true },
  ticketNumber: { type: String, trim: true },

  quantityLb: { type: Number, required: true, min: 0 },
  lbPerBu: { type: Number, default: 60, min: 1 },
  // True while the pounds are an estimate (no final tank/monitor reading).
  estimated: { type: Boolean, default: false },

  seedPricePerBu: { type: Number, min: 0, default: null },
  treatments: { type: [treatmentSchema], default: [] },

  // Landlord's share of seed and treatment cost, 0..1. Owned farms are 0.
  landlordShare: { type: Number, min: 0, max: 1, default: 1 / 3 },

  notes: { type: String, trim: true },

  // Set once the entry has been put on a landlord statement.
  statement: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  statementNumber: { type: String, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'seedCostShares',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

seedCostShareSchema.virtual('bushels').get(function () {
  return round2((this.quantityLb || 0) / (this.lbPerBu || 60));
});

// True when every price on the entry is known.
seedCostShareSchema.virtual('priced').get(function () {
  if (this.seedPricePerBu === null || this.seedPricePerBu === undefined) return false;
  return (this.treatments || []).every(t => t.pricePerBu !== null && t.pricePerBu !== undefined);
});

seedCostShareSchema.virtual('seedCost').get(function () {
  if (this.seedPricePerBu === null || this.seedPricePerBu === undefined) return null;
  return round2(this.bushels * this.seedPricePerBu);
});

seedCostShareSchema.virtual('treatmentCost').get(function () {
  const list = this.treatments || [];
  if (list.some(t => t.pricePerBu === null || t.pricePerBu === undefined)) return null;
  return round2(list.reduce((sum, t) => sum + this.bushels * t.pricePerBu, 0));
});

seedCostShareSchema.virtual('totalCost').get(function () {
  if (!this.priced) return null;
  return round2(this.seedCost + this.treatmentCost);
});

// Landlord's share, rounded per line exactly as statement lines are, so the
// field card and the statement total always agree to the cent.
seedCostShareSchema.methods.landlordLines = function () {
  const share = this.landlordShare || 0;
  const bu = this.bushels;
  const lines = [{
    kind: 'seed',
    name: this.product,
    pricePerBu: this.seedPricePerBu,
    amount: round2(bu * this.seedPricePerBu * share)
  }];
  for (const t of this.treatments || []) {
    lines.push({
      kind: 'treatment',
      name: t.name,
      pricePerBu: t.pricePerBu,
      amount: round2(bu * t.pricePerBu * share)
    });
  }
  return lines;
};

seedCostShareSchema.virtual('landlordAmount').get(function () {
  if (!this.priced) return null;
  return round2(this.landlordLines().reduce((sum, l) => sum + l.amount, 0));
});

seedCostShareSchema.index({ season: 1, product: 1 });

module.exports = mongoose.model('SeedCostShare', seedCostShareSchema);
