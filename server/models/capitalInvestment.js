const mongoose = require('mongoose');

/**
 * Capital Investment Model
 * Track land, buildings, infrastructure, and major assets
 */

const capitalInvestmentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['land', 'building', 'infrastructure', 'improvement', 'vehicle', 'equipment', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: [
      // Land categories
      'cropland', 'pasture', 'timberland', 'homestead', 'hunting_land', 'development',
      // Building categories
      'barn', 'shop', 'grain_storage', 'equipment_shed', 'house', 'outbuilding', 'livestock_facility',
      // Infrastructure
      'fencing', 'irrigation', 'drainage', 'road', 'utilities', 'water_system',
      // Vehicles
      'truck', 'tractor', 'combine', 'car', 'rv', 'trailer', 'atv',
      // Equipment
      'planter', 'sprayer', 'tillage', 'hay_equipment', 'grain_handling',
      // Other
      'other'
    ],
    required: true
  },
  description: String,

  // Location
  location: {
    address: String,
    county: String,
    state: String,
    legalDescription: String,  // Township/Range/Section
    gpsCoordinates: {
      lat: Number,
      lng: Number
    },
    parcelNumber: String,
    associatedFarm: String  // Link to which farm this belongs to
  },

  // Land-specific fields
  landDetails: {
    totalAcres: Number,
    tillableAcres: Number,
    pastureAcres: Number,
    timberAcres: Number,
    wetlandAcres: Number,
    buildingSites: Number,
    soilTypes: [String],
    csr2Rating: Number,  // Corn Suitability Rating
    floodZone: Boolean,
    crpAcres: Number,    // Conservation Reserve Program
    crpContractEnd: Date
  },

  // Building-specific fields
  buildingDetails: {
    squareFeet: Number,
    yearBuilt: Number,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    construction: String,  // e.g., 'steel', 'wood frame', 'pole barn'
    roofType: String,
    utilities: [String],  // ['electric', 'water', 'gas', 'septic']
    storageCapacity: String  // e.g., '50,000 bushels'
  },

  // Vehicle-specific fields
  vehicleDetails: {
    year: Number,
    make: String,
    model: String,
    vin: String,
    mileage: Number,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    color: String,
    fuelType: String,
    transmission: String,
    licensePlate: String,
    registrationExpires: Date
  },

  // Purchase/Acquisition
  acquisition: {
    date: Date,
    purchasePrice: Number,
    seller: String,
    closingCosts: Number,
    totalCost: Number,  // purchasePrice + closingCosts + improvements at purchase
    financedAmount: Number,
    downPayment: Number,
    notes: String
  },

  // Current Valuation
  currentValue: {
    estimatedValue: {
      type: Number,
      default: 0
    },
    lastAppraisalDate: Date,
    lastAppraisalValue: Number,
    appraiser: String,
    valuePerAcre: Number,  // For land
    assessedValue: Number,  // County assessed value
    taxableValue: Number
  },

  // Financing/Loans
  loans: [{
    lender: String,
    loanNumber: String,
    originalAmount: Number,
    currentBalance: Number,
    interestRate: Number,
    termYears: Number,
    startDate: Date,
    maturityDate: Date,
    monthlyPayment: Number,
    annualPayment: Number,
    collateral: String,
    notes: String
  }],

  // Depreciation (for buildings/improvements)
  depreciation: {
    method: {
      type: String,
      enum: ['straight_line', 'macrs', 'none'],
      default: 'straight_line'
    },
    usefulLife: Number,  // in years
    salvageValue: Number,
    startDate: Date,
    annualDepreciation: Number,
    accumulatedDepreciation: {
      type: Number,
      default: 0
    },
    bookValue: Number
  },

  // Improvements/Capital Expenditures
  improvements: [{
    date: Date,
    description: String,
    cost: Number,
    contractor: String,
    category: String,
    addedToValue: Boolean,
    depreciable: Boolean,
    usefulLife: Number,
    notes: String
  }],

  // Annual Costs
  annualCosts: {
    propertyTax: Number,
    insurance: Number,
    maintenance: Number,
    utilities: Number,
    other: Number,
    total: Number
  },

  // Income (if any)
  income: {
    rentalIncome: Number,
    cashRentPerAcre: Number,
    leaseType: {
      type: String,
      enum: ['cash_rent', 'crop_share', 'custom_farming', 'hunting_lease', 'other']
    },
    tenant: String,
    leaseStart: Date,
    leaseEnd: Date,
    notes: String
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['deed', 'survey', 'appraisal', 'loan_docs', 'lease', 'insurance', 'tax', 'photo', 'other']
    },
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Photos
  photos: [{
    url: String,
    caption: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  status: {
    type: String,
    enum: ['owned', 'for_sale', 'sold', 'leased_out', 'under_contract'],
    default: 'owned'
  },

  // Sale Information (if sold)
  saleInfo: {
    date: Date,
    salePrice: Number,
    buyer: String,
    closingCosts: Number,
    netProceeds: Number,
    gainLoss: Number,
    notes: String
  },

  // Notes
  notes: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
capitalInvestmentSchema.index({ type: 1 });
capitalInvestmentSchema.index({ category: 1 });
capitalInvestmentSchema.index({ status: 1 });
capitalInvestmentSchema.index({ 'location.associatedFarm': 1 });

// Virtual for total equity
capitalInvestmentSchema.virtual('equity').get(function() {
  const value = this.currentValue?.estimatedValue || 0;
  const totalLoans = (this.loans || []).reduce((sum, loan) => sum + (loan.currentBalance || 0), 0);
  return value - totalLoans;
});

// Virtual for net annual return
capitalInvestmentSchema.virtual('netAnnualReturn').get(function() {
  const income = this.income?.rentalIncome || 0;
  const costs = this.annualCosts?.total || 0;
  const loanPayments = (this.loans || []).reduce((sum, loan) => sum + (loan.annualPayment || 0), 0);
  return income - costs - loanPayments;
});

// Static method to get portfolio summary
capitalInvestmentSchema.statics.getPortfolioSummary = async function() {
  const assets = await this.find({ status: 'owned' });

  const summary = {
    totalAssets: assets.length,
    totalValue: 0,
    totalEquity: 0,
    totalDebt: 0,
    totalAcres: 0,
    totalBuildings: 0,
    byType: {},
    annualIncome: 0,
    annualExpenses: 0
  };

  assets.forEach(asset => {
    const value = asset.currentValue?.estimatedValue || 0;
    const debt = (asset.loans || []).reduce((sum, loan) => sum + (loan.currentBalance || 0), 0);

    summary.totalValue += value;
    summary.totalDebt += debt;
    summary.totalEquity += (value - debt);

    if (asset.type === 'land') {
      summary.totalAcres += asset.landDetails?.totalAcres || 0;
    }
    if (asset.type === 'building') {
      summary.totalBuildings++;
    }

    summary.annualIncome += asset.income?.rentalIncome || 0;
    summary.annualExpenses += asset.annualCosts?.total || 0;

    // Group by type
    if (!summary.byType[asset.type]) {
      summary.byType[asset.type] = { count: 0, value: 0, acres: 0 };
    }
    summary.byType[asset.type].count++;
    summary.byType[asset.type].value += value;
    if (asset.type === 'land') {
      summary.byType[asset.type].acres += asset.landDetails?.totalAcres || 0;
    }
  });

  return summary;
};

const CapitalInvestment = mongoose.model('CapitalInvestment', capitalInvestmentSchema);

module.exports = CapitalInvestment;
