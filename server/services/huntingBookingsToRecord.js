const Booking = require('../models/booking');
const User = require('../models/user');
const AppliedUpdate = require('../models/appliedUpdate');
const ENTRIES = require('../data/huntingBookingsToRecord');

// Record each hunt in server/data/huntingBookingsToRecord.js once. A hunt
// whose days are already booked on that property is left alone and noted.
async function applyHuntingBookings() {
  const results = [];
  for (const e of ENTRIES) {
    if (await AppliedUpdate.findOne({ key: e.key }).lean()) continue;
    const b = { ...e.booking, checkinDate: new Date(e.booking.checkinDate), checkoutDate: new Date(e.booking.checkoutDate) };
    const summary = [];

    if (e.contactFrom && (!b.email || !b.phone)) {
      const past = await Booking.findOne({ customerName: e.contactFrom }).sort({ createdAt: -1 }).lean();
      const user = past ? null : await User.findOne({ name: e.contactFrom }).lean();
      const src = past || user;
      if (src) {
        b.email = b.email || src.email;
        b.phone = b.phone || src.phone;
        if (user) b.userId = user._id;
        summary.push(`contact from ${past ? 'booking ' + past._id : 'account ' + user._id}`);
      } else {
        b.email = b.email || 'hunting@m77ag.com';
        b.phone = b.phone || '970-774-3276';
        b.notes = [b.notes, 'Customer email and phone not on file; add them.'].join(' ');
        summary.push('no contact on file; office contact used');
      }
    }

    const parcels = b.parcel === 'Both Properties' ? ['Heritage Farm', 'Prairie Peace', 'Both Properties'] : [b.parcel, 'Both Properties'];
    const clash = await Booking.findOne({
      parcel: { $in: parcels },
      status: { $in: ['pending', 'confirmed'] },
      checkinDate: { $lte: b.checkoutDate },
      checkoutDate: { $gte: b.checkinDate }
    }).lean();
    if (clash) {
      summary.push(`not recorded: ${clash.parcel} already booked by ${clash.customerName} (${clash._id})`);
    } else {
      const saved = await Booking.create({ ...b, status: 'confirmed', waiverSigned: false });
      summary.push(`booked ${saved._id}`);
    }
    await AppliedUpdate.create({ key: e.key, summary });
    results.push(`${e.key}: ${summary.join('; ')}`);
  }
  return results;
}

module.exports = { applyHuntingBookings };
