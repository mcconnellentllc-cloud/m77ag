const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// ALL routes are public for now - we'll add authentication later
router.post('/', bookingController.createBooking);
router.get('/booked-dates', bookingController.getBookedDates);
router.get('/', bookingController.getAllBookings);
router.get('/upcoming', bookingController.getUpcomingBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;