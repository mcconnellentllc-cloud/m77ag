const mongoose = require('mongoose');

// Mid-level grouping under a Client in the M77 field hierarchy:
// Client → M77Farm → M77Field.
//
// Named M77Farm to avoid collision with the existing Farm model (used by
// the LandManagement system, owned by LandManagementUser). M77Farm lives
// in the m77farms collection and is part of the M77 field stack.
//
// Financial split engine:
//   M77 share      = 1 - (field.shareOverride ?? farm.defaultShare)
//   Landlord share =      field.shareOverride ?? farm.defaultShare
// Custom Farms (type='custom') are billed directly and skip the split
// entirely — the engine should treat them as out-of-rotation.
const m77FarmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  county: { type: String, trim: true },

  // Display name of the landlord/owner entity for this Farm.
  // Examples: "M77 AG", "Kyle & Brandi McConnell", "Larry & Adele",
  //           "Allphin Farms".
  landlordName: {
    type: String,
    required: true,
    trim: true
  },

  // Users authorized to view this Farm via the landlord portal. Couples
  // (e.g. "Kyle & Brandi") get one Farm record but two User refs here, so
  // each spouse can have their own login.
  landlordUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Operating type:
  //   'owned'      — M77 owns the land outright (e.g. MEFARMS); share=0.
  //   'crop-share' — M77 farms it for a landlord on a crop-share lease.
  //   'custom'     — M77 does custom field operations for an outside
  //                  operator; not in the M77 rotation, no share split.
  type: {
    type: String,
    required: true,
    enum: ['owned', 'crop-share', 'custom'],
    default: 'crop-share'
  },

  // Landlord's share of crop-share output, 0..1. Owned farms = 0.
  // Custom farms = 0 (the field is not split). Per-field overrides go on
  // M77Field.shareOverride.
  defaultShare: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  active: { type: Boolean, default: true },
  notes:  { type: String }
}, {
  timestamps: true,
  collection: 'm77farms'
});

// Farm names are unique within a Client.
m77FarmSchema.index({ client: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('M77Farm', m77FarmSchema);
