const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Type of invoice
  type: {
    type: String,
    enum: ['customer_invoice', 'vendor_bill', 'landlord_statement', 'custom_work', 'hunting_lease', 'rental', 'equipment_sale'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },

  // Parties
  from: {
    name: { type: String, default: 'M77 AG' },
    address: String,
    phone: String,
    email: String,
    taxId: String
  },
  to: {
    name: { type: String, required: true },
    address: String,
    phone: String,
    email: String,
    company: String
  },

  // Customer/Vendor reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },

  // Line items
  items: [{
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'custom_farming', 'planting', 'harvesting', 'spraying', 'trucking',
        'hunting_lease', 'season_pass', 'equipment_rental', 'equipment_sale',
        'rent', 'security_deposit', 'late_fee',
        'seed', 'fertilizer', 'chemicals', 'fuel', 'labor', 'repairs',
        'consulting', 'land_management', 'other'
      ]
    },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'each' }, // each, acre, bushel, hour, day, month
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxable: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    // For farming-specific items
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    acres: Number,
    cropYear: Number
  }],

  // Financial summary
  subtotal: { type: Number, required: true },
  taxTotal: { type: Number, default: 0 },
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: { type: Number, default: 0 },
    description: String
  },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Payment tracking
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  payments: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['cash', 'check', 'ach', 'wire', 'credit_card', 'paypal', 'venmo', 'grain_settlement', 'crop_share', 'other']
    },
    referenceNumber: String,
    checkNumber: String,
    transactionId: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Dates
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paidDate: Date,

  // Terms
  terms: {
    type: String,
    enum: ['due_on_receipt', 'net_10', 'net_15', 'net_30', 'net_60', 'net_90', 'custom'],
    default: 'net_30'
  },
  customTerms: String,

  // Late fee configuration
  lateFee: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    gracePeriodDays: { type: Number, default: 7 },
    applied: { type: Boolean, default: false },
    amount: { type: Number, default: 0 }
  },

  // Related records
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  cropYear: Number,

  // Notes and documents
  notes: String,
  internalNotes: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now }
  }],

  // Email tracking
  emailSent: { type: Boolean, default: false },
  emailSentDate: Date,
  emailViewedDate: Date,
  remindersSent: { type: Number, default: 0 },
  lastReminderDate: Date,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ customer: 1, status: 1 });
invoiceSchema.index({ landlord: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ type: 1, status: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ cropYear: -1 });

// Pre-save: calculate balanceDue and status
invoiceSchema.pre('save', function(next) {
  // Calculate balance
  this.balanceDue = this.total - this.amountPaid;

  // Auto-update status based on payment
  if (this.status !== 'cancelled' && this.status !== 'refunded' && this.status !== 'draft') {
    if (this.balanceDue <= 0) {
      this.status = 'paid';
      if (!this.paidDate) this.paidDate = new Date();
    } else if (this.amountPaid > 0) {
      this.status = 'partial';
    } else if (this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    }
  }

  next();
});

// Generate next invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(prefix = 'INV') {
  const year = new Date().getFullYear();
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^${prefix}-${year}-`)
  }).sort({ invoiceNumber: -1 });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    nextNum = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
};

// Record a payment
invoiceSchema.methods.recordPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  return this.save();
};

// Get aging report
invoiceSchema.statics.getAgingReport = async function(filters = {}) {
  const now = new Date();
  const matchStage = { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } };

  if (filters.customer) matchStage.customer = new mongoose.Types.ObjectId(filters.customer);
  if (filters.type) matchStage.type = filters.type;

  const invoices = await this.find(matchStage).sort({ dueDate: 1 });

  const aging = {
    current: { count: 0, total: 0, invoices: [] },
    days1to30: { count: 0, total: 0, invoices: [] },
    days31to60: { count: 0, total: 0, invoices: [] },
    days61to90: { count: 0, total: 0, invoices: [] },
    over90: { count: 0, total: 0, invoices: [] },
    totalOutstanding: 0
  };

  invoices.forEach(inv => {
    const balance = inv.balanceDue;
    const daysPastDue = Math.floor((now - inv.dueDate) / (1000 * 60 * 60 * 24));

    aging.totalOutstanding += balance;

    let bucket;
    if (daysPastDue <= 0) bucket = 'current';
    else if (daysPastDue <= 30) bucket = 'days1to30';
    else if (daysPastDue <= 60) bucket = 'days31to60';
    else if (daysPastDue <= 90) bucket = 'days61to90';
    else bucket = 'over90';

    aging[bucket].count++;
    aging[bucket].total += balance;
    aging[bucket].invoices.push({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      to: inv.to.name,
      total: inv.total,
      balanceDue: balance,
      dueDate: inv.dueDate,
      daysPastDue: Math.max(0, daysPastDue)
    });
  });

  return aging;
};

// Get revenue summary
invoiceSchema.statics.getRevenueSummary = async function(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const pipeline = [
    {
      $match: {
        status: { $in: ['paid', 'partial'] },
        issueDate: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$issueDate' },
        invoiced: { $sum: '$total' },
        collected: { $sum: '$amountPaid' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ];

  const monthly = await this.aggregate(pipeline);

  const byType = await this.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'partial'] },
        issueDate: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$total' },
        collected: { $sum: '$amountPaid' },
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    year,
    monthly,
    byType,
    totalInvoiced: monthly.reduce((sum, m) => sum + m.invoiced, 0),
    totalCollected: monthly.reduce((sum, m) => sum + m.collected, 0)
  };
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
