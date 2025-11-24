const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, isAdmin } = require('../middleware/auth');
// Public routes
// Create a new service request
router.post('/request', serviceController.createServiceRequest);
// Create chemical program quote
router.post('/chemical-quote', serviceController.createChemicalProgramQuote);
// Protected routes (admin only)
// Get all service requests
router.get('/', authenticate, isAdmin, serviceController.getAllServiceRequests);
// Get a specific service request
router.get('/:id', authenticate, isAdmin, serviceController.getServiceRequest);
// Update service request status
router.patch('/:id/status', authenticate, isAdmin, serviceController.updateServiceRequestStatus);
module.exports = router;
