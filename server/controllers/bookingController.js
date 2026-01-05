const Booking = require('../models/booking');
const GameRest = require('../models/gameRest');
const { sendBookingConfirmation, sendWaiverConfirmation } = require('../utils/emailservice');

// Helper function to create automatic game rest periods after booking
async function createGameRestPeriods(booking) {
  try {
    const checkoutDate = new Date(booking.checkoutDate);
    const dayOfWeek = checkoutDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Determine rest days based on checkout day
    let restDays = [];

    // Check if booking includes a full weekend (checkout is Sunday or Monday)
    const checkinDate = new Date(booking.checkinDate);
    const checkinDay = checkinDate.getDay();
    const isWeekendBooking = (checkinDay === 6 || checkinDay === 5) && (dayOfWeek === 0 || dayOfWeek === 1);

    if (isWeekendBooking || dayOfWeek === 0) {
      // Weekend booking or checkout on Sunday - rest Monday and Tuesday
      const monday = new Date(checkoutDate);
      monday.setDate(checkoutDate.getDate() + (dayOfWeek === 0 ? 1 : (8 - dayOfWeek)));
      monday.setHours(12, 0, 0, 0);

      const tuesday = new Date(monday);
      tuesday.setDate(monday.getDate() + 1);
      tuesday.setHours(12, 0, 0, 0);

      restDays = [monday, tuesday];
    } else if (dayOfWeek === 6) {
      // Checkout on Saturday - rest on Monday (skip Sunday)
      const monday = new Date(checkoutDate);
      monday.setDate(checkoutDate.getDate() + 2);
      monday.setHours(12, 0, 0, 0);

      restDays = [monday];
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Weekday checkout (Mon-Fri) - rest the next day
      const nextDay = new Date(checkoutDate);
      nextDay.setDate(checkoutDate.getDate() + 1);
      nextDay.setHours(12, 0, 0, 0);

      restDays = [nextDay];
    }

    // Create game rest entries for each rest day
    for (const restDay of restDays) {
      const restEnd = new Date(restDay);
      restEnd.setHours(23, 59, 59, 999);

      const gameRest = new GameRest({
        parcel: booking.parcel,
        startDate: restDay,
        endDate: restEnd,
        reason: 'Automatic rest period after booking',
        bookingId: booking._id
      });

      await gameRest.save();
      console.log(`Created game rest period for ${booking.parcel} on ${restDay.toDateString()}`);
    }
  } catch (error) {
    console.error('Error creating game rest periods:', error);
    // Don't fail the booking if rest periods fail
  }
}

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
        gameSpecies,
        coyoteHuntingType,
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
        paypalTransactionId,
        notes,
        discountCode,
        discountPercent,
        originalPrice
      } = req.body;

      // Create dates at noon local time to avoid timezone issues
      const checkinDateTime = new Date(checkinDate);
      checkinDateTime.setHours(12, 0, 0, 0);

      const checkoutDateTime = new Date(checkoutDate);
      checkoutDateTime.setHours(12, 0, 0, 0);

      // Check if dates are already booked
      let existingBooking;

      if (parcel === 'Both Properties') {
        // If booking both properties, check if either property is already booked
        existingBooking = await Booking.findOne({
          $or: [
            { parcel: 'Heritage Farm' },
            { parcel: 'Prairie Peace' },
            { parcel: 'Both Properties' }
          ],
          status: { $in: ['pending', 'confirmed'] },
          checkinDate: { $lte: checkoutDateTime },
          checkoutDate: { $gte: checkinDateTime }
        });

        if (existingBooking) {
          return res.status(400).json({
            success: false,
            message: `Cannot book both properties - ${existingBooking.parcel} is already booked for these dates`
          });
        }
      } else {
        // Check if this specific parcel is booked OR if both properties are booked
        existingBooking = await Booking.findOne({
          $or: [
            { parcel: parcel },
            { parcel: 'Both Properties' }
          ],
          status: { $in: ['pending', 'confirmed'] },
          checkinDate: { $lte: checkoutDateTime },
          checkoutDate: { $gte: checkinDateTime }
        });

        if (existingBooking) {
          return res.status(400).json({
            success: false,
            message: existingBooking.parcel === 'Both Properties'
              ? 'These dates are booked - both properties are reserved'
              : 'These dates are already booked for this parcel'
          });
        }
      }

      // Create new booking
      const booking = new Booking({
        customerName,
        email,
        phone,
        parcel,
        checkinDate: checkinDateTime,
        checkoutDate: checkoutDateTime,
        numHunters,
        gameSpecies,
        coyoteHuntingType,
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
        paypalTransactionId,
        notes,
        discountCode,
        discountPercent,
        originalPrice,
        status: 'confirmed',
        waiverSigned: false
      });

      await booking.save();

      // Update customer lifetime spend (for loyalty tracking)
      try {
        const User = require('../models/user');
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && totalPrice > 0) {
          user.lifetimeSpend = (user.lifetimeSpend || 0) + totalPrice;

          // Auto-update loyalty tier based on spend
          if (user.lifetimeSpend >= 5000) {
            user.loyaltyTier = 'platinum';
          } else if (user.lifetimeSpend >= 3000) {
            user.loyaltyTier = 'gold';
          } else if (user.lifetimeSpend >= 2000) {
            user.loyaltyTier = 'silver';
          } else if (user.lifetimeSpend >= 1000) {
            user.loyaltyTier = 'bronze';
          }

          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                lifetimeSpend: user.lifetimeSpend,
                loyaltyTier: user.loyaltyTier
              }
            }
          );

          console.log(`Updated ${email} lifetime spend: $${user.lifetimeSpend} (${user.loyaltyTier} tier)`);
        }
      } catch (spendError) {
        console.error('Error updating customer spend:', spendError);
        // Don't fail the booking if spend tracking fails
      }

      // Create automatic game rest periods
      await createGameRestPeriods(booking);

      // Send booking confirmation email
      try {
        await sendBookingConfirmation(booking);
        console.log('Booking confirmation emails sent successfully');
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
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

  // Submit waiver for booking
  submitWaiver: async (req, res) => {
    try {
      const Waiver = require('../models/waiver');
      const {
        bookingId,
        hunterName,
        email,
        phone,
        huntDate,
        property,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicense,
        signature,
        signedAt,
        userAgent
      } = req.body;

      // Create waiver document
      const waiverData = {
        bookingId: bookingId || null,
        hunterName: hunterName || req.body.participantName,
        email: email || req.body.participantEmail,
        phone: phone || req.body.participantPhone,
        huntDate: huntDate ? new Date(huntDate) : new Date(),
        property: property || 'Prairie Peace',
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicense,
        signature,
        signedAt: signedAt ? new Date(signedAt) : new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: userAgent || req.headers['user-agent']
      };

      const waiver = new Waiver(waiverData);
      await waiver.save();

      // If bookingId provided, update the booking
      let booking = null;
      if (bookingId) {
        booking = await Booking.findById(bookingId);

        if (booking) {
          booking.waiverSigned = true;
          booking.waiverSignedDate = waiver.signedAt;
          booking.vehicleMake = vehicleMake || booking.vehicleMake;
          booking.vehicleModel = vehicleModel || booking.vehicleModel;
          booking.vehicleColor = vehicleColor || booking.vehicleColor;
          booking.vehicleLicense = vehicleLicense || booking.vehicleLicense;
          await booking.save();

          // Send waiver confirmation email if booking exists
          try {
            await sendWaiverConfirmation(booking);
            console.log('Waiver confirmation emails sent successfully');
          } catch (emailError) {
            console.error('Failed to send waiver confirmation email:', emailError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Waiver submitted successfully',
        waiver: {
          _id: waiver._id,
          hunterName: waiver.hunterName,
          huntDate: waiver.huntDate,
          property: waiver.property,
          status: waiver.status
        },
        booking: booking ? {
          _id: booking._id,
          parcel: booking.parcel,
          waiverSigned: booking.waiverSigned
        } : null
      });
    } catch (error) {
      console.error('Error submitting waiver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit waiver'
      });
    }
  },

  // Get all bookings (admin only)
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

  // Get user's own bookings (customer)
  getMyBookings: async (req, res) => {
    try {
      const userEmail = req.user.email;

      // Find all bookings with this user's email
      const bookings = await Booking.find({
        email: userEmail
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your bookings'
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

  // Get game rest dates for calendar
  getGameRestDates: async (req, res) => {
    try {
      const gameRestPeriods = await GameRest.find({}).select('startDate endDate parcel');

      res.json({
        success: true,
        gameRestPeriods
      });
    } catch (error) {
      console.error('Error fetching game rest dates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch game rest dates'
      });
    }
  },

  // Get single booking by ID
  // Public endpoint for dash card - returns limited booking info
  getBookingInfo: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Return only data needed for dash card (no sensitive info)
      res.json({
        success: true,
        booking: {
          _id: booking._id,
          customerName: booking.customerName,
          parcel: booking.parcel,
          checkinDate: booking.checkinDate,
          checkoutDate: booking.checkoutDate,
          waiverData: booking.waiverData ? {
            vehicleMake: booking.waiverData.vehicleMake,
            vehicleModel: booking.waiverData.vehicleModel,
            vehicleColor: booking.waiverData.vehicleColor
          } : null
        }
      });
    } catch (error) {
      console.error('Error fetching booking info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking info'
      });
    }
  },

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
        message: 'Failed to update booking',
        error: error.message
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
      const waiversSigned = await Booking.countDocuments({ waiverSigned: true });

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
          waiversSigned,
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
  },

  // Resend confirmation email
  resendConfirmation: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Send appropriate confirmation based on waiver status
      if (booking.waiverSigned) {
        await sendWaiverConfirmation(booking);
      } else {
        await sendBookingConfirmation(booking);
      }

      res.json({
        success: true,
        message: 'Confirmation email resent successfully'
      });
    } catch (error) {
      console.error('Error resending confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend confirmation email'
      });
    }
  },

  // Send waiver reminder email
  sendWaiverReminder: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Import waiver reminder email template
      const { getWaiverReminderEmail } = require('../email-templates/waiver-reminder-email');
      const nodemailer = require('nodemailer');

      // Create transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'hunting@m77ag.com',
          pass: process.env.EMAIL_PASS
        }
      });

      // Generate email HTML from template
      const emailHTML = getWaiverReminderEmail(booking);

      // Send email to customer
      await transporter.sendMail({
        from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
        replyTo: 'hunting@m77ag.com',
        to: booking.email,
        subject: '⚠️ WAIVER REMINDER - Action Required for Your M77 AG Hunting Reservation',
        html: emailHTML
      });

      console.log('Waiver reminder email sent to:', booking.email);

      res.json({
        success: true,
        message: 'Waiver reminder email sent successfully'
      });
    } catch (error) {
      console.error('Error sending waiver reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send waiver reminder email'
      });
    }
  },

  // Submit game rest request
  submitGameRestRequest: async (req, res) => {
    try {
      const { name, email, phone, notes, date, property } = req.body;

      if (!name || !email || !phone || !date || !property) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Send email notification to admin
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'hunting@m77ag.com',
        subject: `Game Rest Move Request - ${property} - ${formattedDate}`,
        html: `
          <h2>Game Rest Period Move Request</h2>
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <hr>
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <hr>
          <p>Please contact this customer within 24 hours to discuss moving the game rest period.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: 'Game rest move request submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting game rest request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit game rest request'
      });
    }
  },

  // Get current user's bookings
  getMyBookings: async (req, res) => {
    try {
      const Booking = require('../models/booking');
      const User = require('../models/user');

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find bookings by email or userId
      const bookings = await Booking.find({
        $or: [
          { email: user.email },
          { userId: user._id }
        ]
      }).sort({ checkinDate: -1 });

      res.json({
        success: true,
        bookings
      });

    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings'
      });
    }
  },

  // Search for customer by name or email (for manual booking creation)
  searchCustomer: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 3) {
        return res.json({
          success: true,
          customers: []
        });
      }

      const Booking = require('../models/booking');

      // Search bookings by customer name or email
      const bookings = await Booking.find({
        $or: [
          { customerName: new RegExp(query, 'i') },
          { email: new RegExp(query, 'i') }
        ]
      }).sort({ createdAt: -1 }).limit(10);

      // Get unique customers
      const customersMap = new Map();
      bookings.forEach(booking => {
        const key = booking.email.toLowerCase();
        if (!customersMap.has(key)) {
          customersMap.set(key, {
            name: booking.customerName,
            email: booking.email,
            phone: booking.phone,
            lastBooking: booking.createdAt
          });
        }
      });

      const customers = Array.from(customersMap.values());

      res.json({
        success: true,
        customers
      });

    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search customers'
      });
    }
  },

  // Admin: Create manual booking (for phone/offline bookings)
  createManualBooking: async (req, res) => {
    try {
      const {
        customerName,
        email,
        phone,
        parcel,
        checkinDate,
        checkoutDate,
        numHunters,
        gameSpecies,
        totalPrice,
        paymentMethod,
        paymentStatus,
        notes
      } = req.body;

      // Create dates at noon local time
      const checkinDateTime = new Date(checkinDate);
      checkinDateTime.setHours(12, 0, 0, 0);

      const checkoutDateTime = new Date(checkoutDate);
      checkoutDateTime.setHours(12, 0, 0, 0);

      // Calculate days
      const numNights = Math.ceil((checkoutDateTime - checkinDateTime) / 86400000);
      const dailyRate = parcel === 'Both Properties' ? 300 : 200;

      // Check if dates are available
      let existingBooking;
      if (parcel === 'Both Properties') {
        existingBooking = await Booking.findOne({
          $or: [
            { parcel: 'Heritage Farm' },
            { parcel: 'Prairie Peace' },
            { parcel: 'Both Properties' }
          ],
          status: { $in: ['pending', 'confirmed'] },
          checkinDate: { $lte: checkoutDateTime },
          checkoutDate: { $gte: checkinDateTime }
        });
      } else {
        existingBooking = await Booking.findOne({
          $or: [
            { parcel: parcel },
            { parcel: 'Both Properties' }
          ],
          status: { $in: ['pending', 'confirmed'] },
          checkinDate: { $lte: checkoutDateTime },
          checkoutDate: { $gte: checkinDateTime }
        });
      }

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: `These dates are already booked (${existingBooking.parcel})`
        });
      }

      // Create booking
      const booking = new Booking({
        customerName,
        email: email.toLowerCase(),
        phone,
        parcel,
        checkinDate: checkinDateTime,
        checkoutDate: checkoutDateTime,
        numHunters: numHunters || 1,
        gameSpecies: gameSpecies || 'Pheasant',
        dailyRate,
        numNights,
        campingFee: 0,
        totalPrice: totalPrice || (dailyRate * numNights),
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: paymentStatus || 'paid',
        status: 'confirmed',
        waiverSigned: false,
        notes: notes || 'Manual booking created by admin'
      });

      await booking.save();

      // Update customer spend
      try {
        const User = require('../models/user');
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && booking.totalPrice > 0) {
          user.lifetimeSpend = (user.lifetimeSpend || 0) + booking.totalPrice;

          if (user.lifetimeSpend >= 5000) user.loyaltyTier = 'platinum';
          else if (user.lifetimeSpend >= 3000) user.loyaltyTier = 'gold';
          else if (user.lifetimeSpend >= 2000) user.loyaltyTier = 'silver';
          else if (user.lifetimeSpend >= 1000) user.loyaltyTier = 'bronze';

          await User.updateOne(
            { _id: user._id },
            { $set: { lifetimeSpend: user.lifetimeSpend, loyaltyTier: user.loyaltyTier } }
          );
        }
      } catch (spendError) {
        console.error('Error updating spend:', spendError);
      }

      // Send confirmation email
      try {
        await sendBookingConfirmation(booking);
        console.log('Confirmation email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Manual booking created successfully',
        booking
      });

    } catch (error) {
      console.error('Error creating manual booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create manual booking: ' + error.message
      });
    }
  },

  // Admin: Recalculate customer lifetime spend
  recalculateCustomerSpend: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const User = require('../models/user');

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user account found for this email'
        });
      }

      // Find all paid bookings for this email
      const bookings = await Booking.find({
        email: email.toLowerCase(),
        paymentStatus: { $in: ['paid', 'paid_in_full', 'complimentary'] }
      });

      // Calculate total spend
      let totalSpend = 0;
      const bookingDetails = [];

      bookings.forEach(booking => {
        const amount = booking.totalPrice || 0;
        totalSpend += amount;
        bookingDetails.push({
          date: booking.checkinDate,
          amount: amount,
          property: booking.parcel
        });
      });

      // Determine loyalty tier
      let tier = 'none';
      if (totalSpend >= 5000) tier = 'platinum';
      else if (totalSpend >= 3000) tier = 'gold';
      else if (totalSpend >= 2000) tier = 'silver';
      else if (totalSpend >= 1000) tier = 'bronze';

      // Update user
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            lifetimeSpend: totalSpend,
            loyaltyTier: tier
          }
        }
      );

      console.log(`Updated ${email} - Lifetime Spend: $${totalSpend}, Tier: ${tier}`);

      res.json({
        success: true,
        message: 'Customer lifetime spend recalculated successfully',
        customer: {
          name: user.name,
          email: user.email,
          lifetimeSpend: totalSpend,
          loyaltyTier: tier,
          bookingsCount: bookings.length,
          bookings: bookingDetails
        }
      });

    } catch (error) {
      console.error('Error recalculating customer spend:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate customer spend: ' + error.message
      });
    }
  }
};

module.exports = bookingController;