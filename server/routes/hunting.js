// server/routes/hunting.js
const express = require('express');
const router = express.Router();
const HuntingBooking = require('../models/huntingBooking');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/emailService');

// Create new hunting booking
router.post('/bookings', async (req, res) => {
  try {
    const {
      huntType,
      dates,
      hunterInfo,
      vehicleInfo,
      price,
      description,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!huntType || !dates || !hunterInfo || !vehicleInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate lead hunter age for youth hunts
    const hasYouth = hunterInfo.hunterAges && hunterInfo.hunterAges.includes('youth');
    const leadHunterIsYouth = hunterInfo.hunterAges && hunterInfo.hunterAges[0] === 'youth';
    
    if (hasYouth && leadHunterIsYouth) {
      return res.status(400).json({
        success: false,
        message: 'At least one adult (18+) must be present when youth hunters are participating'
      });
    }

    // Check for date conflicts (optional - if you want exclusive bookings)
    const existingBookings = await HuntingBooking.find({
      dates: { $in: dates },
      status: { $ne: 'cancelled' }
    });

    const conflictingParcels = [];
    for (const booking of existingBookings) {
      if (booking.huntType === huntType && huntType.includes('pheasant')) {
        conflictingParcels.push(...booking.dates);
      }
    }

    if (conflictingParcels.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected dates are already booked for this parcel',
        conflictingDates: [...new Set(conflictingParcels)]
      });
    }

    // Create booking
    const booking = new HuntingBooking({
      huntType,
      dates,
      hunterInfo,
      vehicleInfo,
      totalPrice: price,
      description,
      paymentMethod: paymentMethod || 'pending',
      status: 'pending',
      bookingNumber: `M77H-${Date.now()}`
    });

    await booking.save();

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all bookings (admin only)
router.get('/bookings', authenticateAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, huntType } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (huntType) query.huntType = huntType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await HuntingBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Get single booking
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await HuntingBooking.findOne({
      $or: [
        { _id: req.params.id },
        { bookingNumber: req.params.id }
      ]
    });

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
});

// Update booking status (admin only)
router.patch('/bookings/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await HuntingBooking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        notes: notes || undefined,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Send status update email
    if (status === 'confirmed') {
      try {
        await sendBookingConfirmation(booking, true);
      } catch (emailError) {
        console.error('Confirmation email failed:', emailError);
      }
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
});

// Delete booking (admin only)
router.delete('/bookings/:id', authenticateAdmin, async (req, res) => {
  try {
    const booking = await HuntingBooking.findByIdAndDelete(req.params.id);

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
});

// Get available dates for a hunt type
router.get('/availability', async (req, res) => {
  try {
    const { huntType, month, year } = req.query;
    
    if (!huntType || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Hunt type, month, and year are required'
      });
    }

    // Get all bookings for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const bookings = await HuntingBooking.find({
      huntType,
      status: { $ne: 'cancelled' },
      dates: {
        $gte: `${month}/1/${year}`,
        $lte: `${month}/${endDate.getDate()}/${year}`
      }
    });

    // Extract booked dates
    const bookedDates = bookings.reduce((dates, booking) => {
      return dates.concat(booking.dates);
    }, []);

    res.json({
      success: true,
      bookedDates: [...new Set(bookedDates)],
      huntType
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability'
    });
  }
});

// Get booking statistics (admin only)
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await HuntingBooking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const huntTypeStats = await HuntingBooking.aggregate([
      {
        $group: {
          _id: '$huntType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const youthStats = await HuntingBooking.aggregate([
      {
        $match: { 'hunterInfo.youthCount': { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          totalYouthHunters: { $sum: '$hunterInfo.youthCount' },
          bookingsWithYouth: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byHuntType: huntTypeStats,
        youthParticipation: youthStats[0] || { totalYouthHunters: 0, bookingsWithYouth: 0 }
      }
    });

  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate statistics'
    });
  }
});

module.exports = router;