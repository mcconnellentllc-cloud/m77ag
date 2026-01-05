const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction type
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  // Category for organization
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'crop_sale', 'custom_work', 'government_payment', 'hunting_lease', 'other_income',
      // Expense categories
      'seed', 'fertilizer', 'chemicals', 'fuel', 'labor', 'repairs', 'equipment_rental',
      'insurance', 'utilities', 'rent_lease_payment', 'property_tax', 'loan_payment',
      'equipment_purchase', 'supplies', 'professional_fees', 'other_expense'
    ]
  },
  // Transaction details
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'other']
  },
  checkNumber: String,
  receiptNumber: String,
  invoiceNumber: String,
  // Link to property/field (if applicable)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  // Land Management System support
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Land Management User support
  landManagementUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  // For expense allocation
  acresApplied: Number, // Number of acres this expense applies to
  costPerAcre: Number,
  // For crop income
  cropDetails: {
    cropType: String,
    bushels: Number,
    pricePerBushel: Number,
    buyer: String,
    deliveryDate: Date,
    gradeFactors: {
      moisture: Number,
      testWeight: Number,
      damage: Number
    }
  },
  // Vendor/Customer information
  vendor: {
    name: String,
    contactInfo: String
  },
  customer: {
    name: String,
    contactInfo: String
  },
  // Tax tracking
  taxDeductible: {
    type: Boolean,
    default: false
  },
  taxCategory: String,
  // Document attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'void'],
    default: 'completed'
  },
  // Bill tracking
  dueDate: Date,
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue'],
    default: 'unpaid'
  },
  // Budget/Projection tracking
  isProjected: {
    type: Boolean,
    default: false
  },
  projectedFor: {
    year: Number,
    month: Number,
    quarter: Number
  },
  // Crop year for multi-year analysis
  cropYear: {
    type: Number
  },
  // Notes
  notes: String,
  // Created by (which user entered this)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByLandManagementUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ property: 1, date: -1 });
transactionSchema.index({ farm: 1, date: -1 });
transactionSchema.index({ field: 1, date: -1 });
transactionSchema.index({ landlord: 1, date: -1 });
transactionSchema.index({ landManagementUser: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ cropYear: -1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ paymentStatus: 1 });
transactionSchema.index({ isProjected: 1, 'projectedFor.year': 1 });

// Virtual for calculating per-unit costs
transactionSchema.virtual('perBushelCost').get(function() {
  if (this.type === 'expense' && this.cropDetails && this.cropDetails.bushels) {
    return this.amount / this.cropDetails.bushels;
  }
  return null;
});

// Static method to get totals by category
transactionSchema.statics.getTotalsByCategory = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.type': 1, '_id.category': 1 } }
  ];

  return this.aggregate(pipeline);
};

// Static method to get property summary
transactionSchema.statics.getPropertySummary = async function(propertyId, year = null) {
  const matchStage = { property: mongoose.Types.ObjectId(propertyId), status: 'completed' };

  if (year) {
    matchStage.date = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0
  };

  results.forEach(item => {
    if (item._id === 'income') {
      summary.totalIncome = item.total;
      summary.transactionCount += item.count;
    } else if (item._id === 'expense') {
      summary.totalExpense = item.total;
      summary.transactionCount += item.count;
    }
  });

  summary.netProfit = summary.totalIncome - summary.totalExpense;

  return summary;
};

// Method to calculate per-acre metrics
transactionSchema.methods.calculatePerAcreMetrics = function(totalAcres) {
  if (!totalAcres || totalAcres === 0) return null;

  return {
    costPerAcre: this.amount / totalAcres,
    acres: totalAcres,
    totalCost: this.amount
  };
};

// Static method for dynamic farm reports with filters
transactionSchema.statics.getFarmReport = async function(filters = {}) {
  const {
    farmId,
    fieldId,
    landManagementUserId,
    cropYear,
    cropType,
    startDate,
    endDate,
    type,
    category,
    includeProjected = false
  } = filters;

  const matchStage = {};

  if (farmId) matchStage.farm = mongoose.Types.ObjectId(farmId);
  if (fieldId) matchStage.field = mongoose.Types.ObjectId(fieldId);
  if (landManagementUserId) matchStage.landManagementUser = mongoose.Types.ObjectId(landManagementUserId);
  if (cropYear) matchStage.cropYear = cropYear;
  if (cropType) matchStage['cropDetails.cropType'] = cropType;
  if (type) matchStage.type = type;
  if (category) matchStage.category = category;
  if (!includeProjected) matchStage.isProjected = { $ne: true };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const transactions = await this.find(matchStage).sort({ date: -1 });

  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    byCategory: {},
    transactions: transactions
  };

  transactions.forEach(t => {
    if (t.type === 'income') {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpense += t.amount;
    }

    if (!summary.byCategory[t.category]) {
      summary.byCategory[t.category] = { total: 0, count: 0 };
    }
    summary.byCategory[t.category].total += t.amount;
    summary.byCategory[t.category].count += 1;
  });

  summary.netProfit = summary.totalIncome - summary.totalExpense;

  return summary;
};

// Static method to get upcoming bills
transactionSchema.statics.getUpcomingBills = async function(farmId, daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const bills = await this.find({
    farm: farmId,
    type: 'expense',
    dueDate: { $gte: today, $lte: futureDate },
    paymentStatus: { $in: ['unpaid', 'partial'] }
  }).sort({ dueDate: 1 });

  const summary = {
    totalDue: 0,
    billCount: bills.length,
    bills: bills,
    byCategory: {}
  };

  bills.forEach(bill => {
    summary.totalDue += bill.amount;
    if (!summary.byCategory[bill.category]) {
      summary.byCategory[bill.category] = { total: 0, count: 0 };
    }
    summary.byCategory[bill.category].total += bill.amount;
    summary.byCategory[bill.category].count += 1;
  });

  return summary;
};

// Static method to get expense projections
transactionSchema.statics.getExpenseProjections = async function(farmId, year) {
  const projections = await this.find({
    farm: farmId,
    isProjected: true,
    'projectedFor.year': year,
    type: 'expense'
  }).sort({ 'projectedFor.month': 1 });

  const summary = {
    totalProjected: 0,
    byMonth: {},
    byCategory: {},
    projections: projections
  };

  projections.forEach(p => {
    summary.totalProjected += p.amount;

    const month = p.projectedFor.month || 0;
    if (!summary.byMonth[month]) {
      summary.byMonth[month] = { total: 0, count: 0 };
    }
    summary.byMonth[month].total += p.amount;
    summary.byMonth[month].count += 1;

    if (!summary.byCategory[p.category]) {
      summary.byCategory[p.category] = { total: 0, count: 0 };
    }
    summary.byCategory[p.category].total += p.amount;
    summary.byCategory[p.category].count += 1;
  });

  return summary;
};

// Static method for multi-year comparison
transactionSchema.statics.getMultiYearComparison = async function(farmId, years) {
  const comparisons = [];

  for (const year of years) {
    const summary = await this.getFarmReport({
      farmId: farmId,
      cropYear: year,
      includeProjected: false
    });

    comparisons.push({
      year: year,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netProfit: summary.netProfit,
      byCategory: summary.byCategory
    });
  }

  return comparisons;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
