const mongoose = require('mongoose');

/**
 * Cattle Model - Inspired by CattleMax
 * Complete herd management with birth records, weights, health, and breeding tracking
 */

const cattleSchema = new mongoose.Schema({
  // Identification
  tagNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  electronicId: {
    type: String,  // RFID/EID tag
    trim: true
  },

  // USDA Official Identification (for government programs)
  usda: {
    officialTagNumber: {
      type: String,  // 840 tag - 15 digit number starting with 840
      trim: true
    },
    premisesId: {
      type: String,  // 7-character Premises Identification Number (PIN)
      trim: true
    },
    ageVerified: {
      type: Boolean,
      default: false
    },
    ageVerificationDate: Date,
    ageVerificationMethod: {
      type: String,
      enum: ['birth_record', 'dentition', 'documentation', 'other']
    },
    sourceVerified: {
      type: Boolean,
      default: false
    },
    countryOfOrigin: {
      type: String,
      default: 'USA'
    },
    brandInspectionNumber: String,
    brandInspectionDate: Date
  },

  // LRP - Livestock Risk Protection Insurance
  lrp: {
    covered: {
      type: Boolean,
      default: false
    },
    policyNumber: String,
    coverageLevel: Number,  // Percentage (e.g., 95.5)
    targetWeight: Number,   // Expected sale weight in lbs
    endorsementDate: Date,  // When coverage began
    endDate: Date,          // Coverage end date
    headCount: Number,      // Number of head covered under this policy
    expectedPrice: Number,  // $/cwt at time of purchase
    actualPrice: Number,    // Actual price at settlement
    indemnity: Number,      // Indemnity payment received
    premium: Number,        // Premium paid
    agent: {
      name: String,
      phone: String,
      email: String
    },
    notes: String
  },

  // ERP - Emergency Relief Program & Disaster Assistance
  erp: {
    eligibleForERP: {
      type: Boolean,
      default: false
    },
    disasterYear: Number,
    disasterType: {
      type: String,
      enum: ['drought', 'flood', 'wildfire', 'hurricane', 'winter_storm', 'disease', 'other']
    },
    lossDocumented: {
      type: Boolean,
      default: false
    },
    lossDate: Date,
    lossDescription: String,
    claimFiled: {
      type: Boolean,
      default: false
    },
    claimNumber: String,
    claimAmount: Number,
    paymentReceived: Number,
    paymentDate: Date
  },

  // ELAP - Emergency Livestock Assistance Program
  elap: {
    eligible: {
      type: Boolean,
      default: false
    },
    programYear: Number,
    assistanceType: {
      type: String,
      enum: ['grazing_loss', 'feed_transportation', 'water_hauling', 'other']
    },
    paymentReceived: Number
  },

  // Grazing History (for pasture rotation and government programs)
  grazingHistory: [{
    pasture: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    acres: Number,
    stockingRate: Number,  // Head per acre or AUM
    forageType: {
      type: String,
      enum: ['native_grass', 'improved_pasture', 'crop_residue', 'cover_crop', 'hay_field', 'other']
    },
    forageCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    supplementalFeed: Boolean,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Program Enrollment Status
  programEnrollment: {
    // Beef Quality Assurance (BQA)
    bqaCertified: {
      type: Boolean,
      default: false
    },
    bqaCertificationDate: Date,
    bqaLevel: String,

    // NHTC - Non-Hormone Treated Cattle
    nhtcEligible: {
      type: Boolean,
      default: false
    },
    nhtcEnrollmentDate: Date,

    // GAP - Global Animal Partnership
    gapCertified: {
      type: Boolean,
      default: false
    },
    gapLevel: Number,  // 1-5+

    // Organic
    organicCertified: {
      type: Boolean,
      default: false
    },
    organicCertifier: String,

    // Natural Program
    naturalProgram: {
      type: Boolean,
      default: false
    },
    naturalProgramName: String,

    // Other certifications
    otherCertifications: [{
      name: String,
      certificationDate: Date,
      expirationDate: Date,
      certifier: String
    }]
  },

  // Classification
  type: {
    type: String,
    enum: ['cow', 'bull', 'heifer', 'steer', 'calf', 'bred_heifer'],
    required: true
  },
  breed: {
    type: String,
    default: 'Commercial'
  },
  color: String,
  markings: String,

  // Birth Information
  birthDate: {
    type: Date,
    required: true
  },
  birthWeight: {
    type: Number,  // in pounds
    min: 0
  },
  birthLocation: {
    pasture: String,
    notes: String
  },
  birthType: {
    type: String,
    enum: ['single', 'twin', 'triplet'],
    default: 'single'
  },
  birthEase: {
    type: String,
    enum: ['unassisted', 'easy_pull', 'hard_pull', 'c_section'],
    default: 'unassisted'
  },

  // Parentage
  dam: {
    tagNumber: String,
    cattleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle'
    }
  },
  sire: {
    tagNumber: String,
    cattleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle'
    },
    aiSire: Boolean,  // If AI breeding
    sireName: String
  },

  // Current Status
  status: {
    type: String,
    enum: ['active', 'sold', 'deceased', 'culled', 'transferred'],
    default: 'active'
  },
  currentPasture: String,
  currentLocation: String,

  // Weight Records (array for tracking over time)
  weightRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    weight: {
      type: Number,  // in pounds
      required: true
    },
    condition: {
      type: String,
      enum: ['thin', 'moderate', 'good', 'fat'],
      default: 'good'
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Health Records
  healthRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['vaccination', 'treatment', 'deworming', 'vitamin', 'antibiotic', 'injury', 'illness', 'other'],
      required: true
    },
    product: String,
    dosage: String,
    route: {
      type: String,
      enum: ['subcutaneous', 'intramuscular', 'oral', 'pour_on', 'other']
    },
    withdrawalDays: Number,
    withdrawalDate: Date,
    cost: Number,
    veterinarian: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Breeding Records (for cows/heifers)
  breedingRecords: [{
    date: Date,
    type: {
      type: String,
      enum: ['natural', 'ai', 'embryo_transfer']
    },
    sireTag: String,
    sireName: String,
    technician: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Pregnancy Check Records
  pregnancyChecks: [{
    date: Date,
    result: {
      type: String,
      enum: ['open', 'bred', 'pregnant', 'unknown']
    },
    daysPregnant: Number,
    expectedCalvingDate: Date,
    veterinarian: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Calving History (for cows)
  calvingHistory: [{
    date: Date,
    calfTag: String,
    calfSex: {
      type: String,
      enum: ['bull', 'heifer']
    },
    birthWeight: Number,
    birthEase: String,
    notes: String,
    calfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle'
    }
  }],

  // Financial
  purchaseInfo: {
    date: Date,
    price: Number,
    source: String,
    notes: String
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  saleInfo: {
    date: Date,
    price: Number,
    buyer: String,
    weight: Number,
    pricePerPound: Number,
    notes: String
  },

  // Disposal (if culled/deceased)
  disposalInfo: {
    date: Date,
    reason: {
      type: String,
      enum: ['age', 'health', 'reproduction', 'temperament', 'injury', 'death', 'other']
    },
    notes: String
  },

  // Notes and Documents
  notes: String,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

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

// Indexes for common queries
cattleSchema.index({ tagNumber: 1 });
cattleSchema.index({ status: 1 });
cattleSchema.index({ type: 1 });
cattleSchema.index({ birthDate: 1 });
cattleSchema.index({ 'dam.tagNumber': 1 });
cattleSchema.index({ 'sire.tagNumber': 1 });

// Virtual for current weight (most recent)
cattleSchema.virtual('currentWeight').get(function() {
  if (this.weightRecords && this.weightRecords.length > 0) {
    const sorted = this.weightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].weight;
  }
  return this.birthWeight || null;
});

// Virtual for age calculation
cattleSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const now = new Date();
  const birth = new Date(this.birthDate);
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) {
    return months + ' months';
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return years + ' yr' + (remainingMonths > 0 ? ' ' + remainingMonths + ' mo' : '');
});

// Static method to get herd summary
cattleSchema.statics.getHerdSummary = async function() {
  const summary = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedValue' }
      }
    }
  ]);

  const birthsThisYear = await this.countDocuments({
    birthDate: {
      $gte: new Date(new Date().getFullYear(), 0, 1)
    },
    status: 'active'
  });

  const totalActive = await this.countDocuments({ status: 'active' });
  const totalValue = summary.reduce((acc, s) => acc + (s.totalValue || 0), 0);

  return {
    totalHead: totalActive,
    birthsYTD: birthsThisYear,
    totalValue: totalValue,
    byType: summary.reduce((acc, s) => {
      acc[s._id] = { count: s.count, value: s.totalValue };
      return acc;
    }, {})
  };
};

// Static method to get cattle needing attention
cattleSchema.statics.getNeedingAttention = async function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Cows due to calve in next 30 days
  const dueToCalf = await this.find({
    status: 'active',
    type: { $in: ['cow', 'bred_heifer'] },
    'pregnancyChecks.expectedCalvingDate': {
      $gte: today,
      $lte: thirtyDaysFromNow
    }
  }).select('tagNumber name pregnancyChecks');

  // Animals in withdrawal period
  const inWithdrawal = await this.find({
    status: 'active',
    'healthRecords.withdrawalDate': { $gte: today }
  }).select('tagNumber name healthRecords');

  return {
    dueToCalf,
    inWithdrawal
  };
};

const Cattle = mongoose.model('Cattle', cattleSchema);

module.exports = Cattle;
