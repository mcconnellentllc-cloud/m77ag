const express = require('express');
const router = express.Router();
const farmingDashboardController = require('../controllers/farmingDashboardController');
const { protect, restrictTo } = require('../middleware/landManagementAuth');

// Apply authentication to all routes
router.use(protect);

// Dashboard summary - accessible by farm owners and landlords
router.get('/summary', farmingDashboardController.getDashboardSummary);

// Inventory summary
router.get('/inventory', farmingDashboardController.getInventorySummary);

// Insurance summary
router.get('/insurance', farmingDashboardController.getInsuranceSummary);

// Financial projections
router.get('/projections', farmingDashboardController.getProjections);

// Planting plan
router.get('/planting-plan', farmingDashboardController.getPlantingPlan);

// Crop rotations
router.get('/rotations', farmingDashboardController.getRotations);

// Sliding scale status
router.get('/sliding-scale', farmingDashboardController.getSlidingScaleStatus);

// Alerts and notifications
router.get('/alerts', farmingDashboardController.getAlerts);

module.exports = router;
