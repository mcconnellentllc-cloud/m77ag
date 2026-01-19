const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  // Parties
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalProperty',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  additionalTenants: [{
    name: String,
    relationship: String,
    dateOfBirth: Date
  }],
  // Lease terms
  leaseType: {
    type: String,
    enum: ['month_to_month', 'six_month', 'twelve_month'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date // Null for month-to-month
  },
  // Rent details
  monthlyRent: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    required: true
  },
  securityDepositPaid: {
    type: Boolean,
    default: false
  },
  securityDepositPaidDate: Date,
  petDeposit: Number,
  petDepositPaid: { type: Boolean, default: false },
  rentDueDay: {
    type: Number,
    default: 1 // 1st of month
  },
  lateFeeAmount: {
    type: Number,
    default: 50 // Colorado max is $50 or 5%
  },
  lateFeeGracePeriod: {
    type: Number,
    default: 7 // Colorado requires 7 day grace period
  },
  // Utilities
  utilitiesIncluded: {
    type: Boolean,
    default: false
  },
  utilitiesDetails: String,
  // Colorado Required Disclosures (stored with lease)
  disclosures: {
    radonDisclosureAcknowledged: { type: Boolean, default: false },
    leadPaintDisclosureAcknowledged: { type: Boolean, default: false },
    bedBugDisclosureAcknowledged: { type: Boolean, default: false },
    uninhabitableReportingAcknowledged: { type: Boolean, default: false },
    allDisclosuresSignedDate: Date
  },
  // Move-in/Move-out
  moveInCondition: {
    reportDate: Date,
    notes: String,
    photos: [String],
    tenantSigned: { type: Boolean, default: false },
    landlordSigned: { type: Boolean, default: false }
  },
  moveOutCondition: {
    reportDate: Date,
    notes: String,
    photos: [String],
    deductions: [{
      description: String,
      amount: Number
    }],
    depositRefundAmount: Number,
    depositRefundDate: Date
  },
  // Termination
  terminationNotice: {
    givenBy: { type: String, enum: ['tenant', 'landlord'] },
    noticeDate: Date,
    effectiveDate: Date,
    reason: String
  },
  // Signatures
  signatures: {
    tenantSignature: String,
    tenantSignedDate: Date,
    tenantSignedIP: String,
    landlordSignature: String,
    landlordSignedDate: Date
  },
  // Lease document
  leaseDocumentUrl: String,
  leaseDocumentGeneratedAt: Date,
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed'],
    default: 'draft'
  },
  // Renewal
  renewedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  renewedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  // Terms and conditions
  specialTerms: String,
  petPolicy: String,
  parkingDetails: String,
  notes: String
}, {
  timestamps: true
});

// Calculate end date based on lease type
leaseSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('leaseType')) {
    if (this.leaseType === 'six_month') {
      const endDate = new Date(this.startDate);
      endDate.setMonth(endDate.getMonth() + 6);
      endDate.setDate(endDate.getDate() - 1);
      this.endDate = endDate;
    } else if (this.leaseType === 'twelve_month') {
      const endDate = new Date(this.startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      this.endDate = endDate;
    } else {
      // Month-to-month has no fixed end date
      this.endDate = null;
    }
  }
  next();
});

// Virtual for lease duration in months
leaseSchema.virtual('durationMonths').get(function() {
  if (this.leaseType === 'month_to_month') return null;
  if (this.leaseType === 'six_month') return 6;
  if (this.leaseType === 'twelve_month') return 12;
  return null;
});

// Indexes
leaseSchema.index({ property: 1, status: 1 });
leaseSchema.index({ tenant: 1 });
leaseSchema.index({ startDate: 1, endDate: 1 });
leaseSchema.index({ status: 1 });

const Lease = mongoose.model('Lease', leaseSchema);

module.exports = Lease;
