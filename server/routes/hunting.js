const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/bookings', bookingController.createBooking);
router.post('/submit-waiver', bookingController.submitWaiver);
router.get('/booked-dates', bookingController.getBookedDates);
router.get('/game-rest-dates', bookingController.getGameRestDates);
router.get('/booking-info/:id', bookingController.getBookingInfo);
router.post('/game-rest-request', bookingController.submitGameRestRequest);

// User routes (protected)
router.get('/my-bookings', authenticate, bookingController.getMyBookings);

// Admin routes (protected) - these match what the frontend expects
router.get('/bookings', authenticate, isAdmin, bookingController.getAllBookings);
router.post('/bookings/manual', authenticate, isAdmin, bookingController.createManualBooking);
router.get('/bookings/:id', authenticate, isAdmin, bookingController.getBookingById);
router.put('/bookings/:id', authenticate, isAdmin, bookingController.updateBooking);
router.delete('/bookings/:id', authenticate, isAdmin, bookingController.cancelBooking);
router.post('/bookings/:id/resend-confirmation', authenticate, isAdmin, bookingController.resendConfirmation);
router.post('/bookings/:id/send-waiver-reminder', authenticate, isAdmin, bookingController.sendWaiverReminder);
router.get('/search-customer', authenticate, isAdmin, bookingController.searchCustomer);
router.post('/recalculate-spend', authenticate, isAdmin, bookingController.recalculateCustomerSpend);

module.exports = router;