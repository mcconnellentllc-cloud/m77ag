const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  // Farm Association (using Farm model for land management compatibility)
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
  description: {
    type: String
  },

  // Field Size
  acres: {
    type: Number,
    required: true
  },

  // Location Information
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

  // GeoJSON Boundary Data
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: [[Number]]
  },
  kmlFile: {
    type: String
  },

  // Landlord/Owner (using LandManagementUser for compatibility)
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

  // Soil Information
  soilType: {
    type: String
  },
  soilClass: {
    type: String
  },
  irrigated: {
    type: Boolean,
    default: false
  },
  drainageTile: {
    type: Boolean,
    default: false
  },
  averageCornYield: Number,
  averageWheatYield: Number,

  // Current Crop Information
  currentCrop: {
    year: Number,
    cropType: {
      type: String,
      enum: ['corn', 'wheat', 'milo', 'soybeans', 'sunflower', 'fallow', 'other']
    },
    variety: String,
    plantingDate: Date,
    harvestDate: Date,
    expectedHarvestDate: Date,
    estimatedYield: Number,
    expectedYield: Number,
    actualYield: Number
  },

  // Historical Crop Data
  cropHistory: [{
    year: {
      type: Number,
      required: true
    },
    cropType: {
      type: String,
      required: true
    },
    variety: String,
    plantingDate: Date,
    harvestDate: Date,
    yield: Number,
    pricePerBushel: Number,
    totalRevenue: Number,
    revenue: Number,
    costs: Number,
    netIncome: Number,
    notes: String
  }],

  // Field-specific Expenses
  fieldExpenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],

  // Field Status
  status: {
    type: String,
    enum: ['active', 'fallow', 'retired', 'CRP'],
    default: 'active'
  },
  active: {
    type: Boolean,
    default: true
  },

  // Notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
fieldSchema.index({ farm: 1 });
fieldSchema.index({ landlord: 1 });
fieldSchema.index({ fieldName: 1, farm: 1 });
fieldSchema.index({ 'currentCrop.year': 1 });
fieldSchema.index({ status: 1 });

// Virtual for full field name
fieldSchema.virtual('fullName').get(function() {
  return this.fieldNumber ? `${this.fieldName} (#${this.fieldNumber})` : this.fieldName;
});

// Virtual for calculating average historical yield
fieldSchema.virtual('averageYield').get(function() {
  if (this.cropHistory.length === 0) return 0;

  const totalYield = this.cropHistory.reduce((sum, crop) => sum + (crop.yield || 0), 0);
  return totalYield / this.cropHistory.length;
});

// Method to get yield for a specific year
fieldSchema.methods.getYieldByYear = function(year) {
  return this.cropHistory.find(crop => crop.year === year);
};

// Method to add crop history entry
fieldSchema.methods.addCropHistory = function(cropData) {
  // Remove existing entry for this year if present
  this.cropHistory = this.cropHistory.filter(crop => crop.year !== cropData.year);
  // Add new entry
  this.cropHistory.push(cropData);
  // Sort by year descending
  this.cropHistory.sort((a, b) => b.year - a.year);
  return this.save();
};

const Field = mongoose.model('Field', fieldSchema);

module.exports = Field;
