const mongoose = require('mongoose');

/**
 * Grazing Schedule Model
 * Track pasture rotations, stocking rates, and forage management
 * Important for ELAP, LFP, and other USDA programs
 */

const grazingScheduleSchema = new mongoose.Schema({
  // Pasture Information
  pastureName: {
    type: String,
    required: true,
    trim: true
  },
  pastureId: String,  // Internal reference
  farm: {
    type: String,
    required: true
  },

  // Location
  location: {
    county: String,
    state: String,
    legalDescription: String,  // Section/Township/Range
    gpsCoordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Pasture Details
  totalAcres: {
    type: Number,
    required: true
  },
  grazableAcres: Number,
  waterSources: [{
    type: {
      type: String,
      enum: ['pond', 'creek', 'well', 'tank', 'spring', 'municipal']
    },
    name: String,
    reliable: Boolean,
    notes: String
  }],
  fenceType: {
    type: String,
    enum: ['barbed_wire', 'electric', 'woven_wire', 'high_tensile', 'combination', 'none']
  },
  fenceCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },

  // Forage Information
  forageTypes: [{
    type: {
      type: String,
      enum: ['bermuda', 'fescue', 'native_grass', 'bahia', 'rye', 'wheat', 'oats', 'clover', 'alfalfa', 'mixed', 'other']
    },
    percentage: Number
  }],
  primaryForage: {
    type: String,
    enum: ['bermuda', 'fescue', 'native_grass', 'bahia', 'rye', 'wheat', 'oats', 'clover', 'alfalfa', 'mixed', 'other']
  },

  // Carrying Capacity
  carryingCapacity: {
    headPerAcre: Number,
    aum: Number,  // Animal Unit Months
    notes: String
  },

  // Current Status
  currentStatus: {
    type: String,
    enum: ['active_grazing', 'resting', 'haying', 'stockpiling', 'renovation', 'out_of_service'],
    default: 'resting'
  },
  currentHeadCount: {
    type: Number,
    default: 0
  },
  cattleAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cattle'
  }],

  // Grazing Events (rotation history)
  grazingEvents: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    headCount: {
      type: Number,
      required: true
    },
    cattleType: {
      type: String,
      enum: ['cow_calf', 'stockers', 'bulls', 'heifers', 'mixed']
    },
    totalAUM: Number,  // Animal Unit Months used
    forageConditionAtStart: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    forageConditionAtEnd: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    forageHeightStart: Number,  // inches
    forageHeightEnd: Number,    // inches
    supplementalFeed: {
      provided: Boolean,
      type: String,
      poundsPerHead: Number,
      totalCost: Number
    },
    waterHauled: {
      required: Boolean,
      gallons: Number,
      cost: Number
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Rest Periods
  restPeriods: [{
    startDate: Date,
    endDate: Date,
    reason: {
      type: String,
      enum: ['rotation', 'recovery', 'drought', 'flooding', 'haying', 'renovation', 'winter']
    },
    notes: String
  }],

  // Forage Assessments
  forageAssessments: [{
    date: {
      type: Date,
      default: Date.now
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical']
    },
    height: Number,  // Average height in inches
    coverage: Number,  // Percentage ground cover
    droughtCondition: {
      type: String,
      enum: ['none', 'd0_abnormally_dry', 'd1_moderate', 'd2_severe', 'd3_extreme', 'd4_exceptional']
    },
    estimatedDaysGrazing: Number,
    photos: [String],
    notes: String,
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Maintenance History
  maintenance: [{
    date: Date,
    type: {
      type: String,
      enum: ['fertilizer', 'herbicide', 'mowing', 'overseeding', 'fence_repair', 'water_system', 'brush_control', 'other']
    },
    description: String,
    product: String,
    applicationRate: String,
    cost: Number,
    contractor: String,
    notes: String
  }],

  // Rainfall Tracking (important for drought documentation)
  rainfallRecords: [{
    date: Date,
    amount: Number,  // inches
    notes: String
  }],

  // Monthly rainfall totals
  monthlyRainfall: [{
    year: Number,
    month: Number,
    total: Number,
    normalRainfall: Number,  // Historical average
    percentOfNormal: Number
  }],

  // USDA Program Documentation
  usdaPrograms: {
    // LFP - Livestock Forage Disaster Program
    lfpEligible: Boolean,
    lfpCountyFSAOffice: String,
    lfpNormalCarryingCapacity: Number,

    // ELAP - Emergency Livestock Assistance
    elapDocumented: Boolean,

    // CRP if applicable
    crpAcres: Number,
    crpContractNumber: String,
    crpExpirationDate: Date
  },

  // Annual Summary (cached/calculated)
  annualSummary: [{
    year: Number,
    totalGrazingDays: Number,
    totalAUM: Number,
    averageHeadCount: Number,
    totalRainfall: Number,
    percentOfNormalRainfall: Number,
    forageProduction: String,  // Good, Average, Poor
    notes: String
  }],

  // Notes
  notes: String,

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

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
grazingScheduleSchema.index({ pastureName: 1 });
grazingScheduleSchema.index({ farm: 1 });
grazingScheduleSchema.index({ currentStatus: 1 });
grazingScheduleSchema.index({ 'grazingEvents.startDate': 1 });

// Virtual for days since last grazing
grazingScheduleSchema.virtual('daysSinceGrazing').get(function() {
  if (!this.grazingEvents || this.grazingEvents.length === 0) return null;

  const lastEvent = this.grazingEvents
    .filter(e => e.endDate)
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];

  if (!lastEvent) return null;

  const days = Math.floor((new Date() - new Date(lastEvent.endDate)) / (1000 * 60 * 60 * 24));
  return days;
});

// Virtual for current stocking rate
grazingScheduleSchema.virtual('currentStockingRate').get(function() {
  if (!this.currentHeadCount || !this.grazableAcres) return 0;
  return (this.currentHeadCount / this.grazableAcres).toFixed(2);
});

// Static method to get all pastures needing attention
grazingScheduleSchema.statics.getPasturesNeedingAttention = async function() {
  const pastures = await this.find({ isActive: true });

  const needingAttention = [];

  pastures.forEach(pasture => {
    // Check for overstocking
    if (pasture.carryingCapacity?.headPerAcre && pasture.grazableAcres) {
      const maxHead = pasture.carryingCapacity.headPerAcre * pasture.grazableAcres;
      if (pasture.currentHeadCount > maxHead) {
        needingAttention.push({
          pasture: pasture.pastureName,
          issue: 'overstocked',
          details: `${pasture.currentHeadCount} head on ${pasture.grazableAcres} acres (max: ${Math.floor(maxHead)})`
        });
      }
    }

    // Check for poor forage condition
    const lastAssessment = pasture.forageAssessments
      ?.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (lastAssessment && ['poor', 'critical'].includes(lastAssessment.condition)) {
      needingAttention.push({
        pasture: pasture.pastureName,
        issue: 'forage_condition',
        details: `Forage rated as ${lastAssessment.condition} on ${new Date(lastAssessment.date).toLocaleDateString()}`
      });
    }

    // Check for drought conditions
    if (lastAssessment && lastAssessment.droughtCondition &&
        lastAssessment.droughtCondition !== 'none') {
      needingAttention.push({
        pasture: pasture.pastureName,
        issue: 'drought',
        details: lastAssessment.droughtCondition.replace(/_/g, ' ')
      });
    }
  });

  return needingAttention;
};

// Static method to calculate AUM for a date range
grazingScheduleSchema.statics.calculateAUM = async function(startDate, endDate) {
  const pastures = await this.find({
    'grazingEvents.startDate': { $lte: endDate },
    $or: [
      { 'grazingEvents.endDate': { $gte: startDate } },
      { 'grazingEvents.endDate': null }
    ]
  });

  let totalAUM = 0;

  pastures.forEach(pasture => {
    pasture.grazingEvents.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : new Date();

      // Calculate overlap with requested date range
      const overlapStart = Math.max(eventStart, new Date(startDate));
      const overlapEnd = Math.min(eventEnd, new Date(endDate));

      if (overlapStart < overlapEnd) {
        const days = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24);
        const months = days / 30;
        const aum = event.headCount * months;  // Simplified - assumes 1 AU per head
        totalAUM += aum;
      }
    });
  });

  return totalAUM;
};

const GrazingSchedule = mongoose.model('GrazingSchedule', grazingScheduleSchema);

module.exports = GrazingSchedule;
