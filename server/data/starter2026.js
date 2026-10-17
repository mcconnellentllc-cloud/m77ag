// 2026 starter and planter products invoice, as sent by Kyle (Oct 17, 2026).
// UpShiftC+ was bought as 8,000 gallons; the invoice total is spread over the
// gallons logged on the 2026 corn and milo planting passes (Kyle). The other
// lines are not placed on fields until it is known how they were applied.
module.exports = {
  source: '2026 starter invoice (Meristem UPSHIFT C+ 8,000 gal x $6.40)',
  year: 2026,
  upshift: { name: 'UpShiftC', label: 'UpShiftC+ starter', gallons: 8000, pricePerGal: 6.40, total: 51200.00 },
  // Planter hopper lubricant, put on all the corn and milo (Kyle, Oct 17,
  // 2026): spread over the 2026 corn and milo acres.
  hopperThrottle: { label: 'Revline Hopper Throttle Rice', quantity: 3, price: 960.00, total: 2880.00 },
  // [product, quantity, price, total]. Sulfur 17 was applied separately
  // (fields to come); Guard X Prephyte use not yet known.
  notPlaced: [
    ['Sulfur 17', 500, 20.00, 10000.00],
    ['Guard X Prephyte', 5, 2400.00, 12000.00]
  ],
  // The ~2 lb/ac entries logged as UpShiftC were the zinc, which went on
  // everything (Kyle, Oct 17, 2026); not on this invoice, so not priced yet.
  zincName: 'Zinc (dry, logged as UpShiftC)'
};
