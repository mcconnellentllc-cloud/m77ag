const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // Basic property information
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  // Property location
  address: {
    street: String,
    city: String,
    county: String,
    state: String,
    zip: String
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  // Legal description
  legalDescription: {
    type: String
  },
  parcelId: {
    type: String
  },
  // Property size and metrics
  totalAcres: {
    type: Number,
    required: true
  },
  farmableAcres: {
    type: Number
  },
  // Market value tracking
  marketValue: {
    estimatedValue: {
      type: Number
    },
    valuePerAcre: {
      type: Number
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String, // e.g., 'Zillow', 'County Assessor', 'Manual Entry'
    },
    notes: String
  },
  // Ownership information
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Lease/Contract information
  leaseDetails: {
    leaseType: {
      type: String,
      enum: ['cash_rent', 'crop_share', 'custom_work', 'flexible_lease'],
      default: 'cash_rent'
    },
    leaseRate: Number, // $ per acre for cash rent, or % for crop share
    leaseStartDate: Date,
    leaseEndDate: Date,
    paymentSchedule: String,
    terms: String
  },
  // Property tax information
  propertyTax: {
    annualAmount: Number,
    lastPaidDate: Date,
    paidBy: {
      type: String,
      enum: ['landlord', 'farmer'],
      default: 'landlord'
    }
  },
  // Fields on this property
  fields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  }],
  // Property type
  propertyType: {
    type: String,
    enum: ['cropland', 'pasture', 'mixed', 'hunting', 'other'],
    default: 'cropland'
  },
  // Active status
  isActive: {
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

// Virtual for calculating total property value
propertySchema.virtual('calculatedValue').get(function() {
  if (this.marketValue.valuePerAcre && this.totalAcres) {
    return this.marketValue.valuePerAcre * this.totalAcres;
  }
  return this.marketValue.estimatedValue || 0;
});

// Indexes for efficient queries
propertySchema.index({ landlord: 1 });
propertySchema.index({ isActive: 1 });
propertySchema.index({ 'leaseDetails.leaseEndDate': 1 });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
