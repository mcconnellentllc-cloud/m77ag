const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  // Loan identification
  loanNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Loan type
  type: {
    type: String,
    enum: ['equipment', 'land', 'operating', 'building', 'vehicle', 'livestock', 'improvement', 'line_of_credit', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paid_off', 'defaulted', 'refinanced', 'pending_approval'],
    default: 'active'
  },

  // Lender information
  lender: {
    name: { type: String, required: true },
    contactName: String,
    phone: String,
    email: String,
    address: String,
    accountNumber: String
  },

  // Loan terms
  originalAmount: { type: Number, required: true },
  currentBalance: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual percentage
  interestType: {
    type: String,
    enum: ['fixed', 'variable', 'adjustable'],
    default: 'fixed'
  },
  termMonths: { type: Number, required: true },
  startDate: { type: Date, required: true },
  maturityDate: { type: Date, required: true },
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
    default: 'monthly'
  },
  paymentAmount: { type: Number, required: true },
  // For variable rate loans
  rateAdjustmentDate: Date,
  rateIndex: String, // e.g., 'Prime', 'SOFR'
  rateMargin: Number,

  // Collateral
  collateral: {
    description: String,
    type: {
      type: String,
      enum: ['equipment', 'land', 'building', 'livestock', 'crops', 'accounts_receivable', 'blanket', 'other']
    },
    estimatedValue: Number,
    // Reference to related asset
    capitalInvestment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CapitalInvestment'
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmEquipment'
    }
  },

  // Payment history
  payments: [{
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    principal: Number,
    interest: Number,
    escrow: Number,
    lateFee: Number,
    method: {
      type: String,
      enum: ['ach', 'check', 'wire', 'auto_debit', 'other']
    },
    referenceNumber: String,
    confirmationNumber: String,
    balanceAfter: Number,
    notes: String
  }],

  // Payment schedule (upcoming)
  nextPaymentDate: Date,
  nextPaymentAmount: Number,

  // Escrow (for land loans)
  escrow: {
    enabled: { type: Boolean, default: false },
    monthlyAmount: Number,
    balance: Number,
    propertyTax: Number,
    insurance: Number
  },

  // Financial tracking
  totalPrincipalPaid: { type: Number, default: 0 },
  totalInterestPaid: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  ytdInterestPaid: { type: Number, default: 0 },
  ytdPrincipalPaid: { type: Number, default: 0 },

  // Insurance requirements
  insuranceRequired: { type: Boolean, default: false },
  insuranceProvider: String,
  insurancePolicyNumber: String,
  insuranceExpiration: Date,

  // Related entities
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['promissory_note', 'security_agreement', 'amortization', 'insurance', 'appraisal', 'statement', 'other']
    },
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],

  // Notes
  notes: String,

  // Tax tracking
  taxDeductibleInterest: { type: Boolean, default: true },
  taxCategory: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
loanSchema.index({ type: 1, status: 1 });
loanSchema.index({ 'lender.name': 1 });
loanSchema.index({ maturityDate: 1 });
loanSchema.index({ nextPaymentDate: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ farm: 1 });

// Virtual: remaining term in months
loanSchema.virtual('remainingMonths').get(function() {
  if (!this.maturityDate) return 0;
  const now = new Date();
  const months = (this.maturityDate.getFullYear() - now.getFullYear()) * 12 +
    (this.maturityDate.getMonth() - now.getMonth());
  return Math.max(0, months);
});

// Virtual: loan-to-value ratio
loanSchema.virtual('ltv').get(function() {
  if (!this.collateral?.estimatedValue || this.collateral.estimatedValue === 0) return null;
  return (this.currentBalance / this.collateral.estimatedValue * 100).toFixed(2);
});

// Virtual: equity in collateral
loanSchema.virtual('equity').get(function() {
  if (!this.collateral?.estimatedValue) return null;
  return this.collateral.estimatedValue - this.currentBalance;
});

// Record a payment
loanSchema.methods.recordPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.currentBalance = paymentData.balanceAfter || (this.currentBalance - (paymentData.principal || 0));
  this.totalPrincipalPaid += paymentData.principal || 0;
  this.totalInterestPaid += paymentData.interest || 0;
  this.totalPaid += paymentData.amount;
  this.ytdPrincipalPaid += paymentData.principal || 0;
  this.ytdInterestPaid += paymentData.interest || 0;

  if (this.currentBalance <= 0) {
    this.status = 'paid_off';
    this.currentBalance = 0;
  }

  return this.save();
};

// Get amortization schedule
loanSchema.methods.getAmortizationSchedule = function() {
  const schedule = [];
  let balance = this.originalAmount;
  const monthlyRate = this.interestRate / 100 / 12;
  const payment = this.paymentAmount;
  let paymentDate = new Date(this.startDate);

  const frequencyMonths = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12
  };
  const interval = frequencyMonths[this.paymentFrequency] || 1;

  let totalInterest = 0;
  let totalPrincipal = 0;

  while (balance > 0 && schedule.length < this.termMonths / interval + 1) {
    const periodRate = monthlyRate * interval;
    const interest = balance * periodRate;
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    totalPrincipal += principal;

    paymentDate = new Date(paymentDate);
    paymentDate.setMonth(paymentDate.getMonth() + interval);

    schedule.push({
      paymentNumber: schedule.length + 1,
      date: new Date(paymentDate),
      payment: principal + interest > payment ? principal + interest : payment,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100
    });
  }

  return schedule;
};

// Get portfolio summary
loanSchema.statics.getPortfolioSummary = async function(filters = {}) {
  const matchStage = { status: 'active' };
  if (filters.farm) matchStage.farm = new mongoose.Types.ObjectId(filters.farm);
  if (filters.type) matchStage.type = filters.type;

  const loans = await this.find(matchStage).sort({ currentBalance: -1 });

  const summary = {
    totalLoans: loans.length,
    totalDebt: 0,
    totalMonthlyPayments: 0,
    totalAnnualPayments: 0,
    totalCollateralValue: 0,
    weightedAvgRate: 0,
    ytdInterestPaid: 0,
    ytdPrincipalPaid: 0,
    byType: {},
    byLender: {},
    upcomingPayments: [],
    loans: loans
  };

  let weightedRateSum = 0;

  loans.forEach(loan => {
    summary.totalDebt += loan.currentBalance;

    const freqMultiplier = { monthly: 12, quarterly: 4, semi_annual: 2, annual: 1 };
    const annualPayments = loan.paymentAmount * (freqMultiplier[loan.paymentFrequency] || 12);
    const monthlyEquivalent = annualPayments / 12;

    summary.totalMonthlyPayments += monthlyEquivalent;
    summary.totalAnnualPayments += annualPayments;
    summary.totalCollateralValue += loan.collateral?.estimatedValue || 0;
    summary.ytdInterestPaid += loan.ytdInterestPaid || 0;
    summary.ytdPrincipalPaid += loan.ytdPrincipalPaid || 0;

    weightedRateSum += loan.interestRate * loan.currentBalance;

    // By type
    if (!summary.byType[loan.type]) {
      summary.byType[loan.type] = { count: 0, balance: 0, monthlyPayment: 0 };
    }
    summary.byType[loan.type].count++;
    summary.byType[loan.type].balance += loan.currentBalance;
    summary.byType[loan.type].monthlyPayment += monthlyEquivalent;

    // By lender
    const lenderName = loan.lender.name;
    if (!summary.byLender[lenderName]) {
      summary.byLender[lenderName] = { count: 0, balance: 0, monthlyPayment: 0 };
    }
    summary.byLender[lenderName].count++;
    summary.byLender[lenderName].balance += loan.currentBalance;
    summary.byLender[lenderName].monthlyPayment += monthlyEquivalent;

    // Upcoming payments
    if (loan.nextPaymentDate) {
      summary.upcomingPayments.push({
        loanId: loan._id,
        name: loan.name,
        lender: loan.lender.name,
        amount: loan.nextPaymentAmount || loan.paymentAmount,
        date: loan.nextPaymentDate,
        type: loan.type
      });
    }
  });

  if (summary.totalDebt > 0) {
    summary.weightedAvgRate = Math.round(weightedRateSum / summary.totalDebt * 100) / 100;
  }

  summary.overallLTV = summary.totalCollateralValue > 0
    ? Math.round(summary.totalDebt / summary.totalCollateralValue * 10000) / 100
    : null;

  summary.upcomingPayments.sort((a, b) => new Date(a.date) - new Date(b.date));

  return summary;
};

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
