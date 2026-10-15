const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const {
  createRentalApplication,
  getAllRentalApplications,
  getRentalApplicationById,
  updateRentalApplicationStatus,
  sendRentalContract
} = require('../controllers/rentalApplicationController');

// Public route - submit rental application
router.post('/rental-applications', createRentalApplication);

// Admin routes
router.get('/rental-applications', adminOnly, getAllRentalApplications);
router.get('/rental-applications/:id', adminOnly, getRentalApplicationById);
router.put('/rental-applications/:id/status', adminOnly, updateRentalApplicationStatus);
router.post('/rental-applications/:id/send-contract', adminOnly, sendRentalContract);

module.exports = router;
