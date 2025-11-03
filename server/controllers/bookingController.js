const Booking = require('../models/booking');

const bookingController = {
  // Create a new booking
  createBooking: async (req, res) => {
    try {
      const {
        hunterName,
        hunterEmail,
        hunterPhone,
        parcel,
        checkinDate,
        checkoutDate,
        campingIncluded,
        totalCost,
        depositPaid,
        paymentMethod,
        paymentId,
        paymentStatus,
        notes,
        createdBy
      } = req.body;

      // Validate required fields
      if (!hunterName || !hunterEmail || !hunterPhone || !parcel || !checkinDate || !checkoutDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if dates are already booked for this parcel
      const existingBooking = await Booking.findOne({
        parcel: parcel,
        status: { $ne: 'cancelled' },
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
      const booking = await Booking.create({
        hunterName,
        hunterEmail,
        hunterPhone,
        parcel,
        checkinDate: new Date(checkinDate),
        checkoutDate: new Date(checkoutDate),
        campingIncluded: campingIncluded || false,
        totalCost,
        depositPaid: depositPaid || 0,
        paymentMethod: paymentMethod || 'paypal',
        paymentId,
        paymentStatus: paymentStatus || 'pending',
        notes,
        createdBy: createdBy || 'customer',
        status: depositPaid > 0 ? 'confirmed' : 'pending'
      });

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
      const bookings = await Booking.find()
        .sort({ checkinDate: 1 })
        .lean();

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

  // Get upcoming bookings
  getUpcomingBookings: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await Booking.find({
        checkinDate: { $gte: today },
        status: { $in: ['confirmed', 'pending'] }
      })
        .sort({ checkinDate: 1 })
        .lean();

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

  // Get booking by ID
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

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
      const { id } = req.params;
      const updateData = req.body;

      const booking = await Booking.findByIdAndUpdate(
        id,
        updateData,
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

  // Cancel booking
  cancelBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByIdAndUpdate(
        id,
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
  },

  // Delete booking (admin only)
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByIdAndDelete(id);

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

  // Get booking statistics
  getBookingStats: async (req, res) => {
    try {
      const totalBookings = await Booking.countDocuments();
      const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      
      const revenueData = await Booking.aggregate([
        {
          $match: { status: { $in: ['confirmed', 'completed'] } }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalCost' },
            totalDeposits: { $sum: '$depositPaid' },
            totalBalance: { $sum: '$balanceDue' }
          }
        }
      ]);

      const stats = {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        revenue: revenueData[0] || {
          totalRevenue: 0,
          totalDeposits: 0,
          totalBalance: 0
        }
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking statistics'
      });
    }
  },

  // Get booked dates for calendar
  getBookedDates: async (req, res) => {
    try {
      const { parcel } = req.query;
      
      const query = {
        status: { $in: ['confirmed', 'pending'] }
      };
      
      if (parcel) {
        query.parcel = parcel;
      }

      const bookings = await Booking.find(query)
        .select('checkinDate checkoutDate parcel')
        .lean();

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
  }
};

module.exports = bookingController;