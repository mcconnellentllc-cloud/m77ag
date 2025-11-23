const Booking = require('../models/booking');
const { sendBookingConfirmation } = require('../utils/emailservice');

const bookingController = {
  // Create a new booking
  createBooking: async (req, res) => {
    try {
      const {
        customerName,
        email,
        phone,
        parcel,
        checkinDate,
        checkoutDate,
        numHunters,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicense,
        dailyRate,
        numNights,
        campingFee,
        totalPrice,
        paymentMethod,
        paymentStatus,
        notes
      } = req.body;

      // Check if dates are already booked for this parcel
      const existingBooking = await Booking.findOne({
        parcel,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          {
            checkinDate: { $lte: new Date(checkoutDate) },
            checkoutDate: { $gte: new Date(checkinDate) }
          }
        ]
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'These dates are already booked for this parcel'
        });
      }

      // Create new booking
      const booking = new Booking({
        customerName,
        email,
        phone,
        parcel,
        checkinDate: new Date(checkinDate),
        checkoutDate: new Date(checkoutDate),
        numHunters,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicense,
        dailyRate,
        numNights,
        campingFee,
        totalPrice,
        paymentMethod: paymentMethod || 'paypal',
        paymentStatus: paymentStatus || 'pending',
        notes,
        status: 'confirmed'
      });

      await booking.save();

      // Send confirmation email
      try {
        await sendBookingConfirmation(booking);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking'
      });
    }
  },

  // Get all bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings'
      });
    }
  },

  // Get booked dates for calendar
  getBookedDates: async (req, res) => {
    try {
      const bookings = await Booking.find({
        status: { $in: ['pending', 'confirmed'] }
      }).select('checkinDate checkoutDate parcel');

      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching booked dates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booked dates'
      });
    }
  },

  // Get single booking by ID
  getBookingById: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        booking
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking'
      });
    }
  },

  // Update booking
  updateBooking: async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Booking updated successfully',
        booking
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking'
      });
    }
  },

  // Delete booking
  deleteBooking: async (req, res) => {
    try {
      const booking = await Booking.findByIdAndDelete(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete booking'
      });
    }
  },

  // Get upcoming bookings
  getUpcomingBookings: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await Booking.find({
        checkinDate: { $gte: today },
        status: { $in: ['pending', 'confirmed'] }
      }).sort({ checkinDate: 1 });

      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming bookings'
      });
    }
  },

  // Get booking statistics
  getBookingStats: async (req, res) => {
    try {
      const totalBookings = await Booking.countDocuments();
      const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

      const totalRevenue = await Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'pending'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      res.json({
        success: true,
        stats: {
          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking stats'
      });
    }
  },

  // Cancel booking
  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking'
      });
    }
  }
};

module.exports = bookingController;