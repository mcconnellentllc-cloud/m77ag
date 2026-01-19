const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  // Parties involved
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Land Management System support
  landManagementUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  // Ledger entry details
  entryType: {
    type: String,
    enum: [
      'lease_payment_due',      // Farmer owes landlord rent
      'lease_payment_made',     // Farmer paid landlord
      'crop_share_due',         // Landlord's share of crop proceeds
      'crop_share_paid',        // Paid landlord their share
      'expense_reimbursement',  // Landlord owes farmer for expenses paid
      'custom_work_due',        // Landlord owes for custom work
      'custom_work_paid',       // Landlord paid for custom work
      'adjustment',             // Manual adjustment
      'other'
    ],
    required: true
  },
  // Financial details
  amount: {
    type: Number,
    required: true
  },
  // Who owes whom
  owedBy: {
    type: String,
    enum: ['farmer', 'landlord'],
    required: true
  },
  owedTo: {
    type: String,
    enum: ['farmer', 'landlord'],
    required: true
  },
  // Description
  description: {
    type: String,
    required: true
  },
  // Date information
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  // Related transaction (if applicable)
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  // Crop year (if applicable)
  cropYear: {
    type: Number
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'due', 'partial_paid', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  // Payment tracking
  paymentDetails: {
    method: {
      type: String,
      enum: ['cash', 'check', 'bank_transfer', 'crop_delivery', 'offset', 'other']
    },
    reference: String, // Check number, transaction ID, etc.
    notes: String
  },
  // For partial payments
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceRemaining: {
    type: Number
  },
  // Settlement information
  settledInFull: {
    type: Boolean,
    default: false
  },
  settlementDate: {
    type: Date
  },
  // Notes and documentation
  notes: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ledgerSchema.index({ landlord: 1, status: 1 });
ledgerSchema.index({ landManagementUser: 1, status: 1 });
ledgerSchema.index({ property: 1, cropYear: -1 });
ledgerSchema.index({ farm: 1, cropYear: -1 });
ledgerSchema.index({ entryDate: -1 });
ledgerSchema.index({ dueDate: 1 });
ledgerSchema.index({ status: 1 });

// Pre-save middleware to calculate balance remaining
ledgerSchema.pre('save', function(next) {
  if (this.isModified('amountPaid') || this.isModified('amount')) {
    this.balanceRemaining = this.amount - this.amountPaid;

    // Update status based on payment
    if (this.amountPaid >= this.amount) {
      this.status = 'paid';
      this.settledInFull = true;
      if (!this.paidDate) {
        this.paidDate = new Date();
      }
      if (!this.settlementDate) {
        this.settlementDate = new Date();
      }
    } else if (this.amountPaid > 0) {
      this.status = 'partial_paid';
    } else if (this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    } else if (this.dueDate) {
      this.status = 'due';
    }
  }
  next();
});

// Static method to get landlord account summary
ledgerSchema.statics.getLandlordAccountSummary = async function(landlordId) {
  const pipeline = [
    { $match: { landlord: mongoose.Types.ObjectId(landlordId) } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$balanceRemaining' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  const summary = {
    totalOutstanding: 0,
    totalOverdue: 0,
    farmerOwesLandlord: 0,
    landlordOwesFarmer: 0,
    entryCount: 0
  };

  // Get all pending/due entries to calculate who owes whom
  const pendingEntries = await this.find({
    landlord: landlordId,
    status: { $in: ['pending', 'due', 'partial_paid', 'overdue'] }
  });

  pendingEntries.forEach(entry => {
    if (entry.owedBy === 'farmer') {
      summary.farmerOwesLandlord += entry.balanceRemaining || entry.amount;
    } else {
      summary.landlordOwesFarmer += entry.balanceRemaining || entry.amount;
    }

    if (entry.status === 'overdue') {
      summary.totalOverdue += entry.balanceRemaining || entry.amount;
    }
  });

  summary.totalOutstanding = summary.farmerOwesLandlord - summary.landlordOwesFarmer;
  summary.entryCount = pendingEntries.length;

  return summary;
};

// Static method to get property ledger summary
ledgerSchema.statics.getPropertyLedgerSummary = async function(propertyId, cropYear = null) {
  const matchStage = { property: mongoose.Types.ObjectId(propertyId) };

  if (cropYear) {
    matchStage.cropYear = cropYear;
  }

  const entries = await this.find(matchStage).sort({ entryDate: -1 });

  const summary = {
    totalDue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    farmerOwes: 0,
    landlordOwes: 0,
    entries: entries
  };

  entries.forEach(entry => {
    if (entry.status !== 'cancelled' && entry.status !== 'paid') {
      const balance = entry.balanceRemaining || entry.amount;
      if (entry.owedBy === 'farmer') {
        summary.farmerOwes += balance;
      } else {
        summary.landlordOwes += balance;
      }
    }
    summary.totalDue += entry.amount;
    summary.totalPaid += entry.amountPaid;
  });

  summary.totalOutstanding = summary.farmerOwes - summary.landlordOwes;

  return summary;
};

// Method to record payment
ledgerSchema.methods.recordPayment = function(paymentAmount, paymentDetails = {}) {
  this.amountPaid += paymentAmount;

  if (paymentDetails.method) {
    this.paymentDetails = {
      ...this.paymentDetails,
      ...paymentDetails
    };
  }

  return this.save();
};

// Method to mark as paid in full
ledgerSchema.methods.markAsPaid = function(paymentDetails = {}) {
  this.amountPaid = this.amount;
  this.balanceRemaining = 0;
  this.status = 'paid';
  this.settledInFull = true;
  this.paidDate = new Date();
  this.settlementDate = new Date();

  if (paymentDetails.method) {
    this.paymentDetails = {
      ...this.paymentDetails,
      ...paymentDetails
    };
  }

  return this.save();
};

const Ledger = mongoose.model('Ledger', ledgerSchema);

module.exports = Ledger;
