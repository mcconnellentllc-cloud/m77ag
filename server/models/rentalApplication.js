const mongoose = require('mongoose');

const rentalApplicationSchema = new mongoose.Schema({
  // Property and Offer Details
  property: {
    type: String,
    required: true
  },
  offerAmount: {
    type: Number,
    required: true,
    min: 1250 // Minimum acceptable offer
  },

  // Personal Information
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    ssnLast4: { type: String, required: true }
  },

  // Current Address
  currentAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true }
  },

  // Move-in Details
  moveInDate: {
    type: Date,
    required: true
  },

  // Employment Information
  employment: {
    employer: { type: String, required: true },
    jobTitle: { type: String, required: true },
    length: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    supervisorPhone: { type: String }
  },

  // References
  references: [{
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  }],

  // Additional Information
  additionalInfo: {
    pets: { type: String },
    vehicles: { type: Number, default: 0 },
    occupants: { type: Number, required: true },
    notes: { type: String }
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'contract_sent'],
    default: 'pending'
  },

  // Background Check
  backgroundCheckCompleted: {
    type: Boolean,
    default: false
  },
  backgroundCheckNotes: {
    type: String
  },

  // Contract Details (after approval)
  contractSentDate: {
    type: Date
  },
  contractSignedDate: {
    type: Date
  },
  leaseStartDate: {
    type: Date
  },
  leaseEndDate: {
    type: Date
  },

  // Agreement
  agreedToTerms: {
    type: Boolean,
    required: true
  },

  // Admin Notes
  adminNotes: {
    type: String
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for searching
rentalApplicationSchema.index({ 'personalInfo.email': 1 });
rentalApplicationSchema.index({ status: 1 });
rentalApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('RentalApplication', rentalApplicationSchema);
