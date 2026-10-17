// Campers guests can stay in during a hunt. Each sits on a gravel pad with
// electric and water hookups. Rates are charged per night plus one cleaning
// fee per stay (laundry and cleaning); hunting discount codes do not apply.
// Guests arrive on the first hunt day and leave on the last, so a stay runs
// one night less than the hunt, and a camper comes only with a hunt of at
// least minHuntDays days. Add septic to the amenities once it is in.
const campers = [
  {
    id: 'Camper 1',
    nightlyRate: 50,
    cleaningFee: 100,
    amenities: ['Starlink internet', 'TV', 'electric and water hookups', 'a gravel pad']
  },
  {
    id: 'Camper 2',
    nightlyRate: 50,
    cleaningFee: 100,
    amenities: ['Starlink internet', 'TV', 'electric and water hookups', 'a gravel pad']
  }
];

campers.minHuntDays = 2;

module.exports = campers;
