const mongoose = require('mongoose');

// Mid-level grouping under a Client in the M77 field hierarchy:
// Client → M77Farm → M77Field.
//
// Named M77Farm to avoid collision with the existing Farm model (used by
// the LandManagement system, owned by LandManagementUser). M77Farm lives
// in the m77farms collection and is part of the M77 field stack.
//
// M77 farms today:
//   - Under Client M77 AG:        LAFARMS, KBFARMS, HDFARMS, MEFARMS,
//                                 A1FARMS, PETERSON, Unassigned,
//                                 Unassigned (JD imported)
//   - Under Client Allphin Farms: Lueking
//   - Under Client Custom:        Nelson, Eisenhard, RPM
//
// `landlordUser` is an optional per-Farm override of the Client-level user
// list. Useful if a single landlord owns a specific farm under a
// multi-farm Client. `shareOverride` overrides Client.defaultShare.
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

  landlordUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  shareOverride: {
    type: Number,
    min: 0,
    max: 1,
    default: null
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
