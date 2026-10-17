const mongoose = require('mongoose');

// A hunting booking or season pass purchase that did not go through: refused
// by the server, failed on the server, or failed in the customer's browser.
// Kept so the office can follow up, especially when a payment was taken.
const bookingAttemptSchema = new mongoose.Schema({
  kind: { type: String, enum: ['booking', 'season-pass'], default: 'booking' },
  // rejected: the server refused it (dates taken, missing details)
  // error: the server failed while saving it
  // client: the customer's browser could not complete it
  stage: { type: String, enum: ['rejected', 'error', 'client'], required: true },
  message: { type: String, maxlength: 500 },
  customerName: { type: String, maxlength: 120 },
  email: { type: String, maxlength: 160, lowercase: true, trim: true },
  phone: { type: String, maxlength: 40 },
  parcel: { type: String, maxlength: 40 },
  checkinDate: Date,
  checkoutDate: Date,
  passType: { type: String, maxlength: 20 },
  totalPrice: Number,
  paymentMethod: { type: String, maxlength: 30 },
  // PayPal order or transaction id when money was taken
  paymentReference: { type: String, maxlength: 80 },
  userAgent: { type: String, maxlength: 300 },
  resolved: { type: Boolean, default: false },
  resolvedNote: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

bookingAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BookingAttempt', bookingAttemptSchema);
