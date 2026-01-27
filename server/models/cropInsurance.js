const mongoose = require('mongoose');

const cropInsuranceSchema = new mongoose.Schema({
  // Farm Association
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },

  // Policy Identification
  policyNumber: {
    type: String,
    required: true,
    trim: true
  },
  policyYear: {
    type: Number,
    required: true
  },

  // Insurance Provider
  insuranceCompany: {
    type: String,
    required: true,
    trim: true
  },
  agentName: String,
  agentPhone: String,
  agentEmail: String,

  // Policy Type
  policyType: {
    type: String,
    enum: [
      'revenue-protection', // RP - Most common
      'revenue-protection-harvest-price', // RP-HPE
      'yield-protection', // YP
      'area-revenue-protection', // ARP
      'area-yield-protection', // AYP
      'whole-farm-revenue', // WFRP
      'margin-protection', // MP
      'stacked-income-protection', // STAX
      'supplemental-coverage-option', // SCO
      'enhanced-coverage-option' // ECO
    ],
    required: true
  },

  // Coverage Level
  coverageLevel: {
    type: Number,
    min: 50,
    max: 85,
    default: 75 // Common coverage level
  },

  // Prevented Planting Coverage
  preventedPlantingCoverage: {
    type: Number,
    min: 0,
    max: 100,
    default: 60
  },

  // Associated Fields
  coveredFields: [{
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    fieldName: String,
    acres: Number,
    cropType: {
      type: String,
      enum: ['corn', 'wheat', 'milo', 'soybeans', 'sunflower', 'fallow', 'other']
    },
    approvedYield: Number, // APH or approved yield
    guaranteedYield: Number,
    projectedPrice: Number,
    harvestPrice: Number,
    guaranteedRevenue: Number
  }],

  // Financial Details
  totalAcresCovered: {
    type: Number,
    default: 0
  },
  totalPremium: {
    type: Number,
    default: 0
  },
  subsidizedPremium: {
    type: Number,
    default: 0 // Government-subsidized portion
  },
  producerPremium: {
    type: Number,
    default: 0 // Farmer's out-of-pocket cost
  },
  premiumPerAcre: {
    type: Number,
    default: 0
  },
  adminFee: {
    type: Number,
    default: 30 // Standard admin fee
  },

  // Important Dates
  salesClosingDate: Date,
  acreageReportingDate: Date,
  premiumDueDate: Date,
  harvestDate: Date,
  finalPlantingDate: Date,
  latePaymentDate: Date,

  // Coverage Calculations
  liability: {
    type: Number,
    default: 0 // Total insured liability
  },
  guaranteedRevenuePerAcre: Number,
  projectedPricePerBushel: Number,
  harvestPricePerBushel: Number,

  // Claims
  claims: [{
    claimNumber: String,
    claimType: {
      type: String,
      enum: ['prevented-planting', 'crop-loss', 'revenue-loss', 'quality-loss', 'other']
    },
    claimDate: Date,
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    fieldName: String,
    acresAffected: Number,
    causeOfLoss: {
      type: String,
      enum: [
        'drought', 'flood', 'hail', 'freeze', 'wind',
        'excess-moisture', 'disease', 'insects', 'wildlife',
        'fire', 'prevented-planting', 'other'
      ]
    },
    lossDescription: String,
    estimatedLoss: Number,
    adjustedLoss: Number,
    paymentAmount: Number,
    paymentDate: Date,
    status: {
      type: String,
      enum: ['pending', 'under-review', 'approved', 'denied', 'paid'],
      default: 'pending'
    },
    adjusterName: String,
    adjusterPhone: String,
    inspectionDate: Date,
    notes: String
  }],

  // APH (Actual Production History)
  aphHistory: [{
    year: Number,
    cropType: String,
    acres: Number,
    production: Number, // Total bushels
    yield: Number, // Bushels per acre
    isPlugYield: Boolean // Whether USDA T-yield was used
  }],

  // Calculated APH
  approvedAPH: {
    corn: Number,
    soybeans: Number,
    wheat: Number,
    milo: Number,
    sunflower: Number
  },

  // Policy Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'active', 'expired', 'cancelled'],
    default: 'draft'
  },

  // Hail/Additional Coverage
  hailEndorsement: {
    hasEndorsement: {
      type: Boolean,
      default: false
    },
    deductible: Number,
    coverage: Number,
    premium: Number
  },

  // Wind Coverage
  windEndorsement: {
    hasEndorsement: {
      type: Boolean,
      default: false
    },
    deductible: Number,
    coverage: Number,
    premium: Number
  },

  // Notes and Documents
  notes: String,
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['policy', 'endorsement', 'claim', 'appraisal', 'other']
    },
    url: String,
    uploadDate: Date
  }],

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  }
}, {
  timestamps: true
});

// Indexes
cropInsuranceSchema.index({ farm: 1 });
cropInsuranceSchema.index({ policyYear: 1 });
cropInsuranceSchema.index({ policyNumber: 1 });
cropInsuranceSchema.index({ status: 1 });
cropInsuranceSchema.index({ farm: 1, policyYear: 1 });

// Virtual for total claims paid
cropInsuranceSchema.virtual('totalClaimsPaid').get(function() {
  return this.claims
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
});

// Virtual for pending claims
cropInsuranceSchema.virtual('pendingClaims').get(function() {
  return this.claims.filter(c => c.status === 'pending' || c.status === 'under-review');
});

// Method to calculate total coverage
cropInsuranceSchema.methods.calculateTotalCoverage = function() {
  let totalLiability = 0;

  this.coveredFields.forEach(field => {
    const guaranteedYield = field.approvedYield * (this.coverageLevel / 100);
    const guaranteedRevenue = guaranteedYield * field.projectedPrice * field.acres;
    field.guaranteedYield = guaranteedYield;
    field.guaranteedRevenue = guaranteedRevenue;
    totalLiability += guaranteedRevenue;
  });

  this.liability = totalLiability;
  this.totalAcresCovered = this.coveredFields.reduce((sum, f) => sum + (f.acres || 0), 0);

  return this.save();
};

// Method to file a claim
cropInsuranceSchema.methods.fileClaim = function(claimData) {
  this.claims.push({
    ...claimData,
    claimDate: new Date(),
    status: 'pending'
  });
  return this.save();
};

// Method to update claim status
cropInsuranceSchema.methods.updateClaimStatus = function(claimNumber, status, paymentAmount = null, paymentDate = null) {
  const claim = this.claims.find(c => c.claimNumber === claimNumber);
  if (claim) {
    claim.status = status;
    if (paymentAmount !== null) claim.paymentAmount = paymentAmount;
    if (paymentDate !== null) claim.paymentDate = paymentDate;
    if (status === 'paid' && paymentDate === null) claim.paymentDate = new Date();
  }
  return this.save();
};

// Static method to get insurance summary by farm and year
cropInsuranceSchema.statics.getInsuranceSummary = async function(farmId, year) {
  const policies = await this.find({ farm: farmId, policyYear: year })
    .populate('coveredFields.field', 'fieldName acres')
    .lean();

  let summary = {
    totalPolicies: policies.length,
    totalAcresCovered: 0,
    totalPremium: 0,
    totalProducerPremium: 0,
    totalLiability: 0,
    totalClaimsPaid: 0,
    pendingClaims: 0,
    policiesByType: {}
  };

  policies.forEach(policy => {
    summary.totalAcresCovered += policy.totalAcresCovered || 0;
    summary.totalPremium += policy.totalPremium || 0;
    summary.totalProducerPremium += policy.producerPremium || 0;
    summary.totalLiability += policy.liability || 0;

    policy.claims?.forEach(claim => {
      if (claim.status === 'paid') {
        summary.totalClaimsPaid += claim.paymentAmount || 0;
      } else if (claim.status === 'pending' || claim.status === 'under-review') {
        summary.pendingClaims++;
      }
    });

    if (!summary.policiesByType[policy.policyType]) {
      summary.policiesByType[policy.policyType] = {
        count: 0,
        acres: 0,
        premium: 0
      };
    }
    summary.policiesByType[policy.policyType].count++;
    summary.policiesByType[policy.policyType].acres += policy.totalAcresCovered || 0;
    summary.policiesByType[policy.policyType].premium += policy.producerPremium || 0;
  });

  return summary;
};

// Static method to get all policies needing attention (upcoming dates, pending claims)
cropInsuranceSchema.statics.getPoliciesNeedingAttention = async function(farmId) {
  const today = new Date();
  const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return this.find({
    farm: farmId,
    status: 'active',
    $or: [
      { salesClosingDate: { $lte: thirtyDaysOut, $gte: today } },
      { acreageReportingDate: { $lte: thirtyDaysOut, $gte: today } },
      { premiumDueDate: { $lte: thirtyDaysOut, $gte: today } },
      { 'claims.status': { $in: ['pending', 'under-review'] } }
    ]
  }).lean();
};

const CropInsurance = mongoose.model('CropInsurance', cropInsuranceSchema);

module.exports = CropInsurance;
