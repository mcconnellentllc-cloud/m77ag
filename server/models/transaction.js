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
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  // Notes
  notes: String,
  // Created by (which user entered this)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ property: 1, date: -1 });
transactionSchema.index({ field: 1, date: -1 });
transactionSchema.index({ landlord: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ status: 1 });

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

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
