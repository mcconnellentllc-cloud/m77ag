// routes/hunting.js
const express = require('express');
const router = express.Router();
const huntingController = require('../controllers/huntingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/bookings', huntingController.createBooking);
router.post('/submit-waiver', huntingController.submitWaiver);
router.post('/update-payment', huntingController.updatePayment);
router.get('/bookings/:id', huntingController.getBookingById);

// Admin routes (protected)
router.get('/admin/bookings', authenticate, isAdmin, huntingController.getAllBookings);
router.delete('/admin/bookings/:id', authenticate, isAdmin, huntingController.cancelBooking);

module.exports = router;