const mongoose = require('mongoose');

const harvestDataSchema = new mongoose.Schema({
  // Link to field and property
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  // Land Management System support
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  landManagementUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  // Harvest details
  cropYear: {
    type: Number,
    required: true
  },
  cropType: {
    type: String,
    required: true,
    enum: ['corn', 'soybeans', 'wheat', 'milo', 'sunflower', 'other']
  },
  variety: String,
  // Date information
  harvestStartDate: {
    type: Date,
    required: true
  },
  harvestEndDate: {
    type: Date
  },
  // Yield information
  totalBushels: {
    type: Number,
    required: true
  },
  acresHarvested: {
    type: Number,
    required: true
  },
  yieldPerAcre: {
    type: Number, // Calculated field
    required: true
  },
  // Grain quality metrics
  moisture: {
    type: Number // Percentage
  },
  testWeight: {
    type: Number // lbs per bushel
  },
  foreignMaterial: {
    type: Number // Percentage
  },
  damage: {
    type: Number // Percentage
  },
  splits: {
    type: Number // Percentage (for soybeans)
  },
  protein: {
    type: Number // Percentage
  },
  oil: {
    type: Number // Percentage
  },
  // Equipment information
  equipment: {
    combine: String,
    header: String,
    grainCart: String
  },
  // Storage/delivery information
  storageLocation: {
    type: String,
    enum: ['on_farm', 'elevator', 'sold_direct', 'other']
  },
  deliveryTickets: [{
    ticketNumber: String,
    date: Date,
    bushels: Number,
    destination: String,
    grossWeight: Number,
    tareWeight: Number,
    netWeight: Number,
    moisture: Number,
    testWeight: Number,
    dockage: Number,
    ticketImageUrl: String
  }],
  // Sales information (if sold at harvest)
  soldAtHarvest: {
    type: Boolean,
    default: false
  },
  saleDetails: {
    buyer: String,
    pricePerBushel: Number,
    totalRevenue: Number,
    saleDate: Date,
    contractNumber: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    }
  },
  // Financial calculations
  calculations: {
    grossRevenue: Number,         // Based on sale or estimated price
    estimatedPrice: Number,       // If not sold yet
    totalExpenses: Number,        // Linked from transactions
    netProfit: Number,            // Gross revenue - total expenses
    profitPerAcre: Number,        // Net profit / acres
    profitPerBushel: Number,      // Net profit / bushels
    costPerBushel: Number,        // Total expenses / bushels
    costPerAcre: Number           // Total expenses / acres
  },
  // Bulk import metadata
  importSource: {
    type: String,
    enum: ['manual', 'csv', 'combine_data', 'api', 'other']
  },
  importDate: {
    type: Date,
    default: Date.now
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  originalFileName: String,
  // Notes
  notes: String,
  // Verification status
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedDate: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
harvestDataSchema.index({ field: 1, cropYear: -1 });
harvestDataSchema.index({ property: 1, cropYear: -1 });
harvestDataSchema.index({ farm: 1, cropYear: -1 });
harvestDataSchema.index({ landlord: 1, cropYear: -1 });
harvestDataSchema.index({ landManagementUser: 1, cropYear: -1 });
harvestDataSchema.index({ cropYear: -1 });
harvestDataSchema.index({ harvestStartDate: -1 });

// Pre-save middleware to calculate yield per acre if not provided
harvestDataSchema.pre('save', function(next) {
  // Calculate yield per acre
  if (this.totalBushels && this.acresHarvested && !this.yieldPerAcre) {
    this.yieldPerAcre = this.totalBushels / this.acresHarvested;
  }

  // Calculate financial metrics if we have the data
  if (this.calculations) {
    // Calculate gross revenue
    if (this.soldAtHarvest && this.saleDetails && this.saleDetails.pricePerBushel) {
      this.calculations.grossRevenue = this.totalBushels * this.saleDetails.pricePerBushel;
    } else if (this.calculations.estimatedPrice) {
      this.calculations.grossRevenue = this.totalBushels * this.calculations.estimatedPrice;
    }

    // Calculate profit metrics if we have expenses
    if (this.calculations.grossRevenue && this.calculations.totalExpenses) {
      this.calculations.netProfit = this.calculations.grossRevenue - this.calculations.totalExpenses;
      this.calculations.profitPerAcre = this.calculations.netProfit / this.acresHarvested;
      this.calculations.profitPerBushel = this.calculations.netProfit / this.totalBushels;
    }

    // Calculate cost metrics
    if (this.calculations.totalExpenses) {
      this.calculations.costPerBushel = this.calculations.totalExpenses / this.totalBushels;
      this.calculations.costPerAcre = this.calculations.totalExpenses / this.acresHarvested;
    }
  }

  next();
});

// Static method to calculate field summary for a year
harvestDataSchema.statics.getFieldYearSummary = async function(fieldId, year) {
  const harvests = await this.find({ field: fieldId, cropYear: year });

  if (harvests.length === 0) return null;

  const summary = {
    totalBushels: 0,
    totalAcres: 0,
    averageYield: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    averageMoisture: 0,
    averageTestWeight: 0,
    harvestCount: harvests.length
  };

  let moistureCount = 0;
  let testWeightCount = 0;

  harvests.forEach(h => {
    summary.totalBushels += h.totalBushels;
    summary.totalAcres += h.acresHarvested;
    if (h.calculations) {
      summary.totalRevenue += h.calculations.grossRevenue || 0;
      summary.totalExpenses += h.calculations.totalExpenses || 0;
      summary.netProfit += h.calculations.netProfit || 0;
    }
    if (h.moisture) {
      summary.averageMoisture += h.moisture;
      moistureCount++;
    }
    if (h.testWeight) {
      summary.averageTestWeight += h.testWeight;
      testWeightCount++;
    }
  });

  summary.averageYield = summary.totalBushels / summary.totalAcres;
  if (moistureCount > 0) summary.averageMoisture /= moistureCount;
  if (testWeightCount > 0) summary.averageTestWeight /= testWeightCount;

  return summary;
};

// Static method to get property harvest summary
harvestDataSchema.statics.getPropertyYearSummary = async function(propertyId, year) {
  const pipeline = [
    {
      $match: {
        property: mongoose.Types.ObjectId(propertyId),
        cropYear: year
      }
    },
    {
      $group: {
        _id: '$cropType',
        totalBushels: { $sum: '$totalBushels' },
        totalAcres: { $sum: '$acresHarvested' },
        averageYield: { $avg: '$yieldPerAcre' },
        totalRevenue: { $sum: '$calculations.grossRevenue' },
        totalExpenses: { $sum: '$calculations.totalExpenses' },
        fieldCount: { $sum: 1 }
      }
    },
    {
      $addFields: {
        netProfit: { $subtract: ['$totalRevenue', '$totalExpenses'] },
        profitPerAcre: {
          $divide: [
            { $subtract: ['$totalRevenue', '$totalExpenses'] },
            '$totalAcres'
          ]
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Method to add delivery ticket
harvestDataSchema.methods.addDeliveryTicket = function(ticketData) {
  this.deliveryTickets.push(ticketData);
  return this.save();
};

// Method to mark as verified
harvestDataSchema.methods.markAsVerified = function(userId) {
  this.verified = true;
  this.verifiedBy = userId;
  this.verifiedDate = new Date();
  return this.save();
};

const HarvestData = mongoose.model('HarvestData', harvestDataSchema);

module.exports = HarvestData;
