const mongoose = require('mongoose');

const realEstateSchema = new mongoose.Schema({
  // Property Identification
  name: {
    type: String,
    required: true
  },
  legalDescription: {
    type: String
  },
  county: {
    type: String,
    default: 'Phillips County'
  },
  state: {
    type: String,
    default: 'CO'
  },
  acres: {
    type: Number,
    default: 0
  },
  parcelNumber: {
    type: String
  },

  // Property Type
  propertyType: {
    type: String,
    enum: ['Pasture', 'Farmland', 'Residential', 'Commercial', 'Mixed Use', 'Other'],
    default: 'Pasture'
  },

  // Valuation
  currentValue: {
    type: Number,
    default: 0
  },
  assessedValue: {
    type: Number,
    default: 0
  },
  purchasePrice: {
    type: Number
  },
  purchaseDate: {
    type: Date
  },
  pricePerAcre: {
    type: Number
  },

  // Loan Information
  hasLoan: {
    type: Boolean,
    default: false
  },
  amountOwed: {
    type: Number,
    default: 0
  },
  lender: {
    type: String
  },
  loanAccountNumber: {
    type: String
  },
  interestRate: {
    type: Number
  },
  paymentAmount: {
    type: Number
  },
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual', 'none'],
    default: 'none'
  },
  nextPaymentDate: {
    type: Date
  },
  loanEndDate: {
    type: Date
  },

  // Tax Information
  annualTaxes: {
    type: Number,
    default: 0
  },
  taxDueDate: {
    type: Date
  },
  taxAccountNumber: {
    type: String
  },

  // Ownership
  owner: {
    type: String,
    default: 'M77 AG'
  },
  ownerEntity: {
    type: String,
    enum: ['M77 AG', 'McConnell Enterprises', 'Kyle & Brandi McConnell', 'Personal', 'Other'],
    default: 'M77 AG'
  },
  titleNumber: {
    type: String
  },

  // Additional Info
  notes: {
    type: String
  },
  images: [{
    type: String
  }],
  documents: [{
    name: String,
    url: String,
    uploadDate: Date
  }],

  // Status
  forSale: {
    type: Boolean,
    default: false
  },
  askingPrice: {
    type: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for equity
realEstateSchema.virtual('equity').get(function() {
  return (this.currentValue || 0) - (this.amountOwed || 0);
});

// Virtual for value per acre
realEstateSchema.virtual('valuePerAcre').get(function() {
  if (this.acres && this.acres > 0) {
    return Math.round(this.currentValue / this.acres);
  }
  return 0;
});

const RealEstate = mongoose.model('RealEstate', realEstateSchema);

module.exports = RealEstate;
