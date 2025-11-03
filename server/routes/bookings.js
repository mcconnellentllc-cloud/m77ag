const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
// Auth is in root server directory, not in middleware folder
const { authenticate, isAdmin } = require('../auth');

// Public routes (no authentication required)
router.post('/', bookingController.createBooking);
router.get('/booked-dates', bookingController.getBookedDates);

// Admin routes (require authentication)
router.get('/', authenticate, isAdmin, bookingController.getAllBookings);
router.get('/upcoming', authenticate, isAdmin, bookingController.getUpcomingBookings);
router.get('/stats', authenticate, isAdmin, bookingController.getBookingStats);
router.get('/:id', authenticate, isAdmin, bookingController.getBookingById);
router.put('/:id', authenticate, isAdmin, bookingController.updateBooking);
router.patch('/:id/cancel', authenticate, isAdmin, bookingController.cancelBooking);
router.delete('/:id', authenticate, isAdmin, bookingController.deleteBooking);

module.exports = router;