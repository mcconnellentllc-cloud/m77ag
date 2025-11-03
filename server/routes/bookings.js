const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// PUBLIC ROUTES (no authentication required)
// Customers can create bookings and check availability
router.post('/', bookingController.createBooking);
router.get('/booked-dates', bookingController.getBookedDates);

// ADMIN ROUTES (require authentication and admin role)
// Only admins can view, modify, and delete bookings
router.get('/', authenticate, isAdmin, bookingController.getAllBookings);
router.get('/upcoming', authenticate, isAdmin, bookingController.getUpcomingBookings);
router.get('/stats', authenticate, isAdmin, bookingController.getBookingStats);
router.get('/:id', authenticate, isAdmin, bookingController.getBookingById);
router.put('/:id', authenticate, isAdmin, bookingController.updateBooking);
router.patch('/:id/cancel', authenticate, isAdmin, bookingController.cancelBooking);
router.delete('/:id', authenticate, isAdmin, bookingController.deleteBooking);

module.exports = router;