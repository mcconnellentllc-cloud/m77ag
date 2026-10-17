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
  // Sulfur 17 went on all the corn and milo (Kyle, Oct 17, 2026); spread
  // over the corn and milo acres. On hold: shown on the cards, not billed or
  // counted, until hold is set to false.
  sulfur: { label: 'Sulfur 17', quantity: 500, price: 20.00, total: 10000.00, hold: true },
  // Guard X Prephyte went in the starter on all the corn and milo (Kyle,
  // Oct 17, 2026); spread over the corn and milo acres.
  guardX: { label: 'Guard X Prephyte', quantity: 5, price: 2400.00, total: 12000.00 },
  // The ~2 lb/ac entries logged as UpShiftC were the zinc, which went on all
  // the corn and milo (Kyle, Oct 17, 2026). Bamford Farms LLC invoice dated
  // Apr 1, 2026: 9% EDTA Zinc 500 gal x $14.11 = $7,055.00 plus $560.00
  // freight; the total with freight is spread over the corn and milo acres.
  zincName: '9% EDTA Zinc',
  zinc: { label: '9% EDTA Zinc', source: 'Bamford Farms LLC invoice, Apr 1, 2026 (500 gal x $14.11 + $560.00 freight)',
    gallons: 500, pricePerGal: 14.11, freight: 560.00, total: 7615.00 }
};
