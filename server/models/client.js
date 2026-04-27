const mongoose = require('mongoose');

// Top-level entity in the field hierarchy: Client → Farm → Field.
//
// Three Clients exist for M77 today:
//   - M77 AG    (type: owner)    — fields M77 owns or leases for its own rotation
//   - Allphin Farms (type: landlord) — Lueking-only landlord, M77 farms it
//   - Custom    (type: custom)   — fields M77 farms for outside operators (Nelson,
//                                  Eisenhard, RPM); not in the M77 rotation plan
//
// Landlord users are linked here via `users[]`. A landlord login is scoped to
// only the Clients in which their User._id appears in this list.
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['owner', 'landlord', 'custom']
  },

  contact: {
    name:    { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    phone:   { type: String, trim: true },
    address: { type: String, trim: true }
  },

  // Enterprise this Client's fields default to in P&L reporting:
  //   M77 AG         → 'M77 AG'
  //   Allphin Farms  → 'Lueking'
  //   Custom         → 'Custom'
  // M77Field.enterprise can override per-field if needed.
  defaultEnterprise: {
    type: String,
    trim: true,
    default: 'M77 AG'
  },

  // User accounts authorized to view this Client's data via the landlord
  // portal. Empty for owner/custom clients (no portal needed).
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  active: {
    type: Boolean,
    default: true
  },

  notes: { type: String }
}, {
  timestamps: true,
  collection: 'clients'
});

clientSchema.index({ type: 1 });
clientSchema.index({ users: 1 });

module.exports = mongoose.model('Client', clientSchema);
