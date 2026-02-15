const express = require('express');
const router = express.Router();
const cropInsuranceController = require('../controllers/cropInsuranceController');
const { protect, restrictTo, checkFarmAccess } = require('../middleware/landManagementAuth');

// Apply authentication to all routes
router.use(protect);

// Farm-specific routes
router.get('/farm/:farmId', checkFarmAccess, cropInsuranceController.getAllPolicies);
router.get('/farm/:farmId/summary', checkFarmAccess, cropInsuranceController.getInsuranceSummary);
router.get('/farm/:farmId/attention', checkFarmAccess, cropInsuranceController.getPoliciesNeedingAttention);

// Single policy CRUD
router.get('/:id', cropInsuranceController.getPolicy);
router.post('/', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.createPolicy);
router.put('/:id', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.updatePolicy);
router.delete('/:id', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.deletePolicy);

// Policy actions
router.post('/:id/calculate-coverage', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.calculateCoverage);
router.post('/:id/claims', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.fileClaim);
router.patch('/:id/claims/status', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.updateClaimStatus);
router.post('/:id/aph', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.addAPHHistory);
router.post('/:id/fields', restrictTo('super-admin', 'farm-owner'), cropInsuranceController.addCoveredField);

module.exports = router;
