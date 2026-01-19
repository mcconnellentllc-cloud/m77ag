const express = require('express');
const router = express.Router();
const financialReportsController = require('../controllers/financialReportsController');
const { protect, restrictTo } = require('../middleware/landManagementAuth');

// All routes require authentication
router.use(protect);

// GET /api/financial-reports/farm - Get comprehensive farm report with dynamic filters
// Query params: farmId, fieldId, landManagementUserId, cropYear, cropType, startDate, endDate, includeProjected
router.get('/farm', financialReportsController.getFarmReport);

// GET /api/financial-reports/upcoming-bills - Get upcoming bills and payment schedule
// Query params: farmId, daysAhead (default: 30)
router.get('/upcoming-bills', financialReportsController.getUpcomingBills);

// GET /api/financial-reports/expense-projections - Get expense projections for a year
// Query params: farmId, year
router.get('/expense-projections', financialReportsController.getExpenseProjections);

// GET /api/financial-reports/production-projections - Get production projections summary
// Query params: farmId, year
router.get('/production-projections', financialReportsController.getProductionProjections);

// GET /api/financial-reports/multi-year-comparison - Get multi-year comparison
// Query params: farmId, years (comma-separated, e.g., "2023,2024,2025")
router.get('/multi-year-comparison', financialReportsController.getMultiYearComparison);

// GET /api/financial-reports/profitability - Get comprehensive profitability report
// Query params: farmId, year, fieldId (optional)
router.get('/profitability', financialReportsController.getProfitabilityReport);

// GET /api/financial-reports/landlord-balance - Get landlord balance and field summary
// Query params: landManagementUserId, farmId (optional)
router.get('/landlord-balance', financialReportsController.getLandlordBalance);

// GET /api/financial-reports/cash-flow - Get cash flow projection
// Query params: farmId, startDate, endDate
router.get('/cash-flow', financialReportsController.getCashFlowProjection);

// GET /api/financial-reports/dashboard - Get dashboard summary
// Query params: farmId, year (optional, defaults to current year)
router.get('/dashboard', financialReportsController.getDashboardSummary);

module.exports = router;
