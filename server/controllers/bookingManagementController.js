const HuntingBooking = require('../models/booking');

const bookingManagementController = {
  // Delete a single booking by ID
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await HuntingBooking.findByIdAndDelete(id);
      
      if (!result) {
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

  // Delete ALL bookings (for testing/cleanup)
  deleteAllBookings: async (req, res) => {
    try {
      const result = await HuntingBooking.deleteMany({});
      
      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} bookings`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting all bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete bookings'
      });
    }
  },

  // Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const booking = await HuntingBooking.findByIdAndUpdate(
        id,
        { status },
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
        message: 'Booking status updated',
        booking
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking'
      });
    }
  }
};

module.exports = bookingManagementController;