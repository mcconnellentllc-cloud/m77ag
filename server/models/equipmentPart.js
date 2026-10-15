const mongoose = require('mongoose');

// Common parts for the fleet: what fits which unit, how many are needed now,
// and where to buy. Kept separate from Equipment so one part can fit many units.
const equipmentPartSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Lighting', 'Brakes', 'Tires and wheels', 'Suspension', 'Air and electrical', 'Filters', 'Tarp', 'Other'],
    default: 'Other'
  },
  name: { type: String, required: true, trim: true },
  spec: { type: String, trim: true },
  partNumber: { type: String, trim: true },
  fits: { type: String, trim: true },
  qtyNeeded: { type: Number, default: 0, min: 0 },
  amazonUrl: { type: String, trim: true },
  otherUrl: { type: String, trim: true },
  notes: { type: String, trim: true },
  // Set on parts from the starting list, so later additions to that list are
  // added once and a deleted starting part is not added back.
  seedKey: { type: String, trim: true, index: { unique: true, sparse: true } },
  deleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'equipmentParts'
});

module.exports = mongoose.model('EquipmentPart', equipmentPartSchema);
