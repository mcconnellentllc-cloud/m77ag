const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  // Farm Basic Info
  farmName: {
    type: String,
    required: true,
    trim: true
  },
  farmCode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },

  // Owner/Manager
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser',
    required: true
  },

  // Farm Details
  totalAcres: {
    type: Number,
    default: 0
  },
  location: {
    address: String,
    city: String,
    state: String,
    zip: String,
    county: String
  },

  // Farm Type
  farmType: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },

  // Settings
  settings: {
    allowLandlordAccess: {
      type: Boolean,
      default: true
    },
    landlordCanViewFinancials: {
      type: Boolean,
      default: false
    },
    landlordCanInputPreferences: {
      type: Boolean,
      default: true
    }
  },

  // Status
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
farmSchema.index({ farmCode: 1 });
farmSchema.index({ owner: 1 });

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
