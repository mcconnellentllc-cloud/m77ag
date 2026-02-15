const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  // Account identification
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'money_market', 'cd', 'operating', 'reserve', 'escrow', 'investment'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  },

  // Bank information
  bank: {
    name: { type: String, required: true },
    routingNumber: String,
    branch: String,
    contactName: String,
    phone: String,
    address: String
  },

  // Account numbers (last 4 only for security)
  accountNumberLast4: String,
  isPrimary: { type: Boolean, default: false },

  // Balance tracking
  currentBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  lastReconciled: Date,
  reconciledBalance: Number,

  // Purpose/designation
  purpose: {
    type: String,
    enum: ['general_operating', 'payroll', 'tax_reserve', 'equipment_reserve', 'crop_proceeds', 'landlord_payments', 'hunting_revenue', 'rental_income', 'savings', 'other'],
    default: 'general_operating'
  },

  // Monthly tracking
  monthlyActivity: [{
    month: Number, // 1-12
    year: Number,
    openingBalance: Number,
    deposits: Number,
    withdrawals: Number,
    closingBalance: Number,
    interestEarned: Number,
    fees: Number
  }],

  // Recent transactions (for reconciliation)
  recentTransactions: [{
    date: { type: Date, required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'check', 'ach', 'wire'] },
    description: String,
    amount: Number,
    runningBalance: Number,
    referenceNumber: String,
    reconciled: { type: Boolean, default: false },
    category: String,
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    relatedLoan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    }
  }],

  // ACH configuration
  achEnabled: { type: Boolean, default: false },
  achVerified: { type: Boolean, default: false },

  // Linked entities
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },

  // Alerts
  lowBalanceAlert: {
    enabled: { type: Boolean, default: false },
    threshold: Number
  },

  // Notes
  notes: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
bankAccountSchema.index({ status: 1 });
bankAccountSchema.index({ accountType: 1 });
bankAccountSchema.index({ isPrimary: 1 });
bankAccountSchema.index({ farm: 1 });
bankAccountSchema.index({ purpose: 1 });

// Get accounts summary
bankAccountSchema.statics.getAccountsSummary = async function(farmId) {
  const matchStage = { status: 'active' };
  if (farmId) matchStage.farm = new mongoose.Types.ObjectId(farmId);

  const accounts = await this.find(matchStage).sort({ isPrimary: -1, accountName: 1 });

  const summary = {
    totalAccounts: accounts.length,
    totalBalance: 0,
    totalAvailable: 0,
    byType: {},
    byPurpose: {},
    accounts: accounts.map(a => ({
      _id: a._id,
      name: a.accountName,
      type: a.accountType,
      bank: a.bank.name,
      last4: a.accountNumberLast4,
      balance: a.currentBalance,
      available: a.availableBalance,
      isPrimary: a.isPrimary,
      purpose: a.purpose
    }))
  };

  accounts.forEach(account => {
    summary.totalBalance += account.currentBalance;
    summary.totalAvailable += account.availableBalance;

    if (!summary.byType[account.accountType]) {
      summary.byType[account.accountType] = { count: 0, balance: 0 };
    }
    summary.byType[account.accountType].count++;
    summary.byType[account.accountType].balance += account.currentBalance;

    if (!summary.byPurpose[account.purpose]) {
      summary.byPurpose[account.purpose] = { count: 0, balance: 0 };
    }
    summary.byPurpose[account.purpose].count++;
    summary.byPurpose[account.purpose].balance += account.currentBalance;
  });

  return summary;
};

// Record a transaction
bankAccountSchema.methods.recordTransaction = function(txnData) {
  const amount = txnData.type === 'deposit' || txnData.type === 'interest'
    ? Math.abs(txnData.amount)
    : -Math.abs(txnData.amount);

  this.currentBalance += amount;
  this.availableBalance += amount;

  this.recentTransactions.push({
    ...txnData,
    runningBalance: this.currentBalance
  });

  // Keep only last 100 transactions
  if (this.recentTransactions.length > 100) {
    this.recentTransactions = this.recentTransactions.slice(-100);
  }

  return this.save();
};

// Get cash flow summary for a period
bankAccountSchema.statics.getCashFlowSummary = async function(startDate, endDate, farmId) {
  const matchStage = { status: 'active' };
  if (farmId) matchStage.farm = new mongoose.Types.ObjectId(farmId);

  const accounts = await this.find(matchStage);

  const cashFlow = {
    period: { start: startDate, end: endDate },
    totalDeposits: 0,
    totalWithdrawals: 0,
    netCashFlow: 0,
    byAccount: []
  };

  accounts.forEach(account => {
    const periodTxns = account.recentTransactions.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
    });

    let deposits = 0;
    let withdrawals = 0;

    periodTxns.forEach(t => {
      if (['deposit', 'interest'].includes(t.type)) {
        deposits += Math.abs(t.amount);
      } else if (['withdrawal', 'fee', 'check', 'ach', 'wire'].includes(t.type)) {
        withdrawals += Math.abs(t.amount);
      }
    });

    cashFlow.totalDeposits += deposits;
    cashFlow.totalWithdrawals += withdrawals;

    cashFlow.byAccount.push({
      accountId: account._id,
      name: account.accountName,
      deposits,
      withdrawals,
      net: deposits - withdrawals,
      currentBalance: account.currentBalance
    });
  });

  cashFlow.netCashFlow = cashFlow.totalDeposits - cashFlow.totalWithdrawals;

  return cashFlow;
};

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;
