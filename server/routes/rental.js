const express = require('express');
const router = express.Router();
const {
  createRentalApplication,
  getAllRentalApplications,
  getRentalApplicationById,
  updateRentalApplicationStatus,
  sendRentalContract
} = require('../controllers/rentalApplicationController');

// Public route - submit rental application
router.post('/rental-applications', createRentalApplication);

// Admin routes (would need authentication middleware in production)
router.get('/rental-applications', getAllRentalApplications);
router.get('/rental-applications/:id', getRentalApplicationById);
router.put('/rental-applications/:id/status', updateRentalApplicationStatus);
router.post('/rental-applications/:id/send-contract', sendRentalContract);

module.exports = router;
