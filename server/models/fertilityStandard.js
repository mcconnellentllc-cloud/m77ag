const mongoose = require('mongoose');

// One crop and water regime on the Fertility Standards sheet. The nutrient
// blocks hold the published tables and coefficients the calculator in
// public/js/fertility-guidelines.js applies to a soil sample.
const fertilityStandardSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  crop: { type: String, trim: true },
  water: { type: String, enum: ['dryland', 'irrigated', 'any', 'settings'], default: 'dryland' },
  title: { type: String, trim: true },
  source: { type: String, trim: true },
  sourceUrl: { type: String, trim: true },
  n: mongoose.Schema.Types.Mixed,
  p: mongoose.Schema.Types.Mixed,
  k: mongoose.Schema.Types.Mixed,
  zn: mongoose.Schema.Types.Mixed,
  ironPh: Number,
  notes: [String],
  // Settings row (key PRICES): market inputs for price-ratio equations.
  sorghumPrice: Number,
  nPrice: Number,
  seedRev: { type: Number, default: 1 },
  userEdited: { type: Boolean, default: false },
  updatedBy: String
}, { timestamps: true });

module.exports = mongoose.models.FertilityStandard || mongoose.model('FertilityStandard', fertilityStandardSchema);
