const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  // Farm Association
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },

  // Field Identification
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  fieldNumber: {
    type: String,
    trim: true
  },

  // Field Details
  acres: {
    type: Number,
    required: true
  },

  // Location
  location: {
    address: String,
    gpsCoordinates: {
      latitude: Number,
      longitude: Number
    },
    legalDescription: String,
    section: String,
    township: String,
    range: String
  },

  // Landlord/Owner
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  landlordName: String,

  // Lease Terms
  leaseTerms: {
    leaseType: {
      type: String,
      enum: ['cash-rent', 'crop-share', 'flex-lease', 'owned'],
      default: 'cash-rent'
    },
    rentPerAcre: Number,
    totalRent: Number,
    sharePercentage: Number,
    leaseStart: Date,
    leaseEnd: Date,
    paymentSchedule: String,
    paymentLocation: String
  },

  // Crop Information
  currentCrop: {
    cropType: {
      type: String,
      enum: ['corn', 'wheat', 'milo', 'soybeans', 'sunflower', 'fallow', 'other']
    },
    year: Number,
    plantingDate: Date,
    harvestDate: Date,
    expectedYield: Number,
    actualYield: Number
  },

  // Crop History
  cropHistory: [{
    year: Number,
    crop: String,
    yield: Number,
    revenue: Number,
    costs: Number,
    netIncome: Number
  }],

  // Soil Information
  soilInfo: {
    soilType: String,
    irrigated: {
      type: Boolean,
      default: false
    },
    drainageTiling: {
      type: Boolean,
      default: false
    },
    averageCornYield: Number,
    averageWheatYield: Number
  },

  // Notes
  notes: String,

  // Status
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
fieldSchema.index({ farm: 1 });
fieldSchema.index({ landlord: 1 });
fieldSchema.index({ fieldName: 1, farm: 1 });

// Virtual for full field name
fieldSchema.virtual('fullName').get(function() {
  return this.fieldNumber ? `${this.fieldName} (#${this.fieldNumber})` : this.fieldName;
});

const Field = mongoose.model('Field', fieldSchema);

module.exports = Field;
