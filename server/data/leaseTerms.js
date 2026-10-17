// Lease terms by farm, as given by Kyle on Oct 15, 2026.
//  crop-share: M77 AG 65%, landlord 35%
//  cash-rent:  M77 AG keeps 100% of the crop and pays rent
// Landlord names per field override the farm's when listed.
module.exports = {
  key: 'lease-terms-2026-10-15',
  farms: [
    { name: 'HDFARMS', type: 'crop-share', landlordShare: 0.35 },
    { name: 'LAFARMS', type: 'crop-share', landlordShare: 0.35 },
    { name: 'A1FARMS', type: 'crop-share', landlordShare: 0.35 },
    { name: 'PETERSON', type: 'crop-share', landlordShare: 0.35 },
    { name: 'KBFARMS', type: 'cash-rent', landlordShare: 0 },
    {
      name: 'MEFARMS', type: 'cash-rent', landlordShare: 0,
      farmLandlordFrom: ['M77 AG'], farmLandlord: 'Lisa Atkins / Paul Barkey',
      // FSA lease holders on file (2026 CCC-902). Dicks fields: landlord not on file.
      fieldLandlords: [{ match: /KIRBY/i, landlord: 'Lisa Atkins' }, { match: /PAULS/i, landlord: 'Paul Barkey' }, { match: /DICKS/i, landlord: 'MEFARMS' }]
    }
  ],
  // Later landlord answers, each applied once to cards and registry fields
  // that still have no landlord.
  followUps: [
    { key: 'lease-landlord-dicks-2026-10-15', farm: 'MEFARMS', match: /DICKS/i, landlord: 'MEFARMS' },
    // Farm landlords from the farm setup (server/scripts/seed-and-migrate-hierarchy.js),
    // for cards left blank where the live farm record had no landlord name.
    { key: 'lease-landlord-a1farms-2026-10-15', farm: 'A1FARMS', match: /./, landlord: 'Adele McConnell' },
    { key: 'lease-landlord-lafarms-2026-10-15', farm: 'LAFARMS', match: /./, landlord: 'Larry & Adele' },
    { key: 'lease-landlord-hdfarms-2026-10-15', farm: 'HDFARMS', match: /./, landlord: 'Dorothy McConnell' },
    { key: 'lease-landlord-peterson-2026-10-15', farm: 'PETERSON', match: /./, landlord: 'Lynn Peterson' },
    { key: 'lease-landlord-kbfarms-2026-10-15', farm: 'KBFARMS', match: /./, landlord: 'Kyle & Brandi McConnell' }
  ],
  // Lueking is a stand-alone entity; M77 AG manages the operation and costs
  // and Matt Allphin is the landlord (Kyle, Oct 17 2026). Ground owned by
  // The Iona Bartlett Estate (2026 cash lease). replaces: earlier values
  // set by this fill, changed once to the new ones.
  otherFarms: [
    { name: 'LUEKING', landlord: 'Matt Allphin',
      key: 'lueking-landlord-allphin-2026-10-17',
      replaces: { landlord: 'Lueking (cash leased by Allphin Farms; no M77 AG share)', financialNote: 'Cash leased by Allphin Farms. M77 AG has no financial tie to this ground.' },
      financialNote: 'Stand-alone entity, kept out of M77 AG financials. Landlord: Matt Allphin. Ground owned by The Iona Bartlett Estate (Melissa Hunter, Personal Representative), cash leased 2026 (initial term to Oct 31, 2026; base rent $109,023.55). M77 AG manages the operation and costs.' }
  ],
  // Cash rent per acre from the 2025 M77AG Master Workbook (Overview > Rental
  // Agreements). Set once on the matching cards; the note records 2025 billing.
  rents: [
    { key: 'mefarms-rent-2025', farm: 'MEFARMS', year: 2025, source: '2025 M77AG Master Workbook',
      lines: [
        { workbook: '53 DICKS N', match: /^53 DICKS N\b/i, acres: 25.67, rate: 35.57, paid: 913.08 },
        { workbook: '53 DICKS S', match: /^53 DICKS S\b/i, acres: 49.63, rate: 35.57, paid: 1765.34 },
        { workbook: '54 PAULS', match: /^54\.[NS] PAULS\b/i, acres: 149.60, rate: 43.01, paid: 6434.30 },
        { workbook: '55 KIRBY HOUSE', match: /^55\.[NS] KIRBY HOUSE\b/i, acres: 147.16, rate: 50.00, paid: 7358.00 },
        { workbook: '55 KIRBY HOUSEB', match: /^55 KIRBY HOUSEB\b/i, acres: 4.18, rate: 50.00, paid: 209.00 },
        { workbook: '56 KIRBY SOUTH', match: /^56\.[EW] KIRBY SOUTH\b/i, acres: 157.70, rate: 50.00, paid: 7885.00 }
      ] }
,
    // 599 Pauls is idle ground with no rent (Kyle, Oct 15, 2026).
    { key: 'mefarms-599-idle-2026', farm: 'MEFARMS', year: 2025, source: 'Kyle, Oct 15, 2026',
      lines: [{ workbook: '599 PAULS', match: /^599 PAULS\b/i, acres: 6.39, rate: 0, paid: 0, note: 'Idle ground, no rent.' }] },
    // KBFARMS cash rent equals the yearly land loan payment, spread over the
    // parcel's total acres (Kyle, Oct 15, 2026). Payments from the KB Farms
    // capital records. Neal's Pasture is paid off: no loan, no rent.
    { key: 'kbfarms-rent-2026', farm: 'KBFARMS', year: 2026, source: 'KB Farms land loans',
      lines: [
        { workbook: 'Pauli Section', match: /^(20 NORTH|21 SMALL|22 TOP HILL|23\.[EW] SW PAULI|24\.[EW] SE PAULI)\b/i, acres: 604, rate: 63.88, paid: 0,
          note: 'Rent equals the Pauli Section loan payment: $38,583.17 per year (due Mar 1) over 604 ac = $63.88/ac.' },
        { workbook: 'Michael Section', match: /^(25\.[CP] NW MICHAEL|26\.[EW] SW MICHAEL|28\.(E|NE|NW|SE|SW) MICHAEL|29\.[NS] MICHAEL|298 HWY HOUSE)\b/i, acres: 400, rate: 73.76, paid: 0,
          note: 'Rent equals the Michael Ground loan payment: $29,502.43 per year (due Nov 1) over 400 ac = $73.76/ac.' },
        { workbook: 'Madsen Pasture', match: /^202 SECTION\b/i, acres: 160, rate: 94.02, paid: 0,
          note: 'Rent equals the Madsen Pasture loan payment: $15,042.48 per year (due Mar 1) over 160 ac = $94.02/ac.' },
        { workbook: "Neal's Pasture", match: /^(201 BY NEAL'?S|299 BY NEALS)\b/i, acres: 152, rate: 0, paid: 0,
          note: "Neal's Pasture is paid off: no loan, no rent." }
      ] }
  ]
};
