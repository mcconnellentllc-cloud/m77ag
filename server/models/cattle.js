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

  // M77 Custom Fields
  owner: {
    type: String,
    default: 'M77',
    trim: true
  },
  tagColor: {
    type: String,
    enum: ['Yellow', 'Blue', 'Green', 'White', 'Purple', 'Orange', 'Red', 'Pink', 'Black', 'Other'],
    trim: true
  },
  calvingGroup: {
    type: String,
    enum: ['SPRING', 'FALL', 'YEAR_ROUND'],
    default: 'SPRING'
  },

  // Annual Calving Records (tracks production by year)
  annualCalvingRecords: [{
    year: {
      type: Number,
      required: true
    },
    hadCalf: {
      type: Boolean,
      default: false
    },
    calfSurvived: {
      type: Boolean,
      default: false
    },
    calfTag: String,
    calfSex: {
      type: String,
      enum: ['bull', 'heifer']
    },
    weaningWeight: Number,  // Calf's weaning weight
    weaningDate: Date,
    sireTag: String,  // Sire of this specific calf
    sireId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle'
    },
    notes: String
  }],

  // Genetic Testing & DNA
  genetics: {
    tested: {
      type: Boolean,
      default: false
    },
    testDate: Date,
    lab: {
      type: String,
      enum: ['Neogen', 'Zoetis', 'GeneSeek', 'UC_Davis', 'Texas_AM', 'Other'],
      trim: true
    },
    sampleType: {
      type: String,
      enum: ['hair', 'blood', 'tissue', 'semen']
    },
    sampleId: String,  // Lab sample/case number
    dnaProfileNumber: String,  // Registration DNA profile number

    // Parentage Verification
    parentageVerified: {
      type: Boolean,
      default: false
    },
    sireVerified: {
      type: Boolean,
      default: false
    },
    sireConfidence: Number,  // Percentage match
    damVerified: {
      type: Boolean,
      default: false
    },
    damConfidence: Number,

    // Genomic Data (EPDs from DNA)
    genomicEPDs: {
      ced: Number,    // Calving Ease Direct
      bw: Number,     // Birth Weight
      ww: Number,     // Weaning Weight
      yw: Number,     // Yearling Weight
      milk: Number,   // Milk
      mww: Number,    // Maternal Weaning Weight
      marb: Number,   // Marbling
      re: Number,     // Ribeye Area
      fat: Number,    // Back Fat
      $w: Number,     // Weaned Calf Value
      $b: Number,     // Beef Value
      $c: Number      // Combined Value
    },
    genomicAccuracy: Number,  // Overall accuracy percentage

    // Genetic Conditions/Markers
    conditions: [{
      name: String,  // e.g., 'AM', 'NH', 'CA', 'DD', 'PHA', 'TH', 'OS'
      result: {
        type: String,
        enum: ['free', 'carrier', 'affected', 'not_tested']
      }
    }],

    // Coat Color Genetics
    colorGenetics: {
      redBlackCarrier: Boolean,  // Carries red gene
      dilutionCarrier: Boolean,  // Carries dilution
      notes: String
    },

    // Test Results Document
    resultsDocument: String,  // URL to uploaded results PDF
    notes: String
  },

  // Offspring Tracking (for production analysis)
  offspringIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cattle'
  }],

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
    enum: ['cow', 'bull', 'heifer', 'steer', 'calf', 'bred_heifer', 'fat'],
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

// Virtual for production stats (cows only)
cattleSchema.virtual('productionStats').get(function() {
  if (!this.annualCalvingRecords || this.annualCalvingRecords.length === 0) {
    return {
      totalCalves: 0,
      calvesWeaned: 0,
      weaningRate: 0,
      avgWeaningWeight: 0,
      yearsProducing: 0
    };
  }

  const records = this.annualCalvingRecords;
  const totalCalves = records.filter(r => r.hadCalf).length;
  const calvesWeaned = records.filter(r => r.calfSurvived).length;
  const weightsRecorded = records.filter(r => r.weaningWeight > 0);
  const avgWeaningWeight = weightsRecorded.length > 0
    ? Math.round(weightsRecorded.reduce((sum, r) => sum + r.weaningWeight, 0) / weightsRecorded.length)
    : 0;

  const years = [...new Set(records.map(r => r.year))];

  return {
    totalCalves,
    calvesWeaned,
    weaningRate: totalCalves > 0 ? Math.round((calvesWeaned / totalCalves) * 100) : 0,
    avgWeaningWeight,
    yearsProducing: years.length,
    years: years.sort((a, b) => b - a)  // Most recent first
  };
});

// Virtual for genetic status summary
cattleSchema.virtual('geneticStatus').get(function() {
  if (!this.genetics) {
    return { tested: false, verified: false };
  }

  return {
    tested: this.genetics.tested || false,
    parentageVerified: this.genetics.parentageVerified || false,
    sireVerified: this.genetics.sireVerified || false,
    damVerified: this.genetics.damVerified || false,
    lab: this.genetics.lab,
    testDate: this.genetics.testDate,
    hasGenomicEPDs: !!(this.genetics.genomicEPDs && Object.keys(this.genetics.genomicEPDs).length > 0)
  };
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

// Static method to get all offspring of a cow or bull
cattleSchema.statics.getOffspring = async function(cattleId) {
  const parent = await this.findById(cattleId);
  if (!parent) return [];

  // Find by dam or sire reference
  const offspring = await this.find({
    $or: [
      { 'dam.cattleId': cattleId },
      { 'sire.cattleId': cattleId },
      { 'dam.tagNumber': parent.tagNumber },
      { 'sire.tagNumber': parent.tagNumber }
    ]
  }).select('tagNumber name type birthDate birthWeight status saleInfo genetics.parentageVerified')
    .sort({ birthDate: -1 });

  return offspring;
};

// Static method to get production report for a cow
cattleSchema.statics.getProductionReport = async function(cattleId) {
  const cow = await this.findById(cattleId);
  if (!cow) return null;

  // Get all offspring
  const offspring = await this.getOffspring(cattleId);

  // Calculate production metrics
  const records = cow.annualCalvingRecords || [];
  const totalCalves = records.filter(r => r.hadCalf).length;
  const calvesWeaned = records.filter(r => r.calfSurvived).length;
  const weightsRecorded = records.filter(r => r.weaningWeight > 0);

  // Get offspring weaning weights from actual records
  const offspringWithWeights = offspring.filter(o => {
    const lastWeight = o.weightRecords?.find(w => w.notes?.toLowerCase().includes('wean'));
    return lastWeight || o.birthWeight;
  });

  // Calculate averages
  const avgWeaningWeight = weightsRecorded.length > 0
    ? Math.round(weightsRecorded.reduce((sum, r) => sum + r.weaningWeight, 0) / weightsRecorded.length)
    : 0;

  // Calculate age at first calf
  let ageAtFirstCalf = null;
  if (cow.birthDate && records.length > 0) {
    const firstCalfYear = Math.min(...records.map(r => r.year));
    const birthYear = new Date(cow.birthDate).getFullYear();
    ageAtFirstCalf = firstCalfYear - birthYear;
  }

  // Count by sex
  const bullCalves = records.filter(r => r.calfSex === 'bull').length;
  const heiferCalves = records.filter(r => r.calfSex === 'heifer').length;

  return {
    cow: {
      tagNumber: cow.tagNumber,
      name: cow.name,
      birthDate: cow.birthDate,
      owner: cow.owner,
      status: cow.status
    },
    production: {
      totalCalves,
      calvesWeaned,
      weaningRate: totalCalves > 0 ? Math.round((calvesWeaned / totalCalves) * 100) : 0,
      avgWeaningWeight,
      bullCalves,
      heiferCalves,
      ageAtFirstCalf,
      yearsProducing: [...new Set(records.map(r => r.year))].length
    },
    annualRecords: records.sort((a, b) => b.year - a.year),
    offspring: offspring,
    genetics: cow.genetics
  };
};

// Static method to get bull progeny report
cattleSchema.statics.getBullProgenyReport = async function(bullId) {
  const bull = await this.findById(bullId);
  if (!bull) return null;

  // Get all offspring sired by this bull
  const progeny = await this.find({
    $or: [
      { 'sire.cattleId': bullId },
      { 'sire.tagNumber': bull.tagNumber }
    ]
  }).select('tagNumber name type birthDate birthWeight status weightRecords genetics dam')
    .sort({ birthDate: -1 });

  // Calculate progeny statistics
  const birthWeights = progeny.filter(p => p.birthWeight).map(p => p.birthWeight);
  const avgBirthWeight = birthWeights.length > 0
    ? Math.round(birthWeights.reduce((a, b) => a + b, 0) / birthWeights.length)
    : 0;

  // Get weaning weights from offspring
  const weaningWeights = [];
  progeny.forEach(p => {
    const weanRecord = p.weightRecords?.find(w =>
      w.notes?.toLowerCase().includes('wean') ||
      (w.date && p.birthDate && Math.abs(new Date(w.date) - new Date(p.birthDate)) / (1000 * 60 * 60 * 24) < 250)
    );
    if (weanRecord) weaningWeights.push(weanRecord.weight);
  });
  const avgWeaningWeight = weaningWeights.length > 0
    ? Math.round(weaningWeights.reduce((a, b) => a + b, 0) / weaningWeights.length)
    : 0;

  // Count by sex
  const bulls = progeny.filter(p => ['bull', 'calf'].includes(p.type) && p.name?.toLowerCase().includes('bull')).length;
  const heifers = progeny.filter(p => p.type === 'heifer').length;

  // Unique dams bred
  const uniqueDams = [...new Set(progeny.map(p => p.dam?.tagNumber).filter(Boolean))];

  return {
    bull: {
      tagNumber: bull.tagNumber,
      name: bull.name,
      breed: bull.breed,
      status: bull.status
    },
    progeny: {
      total: progeny.length,
      bulls,
      heifers,
      avgBirthWeight,
      avgWeaningWeight,
      uniqueDamsBred: uniqueDams.length
    },
    offspring: progeny,
    genetics: bull.genetics
  };
};

// Static method to get genetics summary for herd
cattleSchema.statics.getGeneticsSummary = async function() {
  const tested = await this.countDocuments({ 'genetics.tested': true, status: 'active' });
  const parentageVerified = await this.countDocuments({ 'genetics.parentageVerified': true, status: 'active' });
  const totalActive = await this.countDocuments({ status: 'active' });

  // Get by lab
  const byLab = await this.aggregate([
    { $match: { 'genetics.tested': true, status: 'active' } },
    { $group: { _id: '$genetics.lab', count: { $sum: 1 } } }
  ]);

  return {
    totalActive,
    tested,
    testedPercent: totalActive > 0 ? Math.round((tested / totalActive) * 100) : 0,
    parentageVerified,
    parentagePercent: totalActive > 0 ? Math.round((parentageVerified / totalActive) * 100) : 0,
    byLab: byLab.reduce((acc, l) => { acc[l._id || 'Unknown'] = l.count; return acc; }, {})
  };
};

const Cattle = mongoose.model('Cattle', cattleSchema);

module.exports = Cattle;
