const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  // Basic field information
  name: {
    type: String,
    required: true
  },
  fieldNumber: {
    type: String
  },
  description: {
    type: String
  },
  // Link to parent property
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Field size
  acres: {
    type: Number,
    required: true
  },
  // Soil information
  soilType: {
    type: String
  },
  soilClass: {
    type: String // e.g., 'Class I', 'Class II', etc.
  },
  drainageTile: {
    type: Boolean,
    default: false
  },
  irrigated: {
    type: Boolean,
    default: false
  },
  // Boundary data
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: [[Number]] // GeoJSON format
  },
  kmlFile: {
    type: String // Path to KML file if uploaded
  },
  // Current crop information
  currentCrop: {
    year: Number,
    cropType: {
      type: String,
      enum: ['corn', 'soybeans', 'wheat', 'milo', 'sunflower', 'fallow', 'other']
    },
    variety: String,
    plantingDate: Date,
    expectedHarvestDate: Date,
    estimatedYield: Number, // bushels per acre
    actualYield: Number
  },
  // Historical crop data (last 5-10 years)
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
    yield: Number, // bushels per acre
    pricePerBushel: Number,
    totalRevenue: Number,
    notes: String
  }],
  // Field-specific expenses (chemicals, fertilizer, etc.)
  fieldExpenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  // Financial projections (visible to landlords)
  financials: {
    breakEvenPerAcre: Number,      // Break-even price per acre
    profitPerAcre: Number,          // Projected profit/loss per acre
    totalExpenses: Number,          // Total projected expenses for field
    projectedRevenue: Number,       // Total projected revenue for field
    costPerBushel: Number,          // Cost per bushel calculation
    lastUpdated: Date               // When projections were last updated
  },
  // Field status
  status: {
    type: String,
    enum: ['active', 'fallow', 'retired', 'CRP'],
    default: 'active'
  },
  // Notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
fieldSchema.index({ property: 1 });
fieldSchema.index({ landlord: 1 });
fieldSchema.index({ 'currentCrop.year': 1 });
fieldSchema.index({ status: 1 });

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
