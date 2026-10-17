// Hunts booked outside the website, recorded once at startup so the dates
// block on the calendar. Dates are hunt days, first through last inclusive.
// No confirmation emails are sent; use Resend Confirmation on the Hunting
// Bookings admin page to send one.
module.exports = [
  {
    key: 'hunt-2026-11-14-mcconnell-opener',
    booking: {
      customerName: 'McConnell family (owner hunt)',
      email: 'hunting@m77ag.com',
      phone: '970-571-1015',
      parcel: 'Heritage Farm',
      checkinDate: '2026-11-14T12:00:00Z',
      checkoutDate: '2026-11-15T12:00:00Z',
      numHunters: 1,
      gameSpecies: 'Pheasant',
      dailyRate: 0,
      numNights: 2,
      totalPrice: 0,
      paymentMethod: 'complimentary',
      paymentStatus: 'complimentary',
      notes: 'Pheasant opening weekend, McConnell family hunt (Kyle, Oct 17 2026).'
    }
  },
  {
    key: 'hunt-2026-11-21-don-burtis',
    // Returning customer: email and phone come from his last booking or account.
    contactFrom: /burtis/i,
    booking: {
      customerName: 'Don Burtis',
      parcel: 'Heritage Farm',
      checkinDate: '2026-11-21T12:00:00Z',
      checkoutDate: '2026-11-22T12:00:00Z',
      numHunters: 1,
      gameSpecies: 'Pheasant',
      dailyRate: 200,
      numNights: 2,
      totalPrice: 400,
      depositPaid: 200,
      balanceDue: 200,
      paymentMethod: 'venmo',
      paymentStatus: 'deposit_paid',
      notes: 'Weekend after the pheasant opener (Kyle, Oct 17 2026). Venmo Oct 10 2026: $196.10 received ($200 less the Venmo fee), covering one day. Confirm whether the second day ($200) is owed.'
    }
  },
  {
    key: 'hunt-2026-11-16-steve-diemand',
    // Season pass holder: contact from his account; the hunt draws one pass
    // day per hunt day. The camper is charged separately.
    contactFrom: /diemand/i,
    seasonPassDays: 5,
    booking: {
      customerName: 'Steve Diemand',
      parcel: 'Both Properties',
      checkinDate: '2026-11-16T12:00:00Z',
      checkoutDate: '2026-11-20T12:00:00Z',
      numHunters: 1,
      gameSpecies: 'Pheasant',
      dailyRate: 0,
      numNights: 5,
      camper: 'Camper 1',
      camperCheckin: '2026-11-16T12:00:00Z',
      camperCheckout: '2026-11-20T12:00:00Z',
      camperNights: 4,
      camperFee: 200,
      camperCleaningFee: 100,
      totalPrice: 300,
      paymentMethod: 'season-pass',
      paymentStatus: 'pending',
      seasonPassRedemption: true,
      creditsUsed: 5,
      notes: '5-day season pass, both properties (Kyle, Oct 17 2026). Camper 1, 4 nights at $50 plus $100 cleaning: $300 owed.'
    }
  }
];
