const express = require('express');
const router = express.Router();
const cropInventoryController = require('../controllers/cropInventoryController');
const { protect, restrictTo, checkFarmAccess } = require('../middleware/landManagementAuth');

// Apply authentication to all routes
router.use(protect);

// Farm-specific routes
router.get('/farm/:farmId', checkFarmAccess, cropInventoryController.getAllInventory);
router.get('/farm/:farmId/summary', checkFarmAccess, cropInventoryController.getInventorySummary);
router.get('/farm/:farmId/triggers/:cropType', checkFarmAccess, cropInventoryController.checkSlidingScaleTriggers);
router.post('/farm/:farmId/projections', checkFarmAccess, cropInventoryController.getRevenueProjections);

// Single inventory CRUD
router.get('/:id', cropInventoryController.getInventory);
router.post('/', restrictTo('super-admin', 'farm-owner'), cropInventoryController.createInventory);
router.put('/:id', restrictTo('super-admin', 'farm-owner'), cropInventoryController.updateInventory);
router.delete('/:id', restrictTo('super-admin', 'farm-owner'), cropInventoryController.deleteInventory);

// Inventory actions
router.post('/:id/sales', restrictTo('super-admin', 'farm-owner'), cropInventoryController.recordSale);
router.post('/:id/shrinkage', restrictTo('super-admin', 'farm-owner'), cropInventoryController.recordShrinkage);
router.post('/:id/contracts', restrictTo('super-admin', 'farm-owner'), cropInventoryController.addContract);

// Sliding scale
router.post('/:id/sliding-scale', restrictTo('super-admin', 'farm-owner'), cropInventoryController.configureSlidingScale);
router.post('/:id/sliding-scale/execute', restrictTo('super-admin', 'farm-owner'), cropInventoryController.executeSlidingScaleTier);

// Market data
router.post('/:id/market-price', restrictTo('super-admin', 'farm-owner'), cropInventoryController.updateMarketPrice);
router.post('/:id/storage-fees', restrictTo('super-admin', 'farm-owner'), cropInventoryController.addStorageFee);

module.exports = router;
