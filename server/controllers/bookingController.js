const Booking = require('../models/booking');
const GameRest = require('../models/gameRest');
const {
  sendBookingConfirmation,
  sendWaiverConfirmation,
  sendWaiverReminder: sendWaiverReminderEmail,
  sendStandaloneWaiverConfirmation,
  sendHuntingEmail,
  HUNTING_NOTIFICATION_RECIPIENTS
} = require('../utils/emailservice');

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

// A booking or game rest period that overlaps the requested days on this
// property. "Both Properties" overlaps everything. Returns a message, or null
// when the days are open.
async function findConflict(parcel, checkinDateTime, checkoutDateTime) {
  const parcels = parcel === 'Both Properties'
    ? ['Heritage Farm', 'Prairie Peace', 'Both Properties']
    : [parcel, 'Both Properties'];
  const existing = await Booking.findOne({
    parcel: { $in: parcels },
    status: { $in: ['pending', 'confirmed'] },
    checkinDate: { $lte: checkoutDateTime },
    checkoutDate: { $gte: checkinDateTime }
  });
  if (existing) {
    if (parcel === 'Both Properties') return `Cannot book both properties - ${existing.parcel} is already booked for these dates`;
    return existing.parcel === 'Both Properties'
      ? 'These dates are booked - both properties are reserved'
      : 'These dates are already booked for this property';
  }
  // Rest periods run from noon to the end of the day.
  const dayStart = new Date(checkinDateTime); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(checkoutDateTime); dayEnd.setHours(23, 59, 59, 999);
  const rest = await GameRest.findOne({
    parcel: { $in: parcels },
    startDate: { $lte: dayEnd },
    endDate: { $gte: dayStart }
  });
  if (rest) return `${rest.parcel} is resting the game on ${new Date(rest.startDate).toDateString()}. Choose other dates or request a change.`;
  return null;
}

// Noon on the given calendar day, so the stored date never shifts a day.
function noonOf(value) {
  const d = new Date(value);
  d.setHours(12, 0, 0, 0);
  return d;
}

const BOOKABLE_PARCELS = ['Heritage Farm', 'Prairie Peace', 'Both Properties'];
const CAMPERS = require('../data/campers');

// Camper stay for a hunt. Guests arrive on the first hunt day and leave on the
// last, so the camper runs one night less than the hunt days and the
// departure day is open for the next guest. Returns { stay } priced from
// server/data/campers.js, { error }, or {} when no camper was chosen;
// conflict names an existing stay on overlapping nights.
async function camperStay({ camper, checkinDate, checkoutDate, start, end }, excludeId) {
  if (!camper) return {};
  const unit = CAMPERS.find(c => c.id === camper);
  if (!unit) return { error: 'Unknown camper' };
  const arrival = checkinDate || start;
  const departure = checkoutDate || end;
  if (!arrival || !departure || isNaN(new Date(arrival)) || isNaN(new Date(departure))) {
    return { error: 'Hunt dates are required for a camper' };
  }
  const checkin = noonOf(arrival);
  const checkout = noonOf(departure);
  const nights = Math.round((checkout - checkin) / 86400000);
  if (nights + 1 < CAMPERS.minHuntDays) {
    return { error: `A camper is available with a hunt of ${CAMPERS.minHuntDays} or more days` };
  }
  const existing = await Booking.findOne({
    camper,
    status: { $in: ['pending', 'confirmed'] },
    camperCheckin: { $lt: checkout },
    camperCheckout: { $gt: checkin },
    ...(excludeId ? { _id: { $ne: excludeId } } : {})
  });
  return {
    stay: {
      camper,
      camperCheckin: checkin,
      camperCheckout: checkout,
      camperNights: nights,
      camperFee: nights * unit.nightlyRate,
      camperCleaningFee: unit.cleaningFee
    },
    conflict: existing
      ? `${camper} is taken ${new Date(existing.camperCheckin).toDateString()} to ${new Date(existing.camperCheckout).toDateString()}`
      : null
  };
}

const clip = (v, n) => (v === undefined || v === null ? undefined : String(v).slice(0, n));
const escHtml = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Log a booking or pass that did not go through and tell the hunting mailbox,
// at most once an hour per customer email. Never throws.
async function recordAttempt(req, stage, message, data = {}) {
  try {
    const BookingAttempt = require('../models/bookingAttempt');
    const validDate = v => (v && !isNaN(new Date(v)) ? new Date(v) : undefined);
    const email = clip(data.email, 160);
    const attempt = await BookingAttempt.create({
      kind: data.kind === 'season-pass' ? 'season-pass' : 'booking',
      stage,
      message: clip(message, 500),
      customerName: clip(data.customerName || data.name, 120),
      email,
      phone: clip(data.phone, 40),
      parcel: clip(data.parcel, 40),
      checkinDate: validDate(data.checkinDate),
      checkoutDate: validDate(data.checkoutDate),
      passType: clip(data.passType, 20),
      totalPrice: Number.isFinite(Number(data.totalPrice)) ? Number(data.totalPrice) : undefined,
      paymentMethod: clip(data.paymentMethod, 30),
      paymentReference: clip(data.paymentReference || data.paypalTransactionId, 80),
      userAgent: clip(req.headers['user-agent'], 300)
    });

    const recent = email ? await BookingAttempt.countDocuments({
      email: email.toLowerCase(), _id: { $ne: attempt._id }, createdAt: { $gte: new Date(Date.now() - 3600000) }
    }) : 0;
    if (!recent) {
      // Not awaited: the customer's request never waits on mail.
      const dates = attempt.checkinDate
        ? `${attempt.checkinDate.toDateString()}${attempt.checkoutDate ? ' to ' + attempt.checkoutDate.toDateString() : ''}`
        : '';
      sendHuntingEmail({
        to: HUNTING_NOTIFICATION_RECIPIENTS,
        subject: `${attempt.paymentReference ? 'PAID - ' : ''}Hunting ${attempt.kind === 'season-pass' ? 'season pass' : 'booking'} did not go through: ${attempt.customerName || attempt.email || 'unknown customer'}`,
        html: `<p>A hunting ${attempt.kind === 'season-pass' ? 'season pass purchase' : 'booking'} on m77ag.com did not go through.</p>
          <p><strong>Reason:</strong> ${escHtml(attempt.message)}</p>
          <p><strong>Customer:</strong> ${escHtml(attempt.customerName)}<br>
          <strong>Email:</strong> ${escHtml(attempt.email)}<br>
          <strong>Phone:</strong> ${escHtml(attempt.phone)}<br>
          ${attempt.parcel ? `<strong>Property:</strong> ${escHtml(attempt.parcel)}<br>` : ''}
          ${dates ? `<strong>Dates:</strong> ${escHtml(dates)}<br>` : ''}
          ${attempt.passType ? `<strong>Pass:</strong> ${escHtml(attempt.passType)}<br>` : ''}
          ${attempt.totalPrice !== undefined ? `<strong>Amount:</strong> $${escHtml(attempt.totalPrice)}<br>` : ''}
          ${attempt.paymentReference ? `<strong>Payment reference:</strong> ${escHtml(attempt.paymentReference)} (payment was taken)` : ''}</p>
          <p>Failed attempts are listed on the Hunting Bookings admin page.</p>`
      }).catch(e => console.error('Failed to email booking attempt notice:', e.message));
    }
  } catch (e) {
    console.error('Failed to record booking attempt:', e.message);
  }
}

const bookingController = {
  // Public: the customer's browser reports a booking or pass it could not
  // complete (network failure, payment taken but not recorded).
  reportAttempt: async (req, res) => {
    const b = req.body || {};
    await recordAttempt(req, 'client', b.message || 'Browser could not complete the request', b);
    res.json({ success: true });
  },

  // Admin: failed attempts, newest first.
  getAttempts: async (req, res) => {
    try {
      const BookingAttempt = require('../models/bookingAttempt');
      const filter = req.query.all === 'true' ? {} : { resolved: false };
      const attempts = await BookingAttempt.find(filter).sort({ createdAt: -1 }).limit(200).lean();
      res.json({ success: true, attempts });
    } catch (error) {
      console.error('Error loading booking attempts:', error);
      res.status(500).json({ success: false, message: 'Failed to load attempts' });
    }
  },

  // Admin: mark an attempt handled.
  resolveAttempt: async (req, res) => {
    try {
      const BookingAttempt = require('../models/bookingAttempt');
      const attempt = await BookingAttempt.findByIdAndUpdate(req.params.id,
        { $set: { resolved: true, resolvedNote: clip(req.body && req.body.note, 500) } }, { new: true });
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
      res.json({ success: true, attempt });
    } catch (error) {
      console.error('Error resolving booking attempt:', error);
      res.status(500).json({ success: false, message: 'Failed to update attempt' });
    }
  },

  // Public: campers, their rates and the nights already taken.
  getCampers: async (req, res) => {
    try {
      const since = new Date(); since.setDate(since.getDate() - 1);
      const stays = await Booking.find({
        camper: { $in: CAMPERS.map(c => c.id) },
        status: { $in: ['pending', 'confirmed'] },
        camperCheckout: { $gte: since }
      }).select('camper camperCheckin camperCheckout').sort({ camperCheckin: 1 }).lean();
      res.json({
        success: true,
        campers: CAMPERS,
        minHuntDays: CAMPERS.minHuntDays,
        stays: stays.map(s => ({ camper: s.camper, checkin: s.camperCheckin, checkout: s.camperCheckout }))
      });
    } catch (error) {
      console.error('Error loading campers:', error);
      res.status(500).json({ success: false, message: 'Failed to load campers' });
    }
  },

  // Public: are these days open on this property?
  checkAvailability: async (req, res) => {
    try {
      const { parcel, start, end } = req.query;
      if (!BOOKABLE_PARCELS.includes(parcel) || !start || !end || isNaN(new Date(start)) || isNaN(new Date(end))) {
        return res.status(400).json({ success: false, message: 'Property, start date and end date are required' });
      }
      if (noonOf(end) < noonOf(start)) {
        return res.status(400).json({ success: false, message: 'End date is before the start date' });
      }
      const camper = await camperStay({ camper: req.query.camper, start, end });
      if (camper.error) return res.status(400).json({ success: false, message: camper.error });
      const conflict = await findConflict(parcel, noonOf(start), noonOf(end)) || camper.conflict;
      res.json({ success: true, available: !conflict, message: conflict || 'Available' });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ success: false, message: 'Failed to check availability' });
    }
  },

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

      if (!customerName || !email || !phone || !BOOKABLE_PARCELS.includes(parcel) ||
          !checkinDate || !checkoutDate || isNaN(new Date(checkinDate)) || isNaN(new Date(checkoutDate))) {
        const message = 'Name, email, phone, property and dates are required';
        await recordAttempt(req, 'rejected', message, req.body);
        return res.status(400).json({ success: false, message });
      }

      // Create dates at noon local time to avoid timezone issues
      const checkinDateTime = noonOf(checkinDate);
      const checkoutDateTime = noonOf(checkoutDate);
      if (checkoutDateTime < checkinDateTime) {
        await recordAttempt(req, 'rejected', 'End date is before the start date', req.body);
        return res.status(400).json({ success: false, message: 'End date is before the start date' });
      }

      const camper = await camperStay(req.body);
      if (camper.error) {
        await recordAttempt(req, 'rejected', camper.error, req.body);
        return res.status(400).json({ success: false, message: camper.error });
      }

      // A paid booking is always recorded, even if the days filled while the
      // customer was paying; the office sorts out the dates.
      const conflict = await findConflict(parcel, checkinDateTime, checkoutDateTime) || camper.conflict || null;
      const alreadyPaid = paymentStatus === 'paid' && paypalTransactionId;
      if (conflict && !alreadyPaid) {
        await recordAttempt(req, 'rejected', conflict, req.body);
        return res.status(400).json({ success: false, message: conflict });
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
        notes: conflict ? [notes, `Date conflict when paid: ${conflict}`].filter(Boolean).join(' | ') : notes,
        discountCode,
        discountPercent,
        originalPrice,
        ...(camper.stay || {}),
        status: 'confirmed',
        waiverSigned: false
      });

      await booking.save();
      if (conflict) {
        await recordAttempt(req, 'rejected', `Paid booking saved on dates already taken (${conflict}). Move or refund it.`,
          { ...req.body, paymentReference: paypalTransactionId });
      }

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

      // Answer the customer now; mail goes out after, so a slow or failing
      // mail server never holds up the booking.
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking
      });

      (async () => {
        try {
          await sendBookingConfirmation(booking);
          console.log('Booking confirmation emails sent successfully');
        } catch (emailError) {
          console.error('Failed to send booking confirmation email:', emailError);
        }
        // Send a sign-in link to their customer card
        try {
          const { issueCardLink } = require('./customerPortalController');
          await issueCardLink({ email: booking.email, name: booking.customerName, issuedBy: 'booking confirmation' });
        } catch (linkError) {
          console.error('Failed to send customer card link:', linkError);
        }
      })();
      return;
    } catch (error) {
      console.error('Error creating booking:', error);
      await recordAttempt(req, 'error', 'Server error while saving: ' + error.message, req.body);
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
        huntEndDate,
        property,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicense,
        signature,
        signedAt,
        userAgent
      } = req.body;

      // A waiver signed from a booking takes the booking's hunt dates and
      // property, whatever the form sent.
      const linked = bookingId && require('mongoose').isValidObjectId(bookingId)
        ? await Booking.findById(bookingId)
        : null;
      const dayOf = v => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00Z') : (v ? new Date(v) : null));
      const start = linked ? linked.checkinDate : (dayOf(huntDate) || new Date());
      const end = linked ? linked.checkoutDate : (dayOf(huntEndDate) || start);

      // Create waiver document
      const waiverData = {
        bookingId: linked ? linked._id : null,
        hunterName: hunterName || req.body.participantName,
        email: email || req.body.participantEmail,
        phone: phone || req.body.participantPhone,
        huntDate: start,
        huntEndDate: end < start ? start : end,
        property: (linked && linked.parcel) || property || 'Prairie Peace',
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

      // If the waiver came from a booking, update the booking
      const booking = linked;
      if (booking) {
        booking.waiverSigned = true;
        booking.waiverSignedDate = waiver.signedAt;
        booking.vehicleMake = vehicleMake || booking.vehicleMake;
        booking.vehicleModel = vehicleModel || booking.vehicleModel;
        booking.vehicleColor = vehicleColor || booking.vehicleColor;
        booking.vehicleLicense = vehicleLicense || booking.vehicleLicense;
        await booking.save();

        // Send waiver confirmation email if booking exists (after the reply)
        sendWaiverConfirmation(booking)
          .then(() => console.log('Waiver confirmation emails sent successfully'))
          .catch(emailError => console.error('Failed to send waiver confirmation email:', emailError));
      }

      // A waiver signed without a booking belongs to a season pass holder or a
      // walk-up hunter. Send them the same dash card and property maps.
      if (!booking && waiver.email) {
        sendStandaloneWaiverConfirmation(waiver)
          .then(() => console.log('Waiver documents and maps sent to:', waiver.email))
          .catch(emailError => console.error('Failed to send standalone waiver documents:', emailError));
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
      // Full booking id, or the 8-character Booking ID printed in the
      // confirmation email (the last 8 characters of the id).
      const id = String(req.params.id || '').trim().toLowerCase();
      let booking = null;
      if (require('mongoose').isValidObjectId(id) && id.length === 24) {
        booking = await Booking.findById(id);
      } else if (/^[0-9a-f]{8}$/.test(id)) {
        const matches = await Booking.find({
          $expr: { $eq: [{ $substrCP: [{ $toString: '$_id' }, 16, 8] }, id] }
        }).limit(2);
        booking = matches.length === 1 ? matches[0] : null;
      }

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

      await sendWaiverReminderEmail(booking);

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

      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await sendHuntingEmail({
        to: HUNTING_NOTIFICATION_RECIPIENTS,
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
      });

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
  // Admin: customers matching a name, email or phone, from their customer
  // card (account), past bookings and signed waivers, newest details first.
  searchCustomer: async (req, res) => {
    try {
      const query = String(req.query.query || req.query.q || '').trim();
      if (query.length < 2) {
        return res.json({ success: true, customers: [] });
      }

      const User = require('../models/user');
      const Waiver = require('../models/waiver');
      const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const digits = query.replace(/\D/g, '');
      const phoneRx = digits.length >= 4 ? new RegExp(digits.split('').join('\\D*')) : null;
      const match = (nameField, emailField, phoneField) => ({
        $or: [{ [nameField]: rx }, { [emailField]: rx }, ...(phoneRx ? [{ [phoneField]: phoneRx }] : [])]
      });

      const [users, bookings, waivers] = await Promise.all([
        User.find({ role: 'customer', ...match('name', 'email', 'phone') })
          .select('name email phone seasonPass').limit(10).lean(),
        Booking.find(match('customerName', 'email', 'phone')).sort({ createdAt: -1 }).limit(20).lean(),
        Waiver.find(match('hunterName', 'email', 'phone')).sort({ signedAt: -1 }).limit(20).lean()
      ]);

      const customers = new Map();
      // The office's own addresses stand in on owner hunts; they are not customers.
      const OFFICE = ['hunting@m77ag.com', 'office@m77ag.com'];
      const entry = email => {
        const key = String(email || '').toLowerCase().trim();
        if (!key || OFFICE.includes(key)) return null;
        if (!customers.has(key)) customers.set(key, { email: key, sources: [] });
        return customers.get(key);
      };
      const fill = (c, name, phone) => {
        if (!c.name && name) c.name = name;
        if (!c.phone && phone) c.phone = phone;
      };

      for (const u of users) {
        const c = entry(u.email); if (!c) continue;
        fill(c, u.name, u.phone);
        c.sources.push('customer card');
        const sp = u.seasonPass;
        if (sp && sp.active && !(sp.expiresAt && new Date(sp.expiresAt) < new Date())) {
          c.seasonPass = { type: sp.type, creditsRemaining: sp.creditsRemaining };
        }
      }
      for (const b of bookings) {
        const c = entry(b.email); if (!c) continue;
        fill(c, b.customerName, b.phone);
        if (!c.lastHunt) c.lastHunt = { date: b.checkinDate, parcel: b.parcel };
        if (!c.sources.includes('bookings')) c.sources.push('bookings');
      }
      for (const w of waivers) {
        const c = entry(w.email); if (!c) continue;
        fill(c, w.hunterName, w.phone);
        if (!c.sources.includes('waiver')) c.sources.push('waiver');
      }

      res.json({ success: true, customers: Array.from(customers.values()).slice(0, 10) });
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
        coyoteHuntingType,
        totalPrice,
        paymentMethod,
        paymentStatus,
        paymentReference,
        useSeasonPassCredits,
        notes
      } = req.body;

      if (!customerName || !email || !parcel || !checkinDate || !checkoutDate) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, email, property, check-in and check-out are required'
        });
      }

      // Create dates at noon local time
      const checkinDateTime = new Date(checkinDate);
      checkinDateTime.setHours(12, 0, 0, 0);

      const checkoutDateTime = new Date(checkoutDate);
      checkoutDateTime.setHours(12, 0, 0, 0);

      // checkoutDate is the last hunt day, as on the public booking page and
      // the calendar, so a one-day hunt blocks one day.
      if (checkoutDateTime < checkinDateTime) {
        return res.status(400).json({
          success: false,
          message: 'The last hunt day is before the first'
        });
      }

      // Hunt days, first through last inclusive
      const numNights = Math.round((checkoutDateTime - checkinDateTime) / 86400000) + 1;
      const dailyRate = parcel === 'Both Properties' ? 300 : 200;

      // A season pass hunt draws one credit per day. Verify the pass covers the
      // stay before the booking is written so credits and bookings stay in step.
      const User = require('../models/user');
      let passHolder = null;

      if (useSeasonPassCredits) {
        passHolder = await User.findOne({ email: email.toLowerCase() });

        if (!passHolder || !passHolder.seasonPass || !passHolder.seasonPass.active) {
          return res.status(400).json({
            success: false,
            message: 'No active season pass found for this email. Record the pass under Season Passes first.'
          });
        }

        if (passHolder.seasonPass.expiresAt && new Date(passHolder.seasonPass.expiresAt) < checkinDateTime) {
          return res.status(400).json({
            success: false,
            message: 'The season pass expires before these hunt dates'
          });
        }

        if (passHolder.seasonPass.creditsRemaining < numNights) {
          return res.status(400).json({
            success: false,
            message: `This hunt needs ${numNights} credit(s) but only ${passHolder.seasonPass.creditsRemaining} remain on the pass`
          });
        }
      }

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

      const camper = await camperStay(req.body);
      if (camper.error || camper.conflict) {
        return res.status(400).json({ success: false, message: camper.error || camper.conflict });
      }
      const camperCharges = camper.stay ? camper.stay.camperFee + camper.stay.camperCleaningFee : 0;

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
        coyoteHuntingType,
        dailyRate: useSeasonPassCredits ? 0 : dailyRate,
        numNights,
        campingFee: 0,
        ...(camper.stay || {}),
        // A season pass covers hunting days only; the camper is still charged.
        totalPrice: useSeasonPassCredits ? camperCharges : (totalPrice || (dailyRate * numNights + camperCharges)),
        paymentMethod: useSeasonPassCredits ? 'season-pass' : (paymentMethod || 'cash'),
        paymentStatus: useSeasonPassCredits
          ? (camperCharges > 0 ? (paymentStatus || 'pending') : 'paid')
          : (paymentStatus || 'paid'),
        paypalTransactionId: paymentReference,
        status: 'confirmed',
        waiverSigned: false,
        notes: notes || 'Manual booking created by admin'
      });

      await booking.save();

      // Draw the season pass credits now that the booking exists
      let creditsRemaining = null;
      if (passHolder) {
        passHolder.seasonPass.creditsRemaining -= numNights;
        passHolder.seasonPass.bookingIds.push(booking._id);
        await passHolder.save();
        creditsRemaining = passHolder.seasonPass.creditsRemaining;
        console.log(`Season pass: drew ${numNights} credit(s) from ${email}, ${creditsRemaining} remaining`);
      }

      // Update customer spend
      try {
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

      // Send a sign-in link to their customer card
      try {
        const { issueCardLink } = require('./customerPortalController');
        await issueCardLink({ email: booking.email, name: booking.customerName, issuedBy: 'manual booking' });
      } catch (linkError) {
        console.error('Failed to send customer card link:', linkError);
      }

      res.status(201).json({
        success: true,
        message: 'Manual booking created successfully',
        creditsRemaining,
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

bookingController.recordAttempt = recordAttempt;

module.exports = bookingController;