const express = require('express');
const router = express.Router();
const chemicalController = require('../controllers/chemicalController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
// Get all chemical products
router.get('/products', chemicalController.getAllProducts);

// Get all chemical programs
router.get('/programs', chemicalController.getAllPrograms);

// Get product by ID
router.get('/products/:id', chemicalController.getProductById);

// Calculate program cost
router.post('/calculate', chemicalController.calculateProgramCost);

// Create custom chemical quote
router.post('/quote', chemicalController.createCustomQuote);

// Get price comparison
router.get('/price-comparison', chemicalController.getPriceComparison);

// Protected routes (admin only)
// Update product price
router.patch('/products/:id/price', authenticate, isAdmin, chemicalController.updateProductPrice);

module.exports = router;
