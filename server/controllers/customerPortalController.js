const jwt = require('jsonwebtoken');
const MagicLink = require('../models/magicLink');
const Booking = require('../models/booking');
const Waiver = require('../models/waiver');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const { sendCustomerCardLink } = require('../utils/emailservice');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SITE_URL = process.env.SITE_URL || 'https://m77ag.com';

// Session issued after a magic link is opened. Short enough that a shared
// device does not stay signed in, long enough to cover a hunting trip.
const CARD_SESSION_EXPIRES_IN = '7d';

const buildCardUrl = (token) => `${SITE_URL}/customer-card.html?token=${token}`;

// Issue a link for an email address and email it out. Returns the URL so
// callers that already send their own email can embed it instead.
const issueCardLink = async ({ email, name, issuedBy, sendEmail = true }) => {
  const { token, expiresAt } = await MagicLink.issue(email, { issuedBy });
  const url = buildCardUrl(token);

  if (sendEmail) {
    await sendCustomerCardLink({ email, name, url, expiresAt });
  }

  return { url, expiresAt };
};

const customerPortalController = {
  // Public: email a sign-in link. The response never reveals whether the
  // address is known, so the endpoint cannot be used to enumerate customers.
  requestLink: async (req, res) => {
    const genericResponse = {
      success: true,
      message: 'If that email address matches a booking or season pass, a sign-in link is on its way.'
    };

    try {
      const { email } = req.body;

      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid email address'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Only send to addresses we actually hold records for
      const [booking, user, waiver] = await Promise.all([
        Booking.findOne({ email: normalizedEmail }).select('customerName'),
        User.findOne({ email: normalizedEmail }).select('name'),
        Waiver.findOne({ email: normalizedEmail }).select('hunterName')
      ]);

      if (!booking && !user && !waiver) {
        console.log('Customer card link requested for unknown email:', normalizedEmail);
        return res.json(genericResponse);
      }

      const name = (user && user.name) || (booking && booking.customerName) || (waiver && waiver.hunterName);
      await issueCardLink({ email: normalizedEmail, name, issuedBy: 'customer request' });

      res.json(genericResponse);
    } catch (error) {
      console.error('Error issuing customer card link:', error);
      res.status(500).json({
        success: false,
        message: 'Could not send the sign-in link. Please try again or contact hunting@m77ag.com.'
      });
    }
  },

  // Public: exchange a link token for a short-lived card session
  redeemLink: async (req, res) => {
    try {
      const { token } = req.body;
      const email = await MagicLink.redeem(token);

      if (!email) {
        return res.status(401).json({
          success: false,
          message: 'This link has expired or already been replaced by a newer one. Request a new link below.'
        });
      }

      const sessionToken = jwt.sign(
        { email, scope: 'customer-card' },
        JWT_SECRET,
        { expiresIn: CARD_SESSION_EXPIRES_IN }
      );

      res.json({
        success: true,
        token: sessionToken
      });
    } catch (error) {
      console.error('Error redeeming customer card link:', error);
      res.status(500).json({
        success: false,
        message: 'Could not open your customer card. Please request a new link.'
      });
    }
  },

  // Everything held for the signed-in customer, keyed by their email address
  getCard: async (req, res) => {
    try {
      const email = req.customerEmail;

      const [user, bookings, waivers] = await Promise.all([
        User.findOne({ email }).select('name phone seasonPass loyaltyTier lifetimeSpend'),
        Booking.find({ email }).sort({ checkinDate: -1 }),
        Waiver.find({ email }).sort({ signedAt: -1 })
      ]);

      // Invoices are linked to a user account, so only look when one exists
      const invoices = user
        ? await Invoice.find({ customer: user._id }).sort({ issueDate: -1 })
        : [];

      const name = (user && user.name) || (bookings[0] && bookings[0].customerName) || 'Customer';

      res.json({
        success: true,
        customer: {
          name,
          email,
          phone: (user && user.phone) || (bookings[0] && bookings[0].phone) || '',
          loyaltyTier: (user && user.loyaltyTier) || null,
          lifetimeSpend: (user && user.lifetimeSpend) || 0
        },
        seasonPass: user && user.seasonPass && user.seasonPass.active ? user.seasonPass : null,
        bookings: bookings.map(b => ({
          _id: b._id,
          parcel: b.parcel,
          checkinDate: b.checkinDate,
          checkoutDate: b.checkoutDate,
          numHunters: b.numHunters,
          gameSpecies: b.gameSpecies,
          totalPrice: b.totalPrice,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          status: b.status,
          waiverSigned: b.waiverSigned,
          campingFee: b.campingFee,
          numNights: b.numNights
        })),
        waivers: waivers.map(w => ({
          _id: w._id,
          hunterName: w.hunterName,
          property: w.property,
          huntDate: w.huntDate,
          signedAt: w.signedAt,
          vehicleMake: w.vehicleMake,
          vehicleModel: w.vehicleModel,
          vehicleColor: w.vehicleColor,
          vehicleLicense: w.vehicleLicense
        })),
        invoices: invoices.map(i => ({
          _id: i._id,
          invoiceNumber: i.invoiceNumber,
          status: i.status,
          total: i.total,
          amountPaid: i.amountPaid,
          balanceDue: i.balanceDue,
          issueDate: i.issueDate,
          dueDate: i.dueDate
        }))
      });
    } catch (error) {
      console.error('Error loading customer card:', error);
      res.status(500).json({
        success: false,
        message: 'Could not load your customer card'
      });
    }
  },

  // Admin: email a customer their card link on request
  sendLinkToCustomer: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const [user, booking] = await Promise.all([
        User.findOne({ email: normalizedEmail }).select('name'),
        Booking.findOne({ email: normalizedEmail }).select('customerName')
      ]);

      const name = (user && user.name) || (booking && booking.customerName);

      await issueCardLink({
        email: normalizedEmail,
        name,
        issuedBy: (req.user && req.user.email) || 'admin'
      });

      res.json({
        success: true,
        message: `Customer card link sent to ${normalizedEmail}`
      });
    } catch (error) {
      console.error('Error sending customer card link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send the customer card link'
      });
    }
  }
};

// Middleware: accept only a card session token
const requireCardSession = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Sign in with the link emailed to you'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.scope !== 'customer-card' || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    req.customerEmail = payload.email.toLowerCase();
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Request a new link.'
    });
  }
};

module.exports = customerPortalController;
module.exports.requireCardSession = requireCardSession;
module.exports.issueCardLink = issueCardLink;
