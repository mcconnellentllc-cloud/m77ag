const mongoose = require('mongoose');

// Custom work price list: per-acre rate for a service in a crop year. New
// jobs default to the matching rate; each job keeps its own rate once saved.
const customRateSchema = new mongoose.Schema({
  cropYear: { type: Number, required: true },
  service: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ratePerAcre: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'customRates'
});

customRateSchema.index({ cropYear: 1, service: 1, description: 1 }, { unique: true });

module.exports = mongoose.model('CustomRate', customRateSchema);
