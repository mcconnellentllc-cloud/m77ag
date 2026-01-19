const mongoose = require('mongoose');

const productionProjectionSchema = new mongoose.Schema({
  // Farm and Field links
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  landManagementUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },

  // Projection details
  projectionYear: {
    type: Number,
    required: true
  },
  cropType: {
    type: String,
    required: true,
    enum: ['corn', 'soybeans', 'wheat', 'milo', 'sunflower', 'fallow', 'other']
  },
  variety: String,

  // Acreage
  projectedAcres: {
    type: Number,
    required: true
  },

  // Yield projections
  projectedYieldPerAcre: {
    type: Number,
    required: true
  },
  totalProjectedBushels: {
    type: Number // Calculated field
  },

  // Yield projection basis
  projectionBasis: {
    type: String,
    enum: ['historical_average', 'trend_analysis', 'manual', 'conservative', 'optimistic'],
    default: 'historical_average'
  },
  historicalYields: [{
    year: Number,
    yield: Number
  }],

  // Price projections
  priceProjections: {
    conservative: {
      pricePerBushel: Number,
      totalRevenue: Number
    },
    expected: {
      pricePerBushel: Number,
      totalRevenue: Number
    },
    optimistic: {
      pricePerBushel: Number,
      totalRevenue: Number
    }
  },

  // Market strategy
  marketStrategy: {
    priceTarget: Number,
    stopLoss: Number,
    contractedPercentage: Number,
    contractDetails: [{
      buyer: String,
      bushels: Number,
      pricePerBushel: Number,
      deliveryMonth: String,
      contractNumber: String
    }]
  },

  // Planting and harvest dates
  expectedPlantingDate: Date,
  expectedHarvestDate: Date,

  // Input costs projection
  projectedCosts: {
    seed: Number,
    fertilizer: Number,
    chemicals: Number,
    fuel: Number,
    labor: Number,
    equipment: Number,
    insurance: Number,
    other: Number,
    totalCost: Number,
    costPerAcre: Number,
    costPerBushel: Number
  },

  // Profitability projections
  profitability: {
    conservative: {
      grossRevenue: Number,
      totalCosts: Number,
      netProfit: Number,
      profitPerAcre: Number,
      profitPerBushel: Number,
      roi: Number
    },
    expected: {
      grossRevenue: Number,
      totalCosts: Number,
      netProfit: Number,
      profitPerAcre: Number,
      profitPerBushel: Number,
      roi: Number
    },
    optimistic: {
      grossRevenue: Number,
      totalCosts: Number,
      netProfit: Number,
      profitPerAcre: Number,
      profitPerBushel: Number,
      roi: Number
    }
  },

  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Comparison with actual
  actualData: {
    harvestDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HarvestData'
    },
    actualYield: Number,
    actualRevenue: Number,
    actualCosts: Number,
    actualProfit: Number,
    variance: {
      yieldVariance: Number,
      revenueVariance: Number,
      costVariance: Number,
      profitVariance: Number
    }
  },

  // Notes
  notes: String,
  assumptions: String,

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productionProjectionSchema.index({ farm: 1, projectionYear: -1 });
productionProjectionSchema.index({ field: 1, projectionYear: -1 });
productionProjectionSchema.index({ landManagementUser: 1, projectionYear: -1 });
productionProjectionSchema.index({ projectionYear: -1 });
productionProjectionSchema.index({ status: 1 });

// Pre-save middleware to calculate totals
productionProjectionSchema.pre('save', function(next) {
  // Calculate total projected bushels
  if (this.projectedAcres && this.projectedYieldPerAcre) {
    this.totalProjectedBushels = this.projectedAcres * this.projectedYieldPerAcre;
  }

  // Calculate revenue projections
  if (this.totalProjectedBushels && this.priceProjections) {
    if (this.priceProjections.conservative && this.priceProjections.conservative.pricePerBushel) {
      this.priceProjections.conservative.totalRevenue =
        this.totalProjectedBushels * this.priceProjections.conservative.pricePerBushel;
    }
    if (this.priceProjections.expected && this.priceProjections.expected.pricePerBushel) {
      this.priceProjections.expected.totalRevenue =
        this.totalProjectedBushels * this.priceProjections.expected.pricePerBushel;
    }
    if (this.priceProjections.optimistic && this.priceProjections.optimistic.pricePerBushel) {
      this.priceProjections.optimistic.totalRevenue =
        this.totalProjectedBushels * this.priceProjections.optimistic.pricePerBushel;
    }
  }

  // Calculate projected costs totals
  if (this.projectedCosts) {
    this.projectedCosts.totalCost =
      (this.projectedCosts.seed || 0) +
      (this.projectedCosts.fertilizer || 0) +
      (this.projectedCosts.chemicals || 0) +
      (this.projectedCosts.fuel || 0) +
      (this.projectedCosts.labor || 0) +
      (this.projectedCosts.equipment || 0) +
      (this.projectedCosts.insurance || 0) +
      (this.projectedCosts.other || 0);

    if (this.projectedAcres) {
      this.projectedCosts.costPerAcre = this.projectedCosts.totalCost / this.projectedAcres;
    }
    if (this.totalProjectedBushels) {
      this.projectedCosts.costPerBushel = this.projectedCosts.totalCost / this.totalProjectedBushels;
    }
  }

  // Calculate profitability scenarios
  if (this.priceProjections && this.projectedCosts && this.projectedCosts.totalCost) {
    const scenarios = ['conservative', 'expected', 'optimistic'];

    scenarios.forEach(scenario => {
      if (this.priceProjections[scenario] && this.priceProjections[scenario].totalRevenue) {
        const revenue = this.priceProjections[scenario].totalRevenue;
        const costs = this.projectedCosts.totalCost;

        if (!this.profitability) this.profitability = {};
        if (!this.profitability[scenario]) this.profitability[scenario] = {};

        this.profitability[scenario].grossRevenue = revenue;
        this.profitability[scenario].totalCosts = costs;
        this.profitability[scenario].netProfit = revenue - costs;
        this.profitability[scenario].profitPerAcre =
          (revenue - costs) / this.projectedAcres;
        this.profitability[scenario].profitPerBushel =
          (revenue - costs) / this.totalProjectedBushels;
        this.profitability[scenario].roi =
          ((revenue - costs) / costs) * 100;
      }
    });
  }

  next();
});

// Static method to get farm projections summary
productionProjectionSchema.statics.getFarmProjectionsSummary = async function(farmId, year) {
  const projections = await this.find({
    farm: farmId,
    projectionYear: year,
    status: { $ne: 'cancelled' }
  });

  const summary = {
    totalAcres: 0,
    totalProjectedBushels: 0,
    expectedRevenue: 0,
    expectedCosts: 0,
    expectedProfit: 0,
    byCrop: {},
    projections: projections
  };

  projections.forEach(p => {
    summary.totalAcres += p.projectedAcres || 0;
    summary.totalProjectedBushels += p.totalProjectedBushels || 0;

    if (p.profitability && p.profitability.expected) {
      summary.expectedRevenue += p.profitability.expected.grossRevenue || 0;
      summary.expectedCosts += p.profitability.expected.totalCosts || 0;
      summary.expectedProfit += p.profitability.expected.netProfit || 0;
    }

    if (!summary.byCrop[p.cropType]) {
      summary.byCrop[p.cropType] = {
        acres: 0,
        bushels: 0,
        revenue: 0,
        costs: 0,
        profit: 0
      };
    }

    summary.byCrop[p.cropType].acres += p.projectedAcres || 0;
    summary.byCrop[p.cropType].bushels += p.totalProjectedBushels || 0;
    if (p.profitability && p.profitability.expected) {
      summary.byCrop[p.cropType].revenue += p.profitability.expected.grossRevenue || 0;
      summary.byCrop[p.cropType].costs += p.profitability.expected.totalCosts || 0;
      summary.byCrop[p.cropType].profit += p.profitability.expected.netProfit || 0;
    }
  });

  return summary;
};

// Static method to compare projection vs actual
productionProjectionSchema.statics.compareProjectionVsActual = async function(projectionId) {
  const projection = await this.findById(projectionId);
  if (!projection || !projection.actualData || !projection.actualData.harvestDataId) {
    return null;
  }

  const HarvestData = mongoose.model('HarvestData');
  const actual = await HarvestData.findById(projection.actualData.harvestDataId);

  if (!actual) return null;

  const comparison = {
    projection: {
      yield: projection.projectedYieldPerAcre,
      bushels: projection.totalProjectedBushels,
      revenue: projection.profitability.expected.grossRevenue,
      costs: projection.projectedCosts.totalCost,
      profit: projection.profitability.expected.netProfit
    },
    actual: {
      yield: actual.yieldPerAcre,
      bushels: actual.totalBushels,
      revenue: actual.calculations.grossRevenue,
      costs: actual.calculations.totalExpenses,
      profit: actual.calculations.netProfit
    },
    variance: {
      yieldVariance: actual.yieldPerAcre - projection.projectedYieldPerAcre,
      yieldVariancePercent: ((actual.yieldPerAcre - projection.projectedYieldPerAcre) / projection.projectedYieldPerAcre) * 100,
      bushelsVariance: actual.totalBushels - projection.totalProjectedBushels,
      revenueVariance: actual.calculations.grossRevenue - projection.profitability.expected.grossRevenue,
      costVariance: actual.calculations.totalExpenses - projection.projectedCosts.totalCost,
      profitVariance: actual.calculations.netProfit - projection.profitability.expected.netProfit
    }
  };

  return comparison;
};

// Method to link actual harvest data
productionProjectionSchema.methods.linkActualData = async function(harvestDataId) {
  const HarvestData = mongoose.model('HarvestData');
  const harvest = await HarvestData.findById(harvestDataId);

  if (!harvest) {
    throw new Error('Harvest data not found');
  }

  this.actualData = {
    harvestDataId: harvestDataId,
    actualYield: harvest.yieldPerAcre,
    actualRevenue: harvest.calculations.grossRevenue,
    actualCosts: harvest.calculations.totalExpenses,
    actualProfit: harvest.calculations.netProfit,
    variance: {
      yieldVariance: harvest.yieldPerAcre - this.projectedYieldPerAcre,
      revenueVariance: harvest.calculations.grossRevenue - (this.profitability.expected.grossRevenue || 0),
      costVariance: harvest.calculations.totalExpenses - this.projectedCosts.totalCost,
      profitVariance: harvest.calculations.netProfit - (this.profitability.expected.netProfit || 0)
    }
  };

  this.status = 'completed';
  return this.save();
};

const ProductionProjection = mongoose.model('ProductionProjection', productionProjectionSchema);

module.exports = ProductionProjection;
