// Pioneer 2026 seed invoice, dated Oct 17, 2026 (Business Partner 18482203,
// McConnell Enterprises LLC, account M77 Ag). Paid in full: net product value
// $177,519.28. Net prices are after the 22% Infinity Discount and 2% Early
// Commitment Bonus (the invoice's average price per unit). Treatments are
// included in the unit price.
//
// Seed cost on a planting record:
//  - Corn and milo: acres x planted seeds/ac (as logged by the planter, else
//    the target) / seeds per unit x net price per unit.
//  - Sudangrass and forage sorghum (50 lb bags; the planter logs seeds/ac,
//    not pounds): the product's net invoice total spread over the 2026 acres
//    planted to it.
module.exports = {
  source: 'Pioneer 2026 invoice, Oct 17, 2026 (BP 18482203), net of 22% Infinity Discount and 2% Early Commitment Bonus',
  year: 2026,
  netProductValue: 177519.28,
  // [product, sub-product lot, packaging, units, gross $/unit, net $/unit]
  lines: [
    ['P0157AMXT', 'N8611', '80K 50 Unit PROBOX', 50, 360.00, 273.60],
    ['P05081AML', 'N7011', '80K Paper Bag', 16, 457.00, 347.32],
    ['P05081AML', 'N7041', '80K Paper Bag Medium Round', 2, 457.00, 347.32],
    ['P05081AML', 'NI042', '80K Paper Bag Medium Round', 3, 430.00, 326.80],
    ['P05081AML', 'NI072', '80K Paper Bag Medium Flat', 19, 430.00, 326.80],
    ['P05081AML', 'NI842', '80K 40 Unit PROBOX Medium Round', 40, 430.00, 326.80],
    ['P05081AML', 'NI872', '80K 40 Unit PROBOX Medium Flat', 40, 430.00, 326.80],
    ['P05466V', 'NI842', '80K 40 Unit PROBOX Medium Round', 40, 470.00, 357.20],
    ['P0622Q', 'N8841', '80K 40 Unit PROBOX Medium Round', 40, 450.00, 342.00],
    ['P08527V', 'NI612', '80K 50 Unit PROBOX', 50, 500.00, 380.00],
    ['P1122AML', 'NI042', '80K Paper Bag Medium Round', 15, 410.00, 311.60],
    ['P11259PCE', 'NI072', '80K Paper Bag Medium Flat', 22, 450.00, 342.00],
    ['P13841PWUE', 'NI072', '80K Paper Bag Medium Flat', 6, 440.00, 334.40],
    ['P14364PCUE', 'N7611', '80K 50 Unit PROBOX', 100, 507.00, 385.32],
    ['P1548AM', 'NI072', '80K Paper Bag Medium Flat', 20, 380.00, 288.80],
    ['86P20', 'NSI11', '600K Paper Bag', 56, 225.00, 171.00],
    ['88P71', 'NSI11', '600K Paper Bag', 8, 216.00, 164.16],
    ['P88Z153', 'NSI11', '600K Paper Bag', 6, 318.00, 241.68],
    ['877F', 'N2711', '50 lb Paper Bag', 28, 84.50, 64.22],
    ['845F', 'N2711', '50 lb Paper Bag', 50, 122.00, 92.72]
  ],
  // Seeds per unit by packaging; bag products are spread by acres.
  seedsPerUnit: { '80K': 80000, '600K': 600000 },
  // Deferred payment interest (prime - 1%). Billed per bag or unit: the total
  // is divided evenly over every unit on the invoice (611), and each field
  // carries the units it planted. null until the interest amount is known.
  interest: { total: null, basis: 'Deferred payment interest, prime - 1%' },
  // Planter names that differ from the invoice: test plot and lot suffixes.
  // A planter name not listed here and not on the invoice is not costed.
  normalize: name => String(name || '').replace(/\s*-\s*TP HC$/i, '').replace(/-PBHT$/i, '').replace(/~\d+$/, '').replace(/\s*\(\d+\)$/, '').trim()
};
