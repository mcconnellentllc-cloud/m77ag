const HuntingBooking = require('../models/booking');

const huntingAnalyticsController = {
  // Get hunting booking statistics for admin dashboard
  getHuntingStats: async (req, res) => {
    try {
      // Get all bookings
      const allBookings = await HuntingBooking.find({});
      
      // Get active bookings (future dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeBookings = await HuntingBooking.find({
        checkoutDate: { $gte: today }
      });
      
      // Calculate total revenue (all time)
      const totalRevenue = allBookings.reduce((sum, booking) => {
        return sum + (booking.totalPrice || 0);
      }, 0);
      
      // Calculate total acres across all bookings
      const totalAcres = allBookings.reduce((sum, booking) => {
        // Heritage Farm = 1,160 acres, Prairie Peace = 1,550 acres
        const acres = booking.parcel === 'M77 AG Heritage Farm' ? 1160 : 1550;
        return sum + acres;
      }, 0);
      
      // Count unique customers
      const uniqueEmails = [...new Set(allBookings.map(b => b.email))];
      const activeCustomers = uniqueEmails.length;
      
      // Get recent bookings (last 10)
      const recentBookings = await HuntingBooking.find({})
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Revenue by property
      const heritageRevenue = allBookings
        .filter(b => b.parcel === 'M77 AG Heritage Farm')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      const prairieRevenue = allBookings
        .filter(b => b.parcel === 'Prairie Peace')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      res.json({
        success: true,
        stats: {
          totalRevenue,
          activeBookings: activeBookings.length,
          totalBookings: allBookings.length,
          totalAcres,
          activeCustomers,
          heritageRevenue,
          prairieRevenue
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking._id,
          customerName: booking.customerName,
          email: booking.email,
          phone: booking.phone,
          parcel: booking.parcel,
          checkinDate: booking.checkinDate,
          checkoutDate: booking.checkoutDate,
          numHunters: booking.numHunters,
          totalPrice: booking.totalPrice,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching hunting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hunting statistics'
      });
    }
  },

  // Get all hunting bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await HuntingBooking.find({})
        .sort({ createdAt: -1 });
      
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
  }
};

module.exports = huntingAnalyticsController;