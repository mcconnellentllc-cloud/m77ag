const mongoose = require('mongoose');

// A parts purchase: what was bought, from whom, for which unit, and the cost.
const lineSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentPart', default: null },
  name: { type: String, required: true, trim: true },
  partNumber: { type: String, trim: true },
  qty: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  // Pieces in each item bought (a 4-pack is 4), for taking received pieces off "needed now".
  packOf: { type: Number, default: 1, min: 1 }
}, { _id: false });

const partOrderSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'PartVendor', default: null },
  vendorName: { type: String, trim: true },
  orderDate: { type: Date, default: Date.now },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
  unitLabel: { type: String, trim: true },
  lines: { type: [lineSchema], default: [] },
  shipping: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['ordered', 'received', 'cancelled'], default: 'ordered' },
  // Set once received quantities have been taken off the parts' "needed now".
  receivedApplied: { type: Boolean, default: false },
  poNumber: { type: String, trim: true },
  // Vendor invoice and payment date. Card numbers and authorization codes are not kept.
  invoiceNumber: { type: String, trim: true },
  paidDate: { type: Date, default: null },
  notes: { type: String, trim: true },
  seedKey: { type: String, trim: true, index: { unique: true, sparse: true } },
  deleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'partOrders'
});

partOrderSchema.pre('save', function () {
  const parts = this.lines.reduce((s, l) => s + (l.qty || 0) * (l.unitPrice || 0), 0);
  this.total = Math.round((parts + (this.shipping || 0) + (this.tax || 0)) * 100) / 100;
});

module.exports = mongoose.model('PartOrder', partOrderSchema);
