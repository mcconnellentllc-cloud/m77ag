// Lueking ground, from the 2026 John Deere Operations Center seeding records.
// All of it is cash leased by Allphin Farms; M77 AG has no financial tie to
// it, so the cards carry no lease and stay out of M77 financials. Acres are
// 2026 seeded acres until FSA acres are on file. 73 and 77 are the only
// irrigated fields on the operation (pivots); their corners are dryland.
const BOUNDARY = 'Acres are the Operations Center boundary area until FSA acres are on file.';

module.exports = {
  farm: 'LUEKING',
  financialNote: 'Stand-alone entity, kept out of M77 AG financials. Landlord: Matt Allphin. Ground owned by The Iona Bartlett Estate (Melissa Hunter, Personal Representative), cash leased 2026 (initial term to Oct 31, 2026; base rent $109,023.55). M77 AG manages the operation and costs.',
  // Applied once to cards created before the arrangement was recorded.
  correctionKey: 'lueking-allphin-cash-lease',
  // Applied once: the first 75.E card held all of field 75 with no crop.
  split75Key: 'lueking-75-east-west',
  fields: [
    { field: '71 LUEKING SEC 19 NW', opsName: '71 - Lueking Sec 19 NW', acres: 99.4, crop2026: 'CORN' },
    { field: '72 LUEKING S BIG CIRCLE', opsName: '72 - Lueking S Big Circle', acres: 64.1, crop2026: 'SORGHUM SUDAN' },
    { field: '73 HOME CIRCLE SEC 19', opsName: '73 - Home Circle - Sec 19', acres: 136.9, crop2026: 'CORN', irrigated: true },
    { field: '73.C.SE SE CORNER SMALL CIRCLE', opsName: '73.C.SE - Southeast Corner Small Circle', acres: 5.3, crop2026: 'SORGHUM' },
    { field: '73.C.SW SW CORNER SMALL CIRCLE', opsName: '73.C.SW - SW Corner Small Circle', acres: 7.5, crop2026: 'SORGHUM SUDAN' },
    // Field 75 is split east and west (Operations Center boundaries): 75.E
    // corn, east half; 75.W sorghum. Acres are the boundary areas.
    { field: '75.E LUEKING NE HOME', opsName: '75.E - Lueking NE Home-', acres: 55.94, crop2026: 'CORN', acresNote: BOUNDARY },
    { field: '75.W LUEKING', opsMatch: /^75\.W - East of Ho/i, acres: 54.14, crop2026: 'SORGHUM', acresNote: BOUNDARY },
    { field: '76.E LUEKING SE HOUSE', opsName: '76.E - Lueking SE House', acres: 50.1, crop2026: 'SORGHUM' },
    { field: '77 BIG CIRCLE SEC 30', opsName: '77 - Big Circle - Sec 30', acres: 219.9, crop2026: 'CORN', irrigated: true },
    { field: '77.C.NW NW CORNER BIG CIRCLE', opsName: '77.C.NW - NW Corner Big Circle', acres: 14, crop2026: 'SORGHUM' },
    { field: '79.S LUEKING BY STEVES', opsName: '79.S - Lueking By Steves', acres: 104.1, crop2026: 'SORGHUM SUDAN' }
  ],
  // Applied once: only 73 and 77 are irrigated, everything else is dryland.
  irrigationKey: 'irrigation-only-73-77',
  irrigated: /^(73|77)\s/
};
