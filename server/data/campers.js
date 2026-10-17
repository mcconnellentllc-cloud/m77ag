// Campers guests can stay in during a hunt. Each sits on a gravel pad with
// electric and water hookups. Rates are charged per night plus one cleaning
// fee per stay (laundry and cleaning); hunting discount codes do not apply.
// Guests arrive on the first hunt day and leave on the last, so a stay runs
// one night less than the hunt, and a camper comes only with a hunt of at
// least minHuntDays days. Add septic, Starlink or TV service to the
// amenities once they are in.
const campers = [
  {
    id: 'Camper 1',
    nightlyRate: 50,
    cleaningFee: 100,
    amenities: ['electric and water hookups', 'a gravel pad'],
    description: 'Rockwood Signature Ultra Lite fifth wheel with a slide-out. Kitchen with stove, oven, microwave and refrigerator; bedroom; bunk room; bathroom with shower; dinette and sofa.',
    // public/images/campers/camper-1 (location data removed)
    photos: [
      { src: '/images/campers/camper-1/06.jpg', caption: 'Outside' },
      { src: '/images/campers/camper-1/07.jpg', caption: 'Kitchen and living area' },
      { src: '/images/campers/camper-1/01.jpg', caption: 'Kitchen' },
      { src: '/images/campers/camper-1/02.jpg', caption: 'Bedroom' },
      { src: '/images/campers/camper-1/08.jpg', caption: 'Bunk room' },
      { src: '/images/campers/camper-1/03.jpg', caption: 'Shower' },
      { src: '/images/campers/camper-1/09.jpg', caption: 'Bathroom' },
      { src: '/images/campers/camper-1/04.jpg', caption: 'Dinette' },
      { src: '/images/campers/camper-1/05.jpg', caption: 'Sofa' }
    ]
  },
  {
    id: 'Camper 2',
    nightlyRate: 50,
    cleaningFee: 100,
    amenities: ['electric and water hookups', 'a gravel pad']
  }
];

campers.minHuntDays = 2;

module.exports = campers;
