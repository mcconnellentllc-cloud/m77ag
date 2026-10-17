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
  }
];
