const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
  // References
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalProperty',
    required: true
  },
  // Payment details
  paymentType: {
    type: String,
    enum: ['rent', 'security_deposit', 'pet_deposit', 'late_fee', 'repair', 'other'],
    default: 'rent'
  },
  amount: {
    type: Number,
    required: true
  },
  // For rent payments
  rentPeriod: {
    month: Number, // 1-12
    year: Number
  },
  dueDate: Date,
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['paypal', 'venmo', 'ach', 'check', 'cash', 'money_order'],
    required: true
  },
  // Transaction info
  transactionId: String,
  paypalOrderId: String,
  venmoTransactionId: String,
  checkNumber: String,
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  // Dates
  paidDate: Date,
  processedDate: Date,
  // Late fee tracking
  isLate: {
    type: Boolean,
    default: false
  },
  daysLate: Number,
  lateFeeApplied: {
    type: Boolean,
    default: false
  },
  lateFeeAmount: Number,
  // Auto-pay
  isAutoPay: {
    type: Boolean,
    default: false
  },
  // Receipt
  receiptSent: {
    type: Boolean,
    default: false
  },
  receiptSentDate: Date,
  receiptUrl: String,
  // Reminder tracking
  remindersSent: [{
    type: { type: String, enum: ['upcoming', 'due', 'overdue'] },
    sentDate: Date,
    method: { type: String, enum: ['email', 'sms'] }
  }],
  // Notes
  notes: String,
  adminNotes: String
}, {
  timestamps: true
});

// Calculate if payment is late
rentPaymentSchema.pre('save', function(next) {
  if (this.dueDate && this.status === 'pending') {
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // Colorado 7-day grace period

    if (today > gracePeriodEnd) {
      this.isLate = true;
      const diffTime = Math.abs(today - gracePeriodEnd);
      this.daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
  next();
});

// Indexes
rentPaymentSchema.index({ lease: 1, 'rentPeriod.year': 1, 'rentPeriod.month': 1 });
rentPaymentSchema.index({ tenant: 1 });
rentPaymentSchema.index({ property: 1 });
rentPaymentSchema.index({ status: 1 });
rentPaymentSchema.index({ dueDate: 1 });
rentPaymentSchema.index({ createdAt: -1 });

const RentPayment = mongoose.model('RentPayment', rentPaymentSchema);

module.exports = RentPayment;
