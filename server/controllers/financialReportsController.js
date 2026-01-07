const Transaction = require('../models/transaction');
const ProductionProjection = require('../models/productionProjection');
const HarvestData = require('../models/harvestData');
const Ledger = require('../models/ledger');
const Field = require('../models/field');
const Farm = require('../models/farm');

// Get comprehensive farm financial report with dynamic filters
exports.getFarmReport = async (req, res) => {
  try {
    const {
      farmId,
      fieldId,
      landManagementUserId,
      cropYear,
      cropType,
      startDate,
      endDate,
      includeProjected
    } = req.query;

    // Build filter object
    const filters = {};
    if (farmId) filters.farmId = farmId;
    if (fieldId) filters.fieldId = fieldId;
    if (landManagementUserId) filters.landManagementUserId = landManagementUserId;
    if (cropYear) filters.cropYear = parseInt(cropYear);
    if (cropType) filters.cropType = cropType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (includeProjected !== undefined) filters.includeProjected = includeProjected === 'true';

    const report = await Transaction.getFarmReport(filters);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Farm report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate farm report',
      error: error.message
    });
  }
};

// Get upcoming bills and payment schedule
exports.getUpcomingBills = async (req, res) => {
  try {
    const { farmId, daysAhead } = req.query;

    if (!farmId) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required'
      });
    }

    const days = daysAhead ? parseInt(daysAhead) : 30;
    const billsReport = await Transaction.getUpcomingBills(farmId, days);

    res.json({
      success: true,
      data: billsReport
    });
  } catch (error) {
    console.error('Upcoming bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming bills',
      error: error.message
    });
  }
};

// Get expense projections
exports.getExpenseProjections = async (req, res) => {
  try {
    const { farmId, year } = req.query;

    if (!farmId || !year) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID and year are required'
      });
    }

    const projections = await Transaction.getExpenseProjections(farmId, parseInt(year));

    res.json({
      success: true,
      data: projections
    });
  } catch (error) {
    console.error('Expense projections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense projections',
      error: error.message
    });
  }
};

// Get production projections summary
exports.getProductionProjections = async (req, res) => {
  try {
    const { farmId, year } = req.query;

    if (!farmId || !year) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID and year are required'
      });
    }

    const projections = await ProductionProjection.getFarmProjectionsSummary(
      farmId,
      parseInt(year)
    );

    res.json({
      success: true,
      data: projections
    });
  } catch (error) {
    console.error('Production projections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get production projections',
      error: error.message
    });
  }
};

// Get multi-year comparison
exports.getMultiYearComparison = async (req, res) => {
  try {
    const { farmId, years } = req.query;

    if (!farmId || !years) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID and years are required'
      });
    }

    const yearArray = years.split(',').map(y => parseInt(y));
    const comparison = await Transaction.getMultiYearComparison(farmId, yearArray);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Multi-year comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get multi-year comparison',
      error: error.message
    });
  }
};

// Get comprehensive profitability report
exports.getProfitabilityReport = async (req, res) => {
  try {
    const { farmId, year, fieldId } = req.query;

    if (!farmId || !year) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID and year are required'
      });
    }

    const filters = {
      farmId: farmId,
      cropYear: parseInt(year)
    };

    if (fieldId) filters.fieldId = fieldId;

    // Get actual transactions
    const transactionReport = await Transaction.getFarmReport(filters);

    // Get production data
    const harvestFilter = {
      farm: farmId,
      cropYear: parseInt(year)
    };
    if (fieldId) harvestFilter.field = fieldId;

    const harvests = await HarvestData.find(harvestFilter);

    // Get projections if they exist
    const projections = await ProductionProjection.find({
      farm: farmId,
      projectionYear: parseInt(year)
    });

    // Calculate comprehensive metrics
    const report = {
      year: parseInt(year),
      farmId: farmId,
      actual: {
        totalIncome: transactionReport.totalIncome,
        totalExpense: transactionReport.totalExpense,
        netProfit: transactionReport.netProfit,
        expenseByCategory: transactionReport.byCategory
      },
      production: {
        totalBushels: 0,
        totalAcres: 0,
        averageYield: 0,
        byCrop: {}
      },
      projections: {
        expectedRevenue: 0,
        expectedCosts: 0,
        expectedProfit: 0,
        byCrop: {}
      },
      variance: {
        revenueVariance: 0,
        costVariance: 0,
        profitVariance: 0
      }
    };

    // Process harvest data
    harvests.forEach(h => {
      report.production.totalBushels += h.totalBushels || 0;
      report.production.totalAcres += h.acresHarvested || 0;

      if (!report.production.byCrop[h.cropType]) {
        report.production.byCrop[h.cropType] = {
          bushels: 0,
          acres: 0,
          yield: 0,
          revenue: 0
        };
      }

      report.production.byCrop[h.cropType].bushels += h.totalBushels || 0;
      report.production.byCrop[h.cropType].acres += h.acresHarvested || 0;
      if (h.calculations && h.calculations.grossRevenue) {
        report.production.byCrop[h.cropType].revenue += h.calculations.grossRevenue;
      }
    });

    if (report.production.totalAcres > 0) {
      report.production.averageYield = report.production.totalBushels / report.production.totalAcres;
    }

    // Calculate yield per crop
    Object.keys(report.production.byCrop).forEach(crop => {
      const cropData = report.production.byCrop[crop];
      if (cropData.acres > 0) {
        cropData.yield = cropData.bushels / cropData.acres;
      }
    });

    // Process projections
    projections.forEach(p => {
      if (p.profitability && p.profitability.expected) {
        report.projections.expectedRevenue += p.profitability.expected.grossRevenue || 0;
        report.projections.expectedCosts += p.profitability.expected.totalCosts || 0;
        report.projections.expectedProfit += p.profitability.expected.netProfit || 0;
      }

      if (!report.projections.byCrop[p.cropType]) {
        report.projections.byCrop[p.cropType] = {
          acres: 0,
          bushels: 0,
          revenue: 0,
          costs: 0,
          profit: 0
        };
      }

      report.projections.byCrop[p.cropType].acres += p.projectedAcres || 0;
      report.projections.byCrop[p.cropType].bushels += p.totalProjectedBushels || 0;
      if (p.profitability && p.profitability.expected) {
        report.projections.byCrop[p.cropType].revenue += p.profitability.expected.grossRevenue || 0;
        report.projections.byCrop[p.cropType].costs += p.profitability.expected.totalCosts || 0;
        report.projections.byCrop[p.cropType].profit += p.profitability.expected.netProfit || 0;
      }
    });

    // Calculate variance between projected and actual
    if (projections.length > 0) {
      report.variance.revenueVariance = report.actual.totalIncome - report.projections.expectedRevenue;
      report.variance.costVariance = report.actual.totalExpense - report.projections.expectedCosts;
      report.variance.profitVariance = report.actual.netProfit - report.projections.expectedProfit;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Profitability report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate profitability report',
      error: error.message
    });
  }
};

// Get landlord balance summary
exports.getLandlordBalance = async (req, res) => {
  try {
    const { landManagementUserId, farmId } = req.query;

    if (!landManagementUserId) {
      return res.status(400).json({
        success: false,
        message: 'Landlord user ID is required'
      });
    }

    // Get ledger summary
    const ledgerSummary = await Ledger.getLandlordAccountSummary(landManagementUserId);

    // Get fields owned by landlord
    const fields = await Field.find({
      landlord: landManagementUserId,
      ...(farmId && { farm: farmId })
    });

    const balance = {
      landlordId: landManagementUserId,
      totalOutstanding: ledgerSummary.totalOutstanding,
      farmerOwesLandlord: ledgerSummary.farmerOwesLandlord,
      landlordOwesFarmer: ledgerSummary.landlordOwesFarmer,
      totalOverdue: ledgerSummary.totalOverdue,
      fieldsCount: fields.length,
      totalAcres: fields.reduce((sum, f) => sum + (f.acres || 0), 0),
      fields: fields.map(f => ({
        fieldId: f._id,
        fieldName: f.fieldName,
        acres: f.acres,
        leaseType: f.leaseTerms?.leaseType,
        rentPerAcre: f.leaseTerms?.rentPerAcre
      }))
    };

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Landlord balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landlord balance',
      error: error.message
    });
  }
};

// Get cash flow projection
exports.getCashFlowProjection = async (req, res) => {
  try {
    const { farmId, startDate, endDate } = req.query;

    if (!farmId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID, start date, and end date are required'
      });
    }

    // Get upcoming bills
    const upcomingExpenses = await Transaction.find({
      farm: farmId,
      type: 'expense',
      dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      paymentStatus: { $in: ['unpaid', 'partial'] }
    }).sort({ dueDate: 1 });

    // Get projected income from production projections
    const year = new Date(startDate).getFullYear();
    const productionProjections = await ProductionProjection.find({
      farm: farmId,
      projectionYear: year,
      status: 'active'
    });

    // Build cash flow timeline
    const cashFlow = {
      startDate: startDate,
      endDate: endDate,
      upcomingExpenses: upcomingExpenses.map(e => ({
        date: e.dueDate,
        category: e.category,
        description: e.description,
        amount: e.amount,
        status: e.paymentStatus
      })),
      projectedIncome: productionProjections.map(p => ({
        date: p.expectedHarvestDate,
        cropType: p.cropType,
        expectedRevenue: p.profitability?.expected?.grossRevenue || 0
      })),
      summary: {
        totalUpcomingExpenses: upcomingExpenses.reduce((sum, e) => sum + e.amount, 0),
        totalProjectedIncome: productionProjections.reduce((sum, p) => {
          return sum + (p.profitability?.expected?.grossRevenue || 0);
        }, 0)
      }
    };

    cashFlow.summary.projectedCashBalance =
      cashFlow.summary.totalProjectedIncome - cashFlow.summary.totalUpcomingExpenses;

    res.json({
      success: true,
      data: cashFlow
    });
  } catch (error) {
    console.error('Cash flow projection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow projection',
      error: error.message
    });
  }
};

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const { farmId, year } = req.query;

    if (!farmId) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required'
      });
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get current year data
    const currentYearData = await Transaction.getFarmReport({
      farmId: farmId,
      cropYear: currentYear
    });

    // Get upcoming bills (next 30 days)
    const upcomingBills = await Transaction.getUpcomingBills(farmId, 30);

    // Get production projections
    const productionProjections = await ProductionProjection.getFarmProjectionsSummary(
      farmId,
      currentYear
    );

    // Get fields
    const fields = await Field.find({ farm: farmId, active: true });

    const summary = {
      farm: await Farm.findById(farmId),
      year: currentYear,
      totalAcres: fields.reduce((sum, f) => sum + (f.acres || 0), 0),
      fieldsCount: fields.length,
      currentYear: {
        income: currentYearData.totalIncome,
        expenses: currentYearData.totalExpense,
        profit: currentYearData.netProfit,
        profitMargin: currentYearData.totalIncome > 0
          ? (currentYearData.netProfit / currentYearData.totalIncome * 100).toFixed(2)
          : 0
      },
      upcomingBills: {
        totalDue: upcomingBills.totalDue,
        count: upcomingBills.billCount
      },
      projections: {
        expectedRevenue: productionProjections.expectedRevenue,
        expectedCosts: productionProjections.expectedCosts,
        expectedProfit: productionProjections.expectedProfit
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard summary',
      error: error.message
    });
  }
};

module.exports = exports;
