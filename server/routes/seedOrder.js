const express = require('express');
const router = express.Router();
const seedOrderController = require('../controllers/seedOrderController');
const { protect, restrictTo, checkFarmAccess } = require('../middleware/landManagementAuth');

// Apply authentication to all routes
router.use(protect);

// Get available hybrids (no farm context needed)
router.get('/hybrids', seedOrderController.getAvailableHybrids);

// Farm-specific routes
router.get('/farm/:farmId', checkFarmAccess, seedOrderController.getAllOrders);
router.get('/farm/:farmId/summary', checkFarmAccess, seedOrderController.getOrderSummary);

// Single order CRUD
router.get('/:id', seedOrderController.getOrder);
router.post('/', restrictTo('super-admin', 'farm-owner'), seedOrderController.createOrder);
router.put('/:id', restrictTo('super-admin', 'farm-owner'), seedOrderController.updateOrder);
router.delete('/:id', restrictTo('super-admin', 'farm-owner'), seedOrderController.deleteOrder);

// Order actions
router.post('/:id/assign/:seedType/:hybridIndex', restrictTo('super-admin', 'farm-owner'), seedOrderController.assignToField);
router.post('/:id/payments', restrictTo('super-admin', 'farm-owner'), seedOrderController.recordPayment);

module.exports = router;
