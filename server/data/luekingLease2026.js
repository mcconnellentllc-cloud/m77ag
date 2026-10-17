// Lueking ground cash lease, 2026 initial term, as given by Kyle (Oct 17,
// 2026). Signed in March 2026 (exact date not on file), so the first
// installment fell due May 15, 2026. Lueking is a stand-alone entity: M77 AG
// manages the operation and records its income and expenses on its own books.
// The per-field rent list is pending (the copy received was cut off).
module.exports = {
  enterprise: 'Lueking',
  name: 'Lueking Ground Cash Lease, 2026 initial term',
  county: 'Yuma',
  state: 'CO',
  parties: {
    owner: 'The Iona Bartlett Estate (Melissa Hunter, Personal Representative)',
    landlordOnCards: 'Matt Allphin',
    operator: 'M77 AG LLC'
  },
  signed: 'March 2026 (date not on file)',
  term: { end: '2026-10-31', autoRenew: false, renewal: 'Negotiated yearly; no automatic renewal' },
  rent: {
    cropYear: 2026,
    base: 109023.55,
    installments: [
      { seedKey: 'lueking-rent-2026-1', amount: 54511.78, dueDate: '2026-05-15' },
      { seedKey: 'lueking-rent-2026-2', amount: 54511.77, dueDate: '2026-12-15' }
    ],
    latePayment: '10 days grace, then interest at the CRS 5-12-103 maximum less 2%'
  },
  // Net profit = gross revenue (grain, government payments, crop insurance)
  // - operating expenses - base rent. Above the threshold the split is
  // 65% tenant / 35% landlord, settled March 31 after the crop year.
  profitShare: { threshold: 100000, landlordShare: 0.35, tenantShare: 0.65, settles: 'March 31 following the crop year' },
  // Hunting and grazing need a separate lease; gross rent splits 65% landlord
  // / 35% tenant, remitted within 30 days.
  otherUseRent: { landlordShare: 0.65, tenantShare: 0.35, remittanceDays: 30 },
  totals: { acres: 980.65, irrigatedAcres: 350.78, drylandAcres: 629.87, irrigatedRent: 80679.40, drylandRent: 28344.15 },
  fields: [
    { name: '73 Home Circle', legal: 'Sec 19', acres: 135.08, type: 'irrigated', ratePerAcre: 230.00, annualCost: 31068.40 }
    // Remaining fields pending
  ]
};
