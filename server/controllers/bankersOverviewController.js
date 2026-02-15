const Transaction = require('../models/transaction');
const CapitalInvestment = require('../models/capitalInvestment');
const FarmEquipment = require('../models/farmEquipment');
const Invoice = require('../models/invoice');
const Loan = require('../models/loan');
const BankAccount = require('../models/bankAccount');
const ProductionProjection = require('../models/productionProjection');
const Cattle = require('../models/cattle');
const Farm = require('../models/farm');
const Field = require('../models/field');

// Banker's Overview - All real data, no assumptions
exports.getBankersOverview = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    // Run all queries in parallel for speed
    const [
      bankAccounts,
      activeLoans,
      capitalAssets,
      equipment,
      outstandingInvoices,
      ytdTransactions,
      productionProjections,
      cattle,
      farms,
      fields,
      monthlyTransactions,
      paidInvoicesYTD
    ] = await Promise.all([
      BankAccount.find({ status: 'active' }),
      Loan.find({ status: 'active' }),
      CapitalInvestment.find({ status: 'owned' }),
      FarmEquipment.find({ status: 'active' }),
      Invoice.find({ status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } }),
      Transaction.find({ date: { $gte: yearStart, $lt: yearEnd }, status: 'completed', isProjected: { $ne: true } }),
      ProductionProjection.find({ projectionYear: currentYear, status: { $ne: 'cancelled' } }),
      Cattle.find({ status: { $ne: 'sold' } }),
      Farm.find({}),
      Field.find({ active: true }),
      // Monthly cash flow - group transactions by month
      Transaction.aggregate([
        {
          $match: {
            date: { $gte: yearStart, $lt: yearEnd },
            status: 'completed',
            isProjected: { $ne: true }
          }
        },
        {
          $group: {
            _id: { month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1 } }
      ]),
      Invoice.find({ status: 'paid', paidDate: { $gte: yearStart, $lt: yearEnd } })
    ]);

    // ===== BALANCE SHEET =====

    // ASSETS
    const cashTotal = bankAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const arTotal = outstandingInvoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

    const landAssets = capitalAssets.filter(a => a.type === 'land');
    const buildingAssets = capitalAssets.filter(a => a.type === 'building');
    const infraAssets = capitalAssets.filter(a => a.type === 'infrastructure' || a.type === 'improvement');

    const landValue = landAssets.reduce((sum, a) => sum + (a.currentValue?.estimatedValue || 0), 0);
    const buildingValue = buildingAssets.reduce((sum, a) => sum + (a.currentValue?.estimatedValue || 0), 0);
    const infraValue = infraAssets.reduce((sum, a) => sum + (a.currentValue?.estimatedValue || 0), 0);
    const equipmentValue = equipment.reduce((sum, e) => sum + (e.valuation?.currentValue || 0), 0);

    // Cattle value - use market value if available
    const cattleValue = cattle.reduce((sum, c) => sum + (c.valuation?.currentMarketValue || c.valuation?.estimatedValue || 0), 0);

    const totalCurrentAssets = cashTotal + arTotal;
    const totalFixedAssets = landValue + buildingValue + infraValue + equipmentValue + cattleValue;
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // LIABILITIES
    const totalLoanDebt = activeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);

    // Separate current (due within 12 months) vs long-term
    const now = new Date();
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

    let currentLiabilities = 0;
    let longTermLiabilities = 0;

    activeLoans.forEach(loan => {
      if (loan.maturityDate && new Date(loan.maturityDate) <= oneYearOut) {
        currentLiabilities += loan.currentBalance || 0;
      } else {
        // Estimate current portion as 12 months of principal
        const annualPrincipal = loan.ytdPrincipalPaid || 0;
        currentLiabilities += annualPrincipal;
        longTermLiabilities += (loan.currentBalance || 0) - annualPrincipal;
      }
    });

    const totalLiabilities = totalLoanDebt;
    const netWorth = totalAssets - totalLiabilities;

    // ===== KEY RATIOS =====

    // YTD Income & Expenses
    let ytdIncome = 0;
    let ytdExpenses = 0;
    const incomeByCategory = {};
    const expenseByCategory = {};

    ytdTransactions.forEach(t => {
      if (t.type === 'income') {
        ytdIncome += t.amount;
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else if (t.type === 'expense') {
        ytdExpenses += t.amount;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    const netOperatingIncome = ytdIncome - ytdExpenses;

    // Annual debt service (total loan payments per year)
    const annualDebtService = activeLoans.reduce((sum, loan) => {
      const freqMultiplier = { monthly: 12, quarterly: 4, semi_annual: 2, annual: 1 };
      return sum + (loan.paymentAmount * (freqMultiplier[loan.paymentFrequency] || 12));
    }, 0);

    const monthlyDebtService = annualDebtService / 12;

    // Ratios
    const dscr = annualDebtService > 0 ? netOperatingIncome / annualDebtService : null;
    const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
    const currentRatio = currentLiabilities > 0 ? totalCurrentAssets / currentLiabilities : null;
    const workingCapital = totalCurrentAssets - currentLiabilities;
    const equityToAsset = totalAssets > 0 ? (netWorth / totalAssets * 100) : 0;

    // ===== DEBT SCHEDULE =====
    const debtSchedule = activeLoans.map(loan => ({
      _id: loan._id,
      name: loan.name,
      loanNumber: loan.loanNumber,
      type: loan.type,
      lender: loan.lender.name,
      lenderContact: loan.lender.contactName,
      lenderPhone: loan.lender.phone,
      originalAmount: loan.originalAmount,
      currentBalance: loan.currentBalance,
      interestRate: loan.interestRate,
      interestType: loan.interestType,
      paymentAmount: loan.paymentAmount,
      paymentFrequency: loan.paymentFrequency,
      startDate: loan.startDate,
      maturityDate: loan.maturityDate,
      nextPaymentDate: loan.nextPaymentDate,
      termMonths: loan.termMonths,
      collateral: loan.collateral ? {
        description: loan.collateral.description,
        type: loan.collateral.type,
        estimatedValue: loan.collateral.estimatedValue
      } : null,
      totalPrincipalPaid: loan.totalPrincipalPaid,
      totalInterestPaid: loan.totalInterestPaid,
      ytdPrincipalPaid: loan.ytdPrincipalPaid,
      ytdInterestPaid: loan.ytdInterestPaid
    }));

    // ===== ASSET SCHEDULE =====
    const assetSchedule = {
      cash: bankAccounts.map(a => ({
        name: a.accountName,
        type: a.accountType,
        bank: a.bank.name,
        last4: a.accountNumberLast4,
        balance: a.currentBalance,
        available: a.availableBalance,
        purpose: a.purpose,
        isPrimary: a.isPrimary
      })),
      accountsReceivable: outstandingInvoices.map(i => ({
        invoiceNumber: i.invoiceNumber,
        customer: i.to?.name,
        type: i.type,
        total: i.total,
        balanceDue: i.balanceDue,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        status: i.status
      })),
      land: landAssets.map(a => ({
        name: a.name,
        category: a.category,
        location: a.location,
        totalAcres: a.landDetails?.totalAcres,
        tillableAcres: a.landDetails?.tillableAcres,
        estimatedValue: a.currentValue?.estimatedValue,
        valuePerAcre: a.currentValue?.valuePerAcre,
        lastAppraisalDate: a.currentValue?.lastAppraisalDate,
        acquisitionDate: a.acquisition?.date,
        acquisitionCost: a.acquisition?.totalCost
      })),
      buildings: buildingAssets.map(a => ({
        name: a.name,
        category: a.category,
        squareFeet: a.buildingDetails?.squareFeet,
        yearBuilt: a.buildingDetails?.yearBuilt,
        condition: a.buildingDetails?.condition,
        estimatedValue: a.currentValue?.estimatedValue,
        bookValue: a.depreciation?.bookValue
      })),
      equipment: equipment.map(e => ({
        name: e.name,
        type: e.type,
        make: e.make,
        model: e.model,
        year: e.year,
        currentValue: e.valuation?.currentValue,
        purchasePrice: e.valuation?.purchasePrice,
        bookValue: e.depreciation?.bookValue,
        currentHours: e.currentHours,
        status: e.status
      })),
      livestock: {
        totalHead: cattle.length,
        value: cattleValue,
        byType: {}
      }
    };

    // Group cattle by type
    cattle.forEach(c => {
      const type = c.type || 'unknown';
      if (!assetSchedule.livestock.byType[type]) {
        assetSchedule.livestock.byType[type] = { count: 0, value: 0 };
      }
      assetSchedule.livestock.byType[type].count++;
      assetSchedule.livestock.byType[type].value += (c.valuation?.currentMarketValue || c.valuation?.estimatedValue || 0);
    });

    // ===== 12-MONTH CASH FLOW =====
    const monthlyCashFlow = [];
    for (let m = 1; m <= 12; m++) {
      const monthIncome = monthlyTransactions.find(t => t._id.month === m && t._id.type === 'income');
      const monthExpense = monthlyTransactions.find(t => t._id.month === m && t._id.type === 'expense');

      const income = monthIncome ? monthIncome.total : 0;
      const expenses = monthExpense ? monthExpense.total : 0;

      monthlyCashFlow.push({
        month: m,
        monthName: new Date(currentYear, m - 1).toLocaleString('en-US', { month: 'short' }),
        income: income,
        expenses: expenses,
        loanPayments: monthlyDebtService,
        netCashFlow: income - expenses - monthlyDebtService,
        incomeCount: monthIncome ? monthIncome.count : 0,
        expenseCount: monthExpense ? monthExpense.count : 0
      });
    }

    // ===== REVENUE PROJECTIONS =====
    const projectedRevenue = {
      totalAcres: 0,
      totalProjectedBushels: 0,
      conservative: { revenue: 0, costs: 0, profit: 0 },
      expected: { revenue: 0, costs: 0, profit: 0 },
      optimistic: { revenue: 0, costs: 0, profit: 0 },
      byCrop: {}
    };

    productionProjections.forEach(p => {
      projectedRevenue.totalAcres += p.projectedAcres || 0;
      projectedRevenue.totalProjectedBushels += p.totalProjectedBushels || 0;

      ['conservative', 'expected', 'optimistic'].forEach(scenario => {
        if (p.profitability && p.profitability[scenario]) {
          projectedRevenue[scenario].revenue += p.profitability[scenario].grossRevenue || 0;
          projectedRevenue[scenario].costs += p.profitability[scenario].totalCosts || 0;
          projectedRevenue[scenario].profit += p.profitability[scenario].netProfit || 0;
        }
      });

      if (!projectedRevenue.byCrop[p.cropType]) {
        projectedRevenue.byCrop[p.cropType] = {
          acres: 0, bushels: 0, expectedRevenue: 0, expectedCosts: 0, expectedProfit: 0
        };
      }
      projectedRevenue.byCrop[p.cropType].acres += p.projectedAcres || 0;
      projectedRevenue.byCrop[p.cropType].bushels += p.totalProjectedBushels || 0;
      if (p.profitability && p.profitability.expected) {
        projectedRevenue.byCrop[p.cropType].expectedRevenue += p.profitability.expected.grossRevenue || 0;
        projectedRevenue.byCrop[p.cropType].expectedCosts += p.profitability.expected.totalCosts || 0;
        projectedRevenue.byCrop[p.cropType].expectedProfit += p.profitability.expected.netProfit || 0;
      }
    });

    // ===== COLLATERAL COVERAGE =====
    const collateralSchedule = activeLoans.filter(l => l.collateral).map(loan => {
      const collateralValue = loan.collateral.estimatedValue || 0;
      const ltv = collateralValue > 0 ? (loan.currentBalance / collateralValue * 100) : null;
      return {
        loanName: loan.name,
        lender: loan.lender.name,
        balance: loan.currentBalance,
        collateralDescription: loan.collateral.description,
        collateralType: loan.collateral.type,
        collateralValue: collateralValue,
        ltv: ltv ? Math.round(ltv * 100) / 100 : null,
        equity: collateralValue - loan.currentBalance
      };
    });

    // ===== PAYMENT HISTORY SUMMARY =====
    const paymentHistory = {
      totalLoanPaymentsMade: activeLoans.reduce((sum, l) => sum + (l.payments?.length || 0), 0),
      totalPrincipalPaid: activeLoans.reduce((sum, l) => sum + (l.totalPrincipalPaid || 0), 0),
      totalInterestPaid: activeLoans.reduce((sum, l) => sum + (l.totalInterestPaid || 0), 0),
      ytdPrincipalPaid: activeLoans.reduce((sum, l) => sum + (l.ytdPrincipalPaid || 0), 0),
      ytdInterestPaid: activeLoans.reduce((sum, l) => sum + (l.ytdInterestPaid || 0), 0),
      invoicesPaidYTD: paidInvoicesYTD.length,
      invoiceRevenuePaidYTD: paidInvoicesYTD.reduce((sum, i) => sum + (i.amountPaid || 0), 0)
    };

    // ===== OPERATION OVERVIEW =====
    const operationOverview = {
      farms: farms.length,
      activeFields: fields.length,
      totalAcres: fields.reduce((sum, f) => sum + (f.acres || 0), 0),
      equipmentUnits: equipment.length,
      cattleHead: cattle.length,
      year: currentYear
    };

    // ===== ASSEMBLE RESPONSE =====
    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        year: currentYear,

        operationOverview,

        balanceSheet: {
          assets: {
            current: {
              cash: cashTotal,
              accountsReceivable: arTotal,
              totalCurrent: totalCurrentAssets
            },
            fixed: {
              land: landValue,
              buildings: buildingValue,
              infrastructure: infraValue,
              equipment: equipmentValue,
              livestock: cattleValue,
              totalFixed: totalFixedAssets
            },
            totalAssets
          },
          liabilities: {
            currentLiabilities,
            longTermLiabilities,
            totalLiabilities
          },
          netWorth
        },

        keyRatios: {
          dscr,
          debtToAsset: Math.round(debtToAsset * 100) / 100,
          currentRatio: currentRatio ? Math.round(currentRatio * 100) / 100 : null,
          workingCapital,
          equityToAsset: Math.round(equityToAsset * 100) / 100,
          annualDebtService,
          monthlyDebtService
        },

        incomeStatement: {
          ytdIncome,
          ytdExpenses,
          netOperatingIncome,
          incomeByCategory,
          expenseByCategory
        },

        monthlyCashFlow,
        projectedRevenue,
        debtSchedule,
        assetSchedule,
        collateralSchedule,
        paymentHistory
      }
    });
  } catch (error) {
    console.error('Bankers overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate banker\'s overview',
      error: error.message
    });
  }
};

// Banker comments
exports.addBankerComment = async (req, res) => {
  try {
    const { comment, section } = req.body;

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    // Store comments as transactions with a special category
    // This uses the existing Transaction model as a lightweight comment store
    const BankerComment = require('mongoose').model('BankerComment', new require('mongoose').Schema({
      comment: { type: String, required: true },
      section: String,
      createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' },
      createdByName: String,
      createdAt: { type: Date, default: Date.now }
    }), 'bankercomments');

    const newComment = await BankerComment.create({
      comment,
      section,
      createdBy: req.userId,
      createdByName: req.user?.name || 'Banker'
    });

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added'
    });
  } catch (error) {
    console.error('Add banker comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get banker comments
exports.getBankerComments = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let BankerComment;
    try {
      BankerComment = mongoose.model('BankerComment');
    } catch (e) {
      BankerComment = mongoose.model('BankerComment', new mongoose.Schema({
        comment: { type: String, required: true },
        section: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdByName: String,
        createdAt: { type: Date, default: Date.now }
      }), 'bankercomments');
    }

    const comments = await BankerComment.find({}).sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get banker comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message
    });
  }
};

module.exports = exports;
