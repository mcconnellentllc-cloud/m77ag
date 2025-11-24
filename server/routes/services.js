const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

// Public routes
// Create a new service request
router.post('/request', serviceController.createServiceRequest);

// Create chemical program quote
router.post('/chemical-quote', serviceController.createChemicalProgramQuote);

// Protected routes (admin only)
// Get all service requests
router.get('/', protect, serviceController.getAllServiceRequests);

// Get a specific service request
router.get('/:id', protect, serviceController.getServiceRequest);

// Update service request status
router.patch('/:id/status', protect, serviceController.updateServiceRequestStatus);

// Delete service request
router.delete('/:id', protect, serviceController.deleteServiceRequest);

module.exports = router;
