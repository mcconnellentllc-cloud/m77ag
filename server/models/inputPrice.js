const mongoose = require('mongoose');

// Price for one crop year used to cost the field records: a spray or
// fertilizer product (per gallon, pound or acre) or grain sold (per bushel).
// One price per product per crop year, so every card prices the same way.
const inputPriceSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  kind: { type: String, enum: ['product', 'grain'], required: true },
  // Product name exactly as on the field records, or the crop for grain
  name: { type: String, required: true, trim: true, maxlength: 120 },
  unit: { type: String, enum: ['gal', 'lb', 'ac', 'bu'], required: true },
  price: { type: Number, required: true, min: 0 },
  source: { type: String, trim: true, maxlength: 200 },
  updatedBy: { type: String, trim: true }
}, { timestamps: true, collection: 'inputPrices' });

inputPriceSchema.index({ year: 1, kind: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('InputPrice', inputPriceSchema);
