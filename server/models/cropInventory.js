const mongoose = require('mongoose');

const cropInventorySchema = new mongoose.Schema({
  // Farm Association
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },

  // Inventory Identification
  year: {
    type: Number,
    required: true
  },
  cropType: {
    type: String,
    enum: ['corn', 'wheat', 'milo', 'soybeans', 'sunflower', 'other'],
    required: true
  },

  // Storage Location
  storageLocation: {
    type: String,
    enum: ['on-farm-bin', 'on-farm-pile', 'commercial-elevator', 'coop', 'other'],
    required: true
  },
  binNumber: String,
  elevatorName: String,
  elevatorLocation: String,
  elevatorAccountNumber: String,

  // Quantity Tracking
  initialQuantity: {
    type: Number,
    default: 0 // Starting bushels at harvest
  },
  currentQuantity: {
    type: Number,
    default: 0 // Current bushels in storage
  },
  reservedQuantity: {
    type: Number,
    default: 0 // Bushels committed to contracts
  },
  availableQuantity: {
    type: Number,
    default: 0 // currentQuantity - reservedQuantity
  },

  // Quality Metrics
  quality: {
    moisture: Number,
    testWeight: Number,
    damageFactor: Number,
    splits: Number,
    foreignMaterial: Number,
    protein: Number, // For wheat
    oilContent: Number // For soybeans/sunflower
  },

  // Cost Basis
  costBasis: {
    productionCostPerBushel: Number,
    storageCostPerBushel: Number,
    dryingCostPerBushel: Number,
    handlingCostPerBushel: Number,
    totalCostPerBushel: Number
  },

  // Sliding Scale / Price Targets
  slidingScale: {
    enabled: {
      type: Boolean,
      default: false
    },
    minimumPrice: Number, // Won't sell below this
    targetPrice: Number, // Ideal sale price
    maximumHold: Date, // Latest date to hold inventory

    // Tiered sale targets
    tiers: [{
      pricePerBushel: Number,
      percentToSell: Number, // Percentage of inventory to sell at this price
      bushelsToSell: Number, // Calculated from percentage
      triggerType: {
        type: String,
        enum: ['price-reaches', 'price-falls-to', 'date-reaches']
      },
      triggerDate: Date,
      executed: {
        type: Boolean,
        default: false
      },
      executedDate: Date,
      executedPrice: Number,
      executedBushels: Number,
      notes: String
    }],

    // Auto-sell rules
    autoSellEnabled: {
      type: Boolean,
      default: false
    },
    autoSellRules: [{
      condition: {
        type: String,
        enum: [
          'price-above-target',
          'price-above-breakeven',
          'basis-narrows',
          'date-trigger',
          'storage-expiring'
        ]
      },
      threshold: Number, // Price threshold or days before expiry
      percentToSell: Number,
      priority: Number,
      active: {
        type: Boolean,
        default: true
      }
    }]
  },

  // Contracts
  contracts: [{
    contractNumber: String,
    contractType: {
      type: String,
      enum: ['cash', 'forward', 'hedge-to-arrive', 'basis', 'minimum-price', 'accumulator']
    },
    buyerName: String,
    contractDate: Date,
    deliveryStartDate: Date,
    deliveryEndDate: Date,
    contractedBushels: Number,
    contractedPrice: Number,
    basisLevel: Number,
    futuresMonth: String,
    status: {
      type: String,
      enum: ['open', 'partially-filled', 'filled', 'cancelled', 'expired'],
      default: 'open'
    },
    deliveredBushels: Number,
    remainingBushels: Number,
    notes: String
  }],

  // Sales History
  sales: [{
    saleDate: Date,
    buyer: String,
    bushels: Number,
    pricePerBushel: Number,
    grossRevenue: Number,
    basis: Number,
    futuresPrice: Number,
    cashPrice: Number,
    deductions: {
      moisture: Number,
      damage: Number,
      other: Number,
      totalDeductions: Number
    },
    netRevenue: Number,
    ticketNumber: String,
    loadNumber: String,
    truckInfo: String,
    paymentReceived: {
      type: Boolean,
      default: false
    },
    paymentDate: Date,
    notes: String
  }],

  // Additions (purchases, transfers in)
  additions: [{
    date: Date,
    source: String,
    bushels: Number,
    costPerBushel: Number,
    reason: {
      type: String,
      enum: ['purchase', 'transfer', 'correction', 'other']
    },
    notes: String
  }],

  // Shrinkage/Loss Tracking
  shrinkage: [{
    date: Date,
    bushelsLost: Number,
    reason: {
      type: String,
      enum: ['moisture-loss', 'handling-loss', 'pest-damage', 'spoilage', 'theft', 'correction', 'other']
    },
    notes: String
  }],

  // Storage Costs
  storageFees: [{
    periodStart: Date,
    periodEnd: Date,
    ratePerBushel: Number,
    totalFee: Number,
    paid: {
      type: Boolean,
      default: false
    },
    invoiceNumber: String
  }],

  // Market Data (for reference/tracking)
  marketPrices: [{
    date: Date,
    cashPrice: Number,
    futuresPrice: Number,
    basis: Number,
    source: String
  }],

  // Projected Revenue Scenarios
  projectedRevenue: {
    atCurrentPrice: Number,
    atTargetPrice: Number,
    atBreakeven: Number,
    lastCalculated: Date
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'depleted', 'transferred', 'written-off'],
    default: 'active'
  },

  // Source Fields
  sourceFields: [{
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    fieldName: String,
    acres: Number,
    bushelsFromField: Number
  }],

  // Notes
  notes: String,

  // Audit
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
cropInventorySchema.index({ farm: 1 });
cropInventorySchema.index({ year: 1 });
cropInventorySchema.index({ cropType: 1 });
cropInventorySchema.index({ status: 1 });
cropInventorySchema.index({ farm: 1, year: 1, cropType: 1 });
cropInventorySchema.index({ 'slidingScale.enabled': 1 });

// Virtual for calculating available quantity
cropInventorySchema.virtual('calculatedAvailable').get(function() {
  return this.currentQuantity - this.reservedQuantity;
});

// Virtual for total sold
cropInventorySchema.virtual('totalSold').get(function() {
  return this.sales.reduce((sum, sale) => sum + (sale.bushels || 0), 0);
});

// Virtual for total revenue
cropInventorySchema.virtual('totalRevenue').get(function() {
  return this.sales.reduce((sum, sale) => sum + (sale.netRevenue || sale.grossRevenue || 0), 0);
});

// Virtual for average sale price
cropInventorySchema.virtual('averageSalePrice').get(function() {
  const totalBushels = this.totalSold;
  if (totalBushels === 0) return 0;
  return this.totalRevenue / totalBushels;
});

// Pre-save hook to update available quantity
cropInventorySchema.pre('save', function(next) {
  this.availableQuantity = this.currentQuantity - this.reservedQuantity;
  next();
});

// Method to record a sale
cropInventorySchema.methods.recordSale = function(saleData) {
  if (saleData.bushels > this.availableQuantity) {
    throw new Error('Insufficient available inventory for sale');
  }

  this.sales.push({
    saleDate: saleData.saleDate || new Date(),
    ...saleData
  });

  this.currentQuantity -= saleData.bushels;
  this.availableQuantity = this.currentQuantity - this.reservedQuantity;

  if (this.currentQuantity <= 0) {
    this.status = 'depleted';
  }

  return this.save();
};

// Method to record shrinkage
cropInventorySchema.methods.recordShrinkage = function(shrinkageData) {
  this.shrinkage.push({
    date: new Date(),
    ...shrinkageData
  });

  this.currentQuantity -= shrinkageData.bushelsLost;
  this.availableQuantity = this.currentQuantity - this.reservedQuantity;

  return this.save();
};

// Method to add contract
cropInventorySchema.methods.addContract = function(contractData) {
  if (contractData.contractedBushels > this.availableQuantity) {
    throw new Error('Insufficient available inventory for contract');
  }

  this.contracts.push({
    contractDate: new Date(),
    remainingBushels: contractData.contractedBushels,
    ...contractData
  });

  this.reservedQuantity += contractData.contractedBushels;
  this.availableQuantity = this.currentQuantity - this.reservedQuantity;

  return this.save();
};

// Method to execute sliding scale tier
cropInventorySchema.methods.executeSlidingScaleTier = function(tierIndex, executionData) {
  const tier = this.slidingScale.tiers[tierIndex];
  if (!tier) {
    throw new Error('Invalid tier index');
  }

  tier.executed = true;
  tier.executedDate = new Date();
  tier.executedPrice = executionData.price;
  tier.executedBushels = executionData.bushels || tier.bushelsToSell;

  // Record the sale
  this.sales.push({
    saleDate: new Date(),
    bushels: tier.executedBushels,
    pricePerBushel: tier.executedPrice,
    grossRevenue: tier.executedBushels * tier.executedPrice,
    notes: `Sliding scale tier execution at $${tier.executedPrice}/bu`
  });

  this.currentQuantity -= tier.executedBushels;

  return this.save();
};

// Method to update projected revenue
cropInventorySchema.methods.updateProjectedRevenue = function(currentPrice) {
  this.projectedRevenue = {
    atCurrentPrice: this.currentQuantity * currentPrice,
    atTargetPrice: this.slidingScale.enabled
      ? this.currentQuantity * this.slidingScale.targetPrice
      : this.currentQuantity * currentPrice,
    atBreakeven: this.currentQuantity * (this.costBasis.totalCostPerBushel || 0),
    lastCalculated: new Date()
  };

  return this.save();
};

// Static method to get inventory summary by farm
cropInventorySchema.statics.getInventorySummary = async function(farmId, year) {
  const inventories = await this.find({
    farm: farmId,
    year: year,
    status: 'active'
  }).lean();

  let summary = {
    totalBushels: 0,
    totalValue: 0,
    byCrop: {},
    byLocation: {},
    slidingScaleActive: 0,
    pendingContracts: 0
  };

  inventories.forEach(inv => {
    summary.totalBushels += inv.currentQuantity || 0;
    summary.totalValue += (inv.currentQuantity || 0) * (inv.costBasis?.totalCostPerBushel || 0);

    // By crop
    if (!summary.byCrop[inv.cropType]) {
      summary.byCrop[inv.cropType] = {
        bushels: 0,
        locations: [],
        avgCostPerBushel: 0
      };
    }
    summary.byCrop[inv.cropType].bushels += inv.currentQuantity || 0;

    // By location
    const locKey = inv.storageLocation;
    if (!summary.byLocation[locKey]) {
      summary.byLocation[locKey] = { bushels: 0, crops: [] };
    }
    summary.byLocation[locKey].bushels += inv.currentQuantity || 0;

    // Count active sliding scales
    if (inv.slidingScale?.enabled) {
      summary.slidingScaleActive++;
    }

    // Count pending contracts
    inv.contracts?.forEach(c => {
      if (c.status === 'open' || c.status === 'partially-filled') {
        summary.pendingContracts++;
      }
    });
  });

  return summary;
};

// Static method to check sliding scale triggers
cropInventorySchema.statics.checkSlidingScaleTriggers = async function(farmId, cropType, currentPrice) {
  const inventories = await this.find({
    farm: farmId,
    cropType: cropType,
    status: 'active',
    'slidingScale.enabled': true
  });

  const triggers = [];

  inventories.forEach(inv => {
    inv.slidingScale.tiers.forEach((tier, index) => {
      if (!tier.executed) {
        let shouldTrigger = false;

        if (tier.triggerType === 'price-reaches' && currentPrice >= tier.pricePerBushel) {
          shouldTrigger = true;
        } else if (tier.triggerType === 'price-falls-to' && currentPrice <= tier.pricePerBushel) {
          shouldTrigger = true;
        } else if (tier.triggerType === 'date-reaches' && tier.triggerDate <= new Date()) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          triggers.push({
            inventoryId: inv._id,
            tierIndex: index,
            tier: tier,
            currentPrice: currentPrice,
            action: `Sell ${tier.bushelsToSell || tier.percentToSell + '%'} at $${tier.pricePerBushel}/bu`
          });
        }
      }
    });
  });

  return triggers;
};

// Static method to get projections across all inventory
cropInventorySchema.statics.getRevenueProjections = async function(farmId, year, priceScenarios) {
  const inventories = await this.find({
    farm: farmId,
    year: year,
    status: 'active'
  }).lean();

  const projections = {};

  priceScenarios.forEach(scenario => {
    projections[scenario.name] = {
      prices: scenario.prices,
      totalRevenue: 0,
      byCrop: {}
    };

    inventories.forEach(inv => {
      const price = scenario.prices[inv.cropType] || 0;
      const revenue = (inv.currentQuantity || 0) * price;

      projections[scenario.name].totalRevenue += revenue;

      if (!projections[scenario.name].byCrop[inv.cropType]) {
        projections[scenario.name].byCrop[inv.cropType] = {
          bushels: 0,
          revenue: 0
        };
      }
      projections[scenario.name].byCrop[inv.cropType].bushels += inv.currentQuantity || 0;
      projections[scenario.name].byCrop[inv.cropType].revenue += revenue;
    });
  });

  return projections;
};

const CropInventory = mongoose.model('CropInventory', cropInventorySchema);

module.exports = CropInventory;
