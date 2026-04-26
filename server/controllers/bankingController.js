const BankAccount = require('../models/bankAccount');
const Loan = require('../models/loan');
const Invoice = require('../models/invoice');
const Transaction = require('../models/transaction');

// ===========================
// BANK ACCOUNTS
// ===========================

// Create bank account
exports.createAccount = async (req, res) => {
  try {
    const accountData = {
      ...req.body,
      createdBy: req.userId
    };

    const account = await BankAccount.create(accountData);

    res.status(201).json({
      success: true,
      data: account,
      message: `Account "${account.accountName}" created successfully`
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank account',
      error: error.message
    });
  }
};

// Get all accounts
exports.getAccounts = async (req, res) => {
  try {
    const { status = 'active', type, farm } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.accountType = type;
    if (farm) filter.farm = farm;

    const accounts = await BankAccount.find(filter).sort({ isPrimary: -1, accountName: 1 });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve accounts',
      error: error.message
    });
  }
};

// Get accounts summary
exports.getAccountsSummary = async (req, res) => {
  try {
    const { farm } = req.query;
    const summary = await BankAccount.getAccountsSummary(farm);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Accounts summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts summary',
      error: error.message
    });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const account = await BankAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error.message
    });
  }
};

// Record bank transaction
exports.recordBankTransaction = async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    await account.recordTransaction(req.body);

    res.json({
      success: true,
      data: account,
      message: 'Transaction recorded successfully'
    });
  } catch (error) {
    console.error('Record bank transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record transaction',
      error: error.message
    });
  }
};

// Get cash flow summary
exports.getCashFlowSummary = async (req, res) => {
  try {
    const { startDate, endDate, farm } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const cashFlow = await BankAccount.getCashFlowSummary(startDate, endDate, farm);

    res.json({
      success: true,
      data: cashFlow
    });
  } catch (error) {
    console.error('Cash flow summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cash flow summary',
      error: error.message
    });
  }
};

// ===========================
// LOANS
// ===========================

// Create loan
exports.createLoan = async (req, res) => {
  try {
    const loanData = {
      ...req.body,
      createdBy: req.userId
    };

    const loan = await Loan.create(loanData);

    res.status(201).json({
      success: true,
      data: loan,
      message: `Loan "${loan.name}" created successfully`
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loan',
      error: error.message
    });
  }
};

// Get all loans
exports.getLoans = async (req, res) => {
  try {
    const { status = 'active', type, lender, farm } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (lender) filter['lender.name'] = new RegExp(lender, 'i');
    if (farm) filter.farm = farm;

    const loans = await Loan.find(filter).sort({ currentBalance: -1 });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve loans',
      error: error.message
    });
  }
};

// Get single loan
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve loan',
      error: error.message
    });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({
      success: true,
      data: loan,
      message: 'Loan updated successfully'
    });
  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loan',
      error: error.message
    });
  }
};

// Record loan payment
exports.recordLoanPayment = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const paymentData = req.body;
    await loan.recordPayment(paymentData);

    // Create expense transaction for loan payment
    await Transaction.create({
      type: 'expense',
      category: 'loan_payment',
      description: `Loan payment - ${loan.name} (${loan.lender.name})`,
      amount: paymentData.amount,
      date: paymentData.date || new Date(),
      paymentMethod: paymentData.method === 'ach' ? 'bank_transfer' : 'other',
      farm: loan.farm,
      status: 'completed',
      taxDeductible: loan.taxDeductibleInterest,
      notes: `Principal: $${paymentData.principal || 0}, Interest: $${paymentData.interest || 0}`,
      createdBy: req.userId
    });

    res.json({
      success: true,
      data: loan,
      message: `Payment of $${paymentData.amount.toLocaleString()} recorded. New balance: $${loan.currentBalance.toLocaleString()}`
    });
  } catch (error) {
    console.error('Record loan payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record loan payment',
      error: error.message
    });
  }
};

// Get amortization schedule
exports.getAmortizationSchedule = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const schedule = loan.getAmortizationSchedule();

    res.json({
      success: true,
      data: {
        loan: {
          name: loan.name,
          lender: loan.lender.name,
          originalAmount: loan.originalAmount,
          currentBalance: loan.currentBalance,
          interestRate: loan.interestRate,
          termMonths: loan.termMonths,
          paymentAmount: loan.paymentAmount
        },
        schedule,
        summary: {
          totalPayments: schedule.length,
          totalInterest: schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0,
          totalPrincipal: schedule.length > 0 ? schedule[schedule.length - 1].totalPrincipal : 0,
          totalCost: loan.originalAmount + (schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0)
        }
      }
    });
  } catch (error) {
    console.error('Amortization schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate amortization schedule',
      error: error.message
    });
  }
};

// Get loan portfolio summary
exports.getLoanPortfolio = async (req, res) => {
  try {
    const { farm, type } = req.query;
    const filters = {};
    if (farm) filters.farm = farm;
    if (type) filters.type = type;

    const portfolio = await Loan.getPortfolioSummary(filters);

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Loan portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loan portfolio',
      error: error.message
    });
  }
};

// ===========================
// BANKING DASHBOARD
// ===========================

// Get comprehensive banking dashboard
exports.getBankingDashboard = async (req, res) => {
  try {
    const { farm } = req.query;

    const [accountsSummary, loanPortfolio, invoiceStats, recentTransactions] = await Promise.all([
      BankAccount.getAccountsSummary(farm),
      Loan.getPortfolioSummary(farm ? { farm } : {}),
      Invoice.aggregate([
        { $match: { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } } },
        {
          $group: {
            _id: null,
            totalReceivable: { $sum: '$balanceDue' },
            invoiceCount: { $sum: 1 },
            overdueAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$balanceDue', 0] }
            },
            overdueCount: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
            }
          }
        }
      ]),
      Transaction.find({})
        .sort({ date: -1 })
        .limit(20)
        .select('type category description amount date paymentMethod status')
    ]);

    const dashboard = {
      // Cash position
      cashPosition: {
        totalCash: accountsSummary.totalBalance,
        totalAvailable: accountsSummary.totalAvailable,
        accounts: accountsSummary.accounts
      },

      // Debt overview
      debtOverview: {
        totalDebt: loanPortfolio.totalDebt,
        monthlyPayments: loanPortfolio.totalMonthlyPayments,
        annualPayments: loanPortfolio.totalAnnualPayments,
        weightedAvgRate: loanPortfolio.weightedAvgRate,
        loanCount: loanPortfolio.totalLoans,
        byType: loanPortfolio.byType,
        upcomingPayments: loanPortfolio.upcomingPayments.slice(0, 5)
      },

      // Accounts receivable
      accountsReceivable: {
        totalReceivable: invoiceStats[0]?.totalReceivable || 0,
        invoiceCount: invoiceStats[0]?.invoiceCount || 0,
        overdueAmount: invoiceStats[0]?.overdueAmount || 0,
        overdueCount: invoiceStats[0]?.overdueCount || 0
      },

      // Net position
      netPosition: {
        totalAssets: accountsSummary.totalBalance + (invoiceStats[0]?.totalReceivable || 0),
        totalLiabilities: loanPortfolio.totalDebt,
        netWorth: (accountsSummary.totalBalance + (invoiceStats[0]?.totalReceivable || 0)) - loanPortfolio.totalDebt,
        debtToAssetRatio: loanPortfolio.totalDebt > 0
          ? ((loanPortfolio.totalDebt / (accountsSummary.totalBalance + (invoiceStats[0]?.totalReceivable || 0) + loanPortfolio.totalCollateralValue)) * 100).toFixed(1)
          : 0
      },

      // Recent activity
      recentTransactions
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Banking dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load banking dashboard',
      error: error.message
    });
  }
};

module.exports = exports;
