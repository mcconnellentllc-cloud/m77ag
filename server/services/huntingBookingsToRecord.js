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

    // A correction to a hunt already recorded
    if (e.update) {
      const find = { ...e.update.find };
      if (find.checkinDate) find.checkinDate = new Date(find.checkinDate);
      const set = { ...e.update.set };
      ['checkinDate', 'checkoutDate', 'camperCheckin', 'camperCheckout'].forEach(k => { if (set[k]) set[k] = new Date(set[k]); });
      const r = await Booking.updateMany(find, { $set: set });
      const summary = [`${r.modifiedCount} booking(s) updated`];
      await AppliedUpdate.create({ key: e.key, summary });
      results.push(`${e.key}: ${summary[0]}`);
      continue;
    }
    const b = { ...e.booking, checkinDate: new Date(e.booking.checkinDate), checkoutDate: new Date(e.booking.checkoutDate) };
    if (b.camperCheckin) b.camperCheckin = new Date(b.camperCheckin);
    if (b.camperCheckout) b.camperCheckout = new Date(b.camperCheckout);
    const summary = [];
    let passHolder = null;

    if (e.contactFrom && (!b.email || !b.phone)) {
      const past = await Booking.findOne({ customerName: e.contactFrom }).sort({ createdAt: -1 }).lean();
      const user = past ? null : await User.findOne({ name: e.contactFrom }).lean();
      const src = past || user;
      if (e.seasonPassDays) passHolder = await User.findOne({ name: e.contactFrom, 'seasonPass.active': true });
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

    if (e.seasonPassDays) {
      const sp = passHolder && passHolder.seasonPass;
      if (!sp || (sp.creditsRemaining || 0) < e.seasonPassDays) {
        summary.push(`not recorded: no active season pass with ${e.seasonPassDays} days left for ${b.customerName}`);
        results.push(`${e.key}: ${summary.join('; ')}`);
        continue; // retried on the next start once the pass is on file
      }
      b.email = passHolder.email;
      b.phone = passHolder.phone || b.phone;
      b.userId = passHolder._id;
    }

    // The camper's nights must be open too.
    const camperClash = b.camper ? await Booking.findOne({
      camper: b.camper,
      status: { $in: ['pending', 'confirmed'] },
      camperCheckin: { $lt: b.camperCheckout },
      camperCheckout: { $gt: b.camperCheckin }
    }).lean() : null;

    const parcels = b.parcel === 'Both Properties' ? ['Heritage Farm', 'Prairie Peace', 'Both Properties'] : [b.parcel, 'Both Properties'];
    const clash = await Booking.findOne({
      parcel: { $in: parcels },
      status: { $in: ['pending', 'confirmed'] },
      checkinDate: { $lte: b.checkoutDate },
      checkoutDate: { $gte: b.checkinDate }
    }).lean();
    if (clash) {
      summary.push(`not recorded: ${clash.parcel} already booked by ${clash.customerName} (${clash._id})`);
    } else if (camperClash) {
      summary.push(`not recorded: ${b.camper} already taken by ${camperClash.customerName} (${camperClash._id})`);
    } else {
      const saved = await Booking.create({ ...b, status: 'confirmed', waiverSigned: false });
      summary.push(`booked ${saved._id}`);
      if (passHolder && e.seasonPassDays) {
        passHolder.seasonPass.creditsRemaining -= e.seasonPassDays;
        passHolder.seasonPass.bookingIds.push(saved._id);
        await passHolder.save();
        summary.push(`${e.seasonPassDays} pass days drawn, ${passHolder.seasonPass.creditsRemaining} left`);
      }
    }
    await AppliedUpdate.create({ key: e.key, summary });
    results.push(`${e.key}: ${summary.join('; ')}`);
  }
  return results;
}

module.exports = { applyHuntingBookings };
