const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  category: {
    type: String,
    enum: ['Hay Equipment', 'Sprayer Equipment', 'Harvest Equipment', 'Attachments',
           'Combine Parts', 'Feed Truck', 'Tractors', 'Trucks', 'Trailers',
           'Tillage', 'Planting', 'Other'],
    default: 'Other'
  },
  make: String,
  model: String,
  year: Number,
  vin: String,
  serialNumber: String,
  description: String,

  // Images & Media
  images: [String],
  videos: [String],

  // Specifications (flexible key-value)
  specs: {
    type: Map,
    of: String
  },

  // Sale Status
  forSale: {
    type: Boolean,
    default: false
  },
  saleStatus: {
    type: String,
    enum: ['available', 'pending', 'sold', 'not-for-sale'],
    default: 'not-for-sale'
  },
  askingPrice: {
    type: Number,
    default: 0
  },
  floorPrice: {
    type: Number,
    default: 0
  },
  soldPrice: Number,
  soldDate: Date,
  soldTo: String,

  // Financial Tracking
  currentValue: {
    type: Number,
    default: 0
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  purchaseDate: Date,

  // Loan/Payment Information
  hasLoan: {
    type: Boolean,
    default: false
  },
  amountOwed: {
    type: Number,
    default: 0
  },
  lender: String,
  loanAccountNumber: String,
  interestRate: Number,
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'none'],
    default: 'none'
  },
  nextPaymentDate: Date,
  loanEndDate: Date,

  // Market Research
  marketResearch: {
    type: Map,
    of: String
  },

  // Marketplace suggestions for advertising
  marketplaces: [{
    name: String,
    reason: String,
    url: String,
    rank: Number
  }],

  // Location
  location: {
    type: String,
    default: 'Phillips County, CO'
  },

  // Owner Entity (M77 AG, McConnell Enterprises, Personal, etc.)
  ownerEntity: {
    type: String,
    enum: ['M77 AG', 'McConnell Enterprises', 'Kyle & Brandi McConnell', 'Personal', 'Other'],
    default: 'M77 AG'
  },

  // Notes
  notes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
equipmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for equity (value - owed)
equipmentSchema.virtual('equity').get(function() {
  return this.currentValue - this.amountOwed;
});

// Ensure virtuals are included in JSON
equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
