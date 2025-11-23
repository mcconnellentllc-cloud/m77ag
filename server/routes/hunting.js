const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/bookings', bookingController.createBooking);
router.post('/submit-waiver', bookingController.submitWaiver);
router.get('/bookings/:id', bookingController.getBookingById);

// Admin routes (protected)
router.get('/admin/bookings', authenticate, isAdmin, bookingController.getAllBookings);
router.delete('/admin/bookings/:id', authenticate, isAdmin, bookingController.cancelBooking);

module.exports = router;