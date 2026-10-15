const mongoose = require('mongoose');

// Where parts are bought. Never store account passwords here.
const partVendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  phone: { type: String, trim: true },
  accountEmail: { type: String, trim: true },
  notes: { type: String, trim: true },
  seedKey: { type: String, trim: true, index: { unique: true, sparse: true } },
  deleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'partVendors'
});

module.exports = mongoose.model('PartVendor', partVendorSchema);
