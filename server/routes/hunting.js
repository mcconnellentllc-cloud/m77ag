const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/bookings', bookingController.createBooking);
router.post('/submit-waiver', bookingController.submitWaiver);
router.get('/booked-dates', bookingController.getBookedDates);

// Admin routes (protected) - these match what the frontend expects
router.get('/bookings', authenticate, isAdmin, bookingController.getAllBookings);
router.get('/bookings/:id', authenticate, isAdmin, bookingController.getBookingById);
router.delete('/bookings/:id', authenticate, isAdmin, bookingController.cancelBooking);
router.post('/bookings/:id/resend-confirmation', authenticate, isAdmin, bookingController.resendConfirmation);

module.exports = router;