const mongoose = require('mongoose');

// One custom job done for an outside operator (a custom-type M77Farm):
// acres worked at a per-acre rate, plus any products supplied at retail with
// an interest carry added. Custom acres are billed here only; they are not
// field cards.

const SERVICES = ['drilling', 'planting', 'spraying', 'fertilizer', 'tillage', 'harvesting', 'trucking', 'other'];

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['chemicals', 'seed', 'fertilizer', 'other'], default: 'chemicals' },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, trim: true, default: 'gal' },
  retailPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const customWorkSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Farm', required: true, index: true },
  customerName: { type: String, trim: true },

  date: { type: Date, required: true },
  cropYear: { type: Number, required: true, index: true },
  service: { type: String, required: true, enum: SERVICES },
  description: { type: String, trim: true },

  // Where the work was done. m77Field is optional; location is the name
  // printed on the invoice.
  m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field', default: null },
  location: { type: String, required: true, trim: true },

  acres: { type: Number, required: true, min: 0 },
  ratePerAcre: { type: Number, required: true, min: 0 },

  products: { type: [productSchema], default: [] },
  // Percent added to product retail prices for interest carry.
  interestCarryPct: { type: Number, min: 0, max: 100, default: 0 },

  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null, index: true },
  invoiceNumber: { type: String, default: null },

  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'customWork',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Billed unit price for a product, retail plus interest carry, to the cent.
customWorkSchema.methods.productUnitPrice = function (p) {
  return round2(p.retailPrice * (1 + (this.interestCarryPct || 0) / 100));
};

customWorkSchema.virtual('serviceAmount').get(function () {
  return round2(this.acres * this.ratePerAcre);
});

customWorkSchema.virtual('productAmount').get(function () {
  return round2((this.products || []).reduce((s, p) => s + round2(p.quantity * this.productUnitPrice(p)), 0));
});

customWorkSchema.virtual('total').get(function () {
  return round2(this.serviceAmount + this.productAmount);
});

customWorkSchema.statics.SERVICES = SERVICES;

module.exports = mongoose.model('CustomWork', customWorkSchema);
