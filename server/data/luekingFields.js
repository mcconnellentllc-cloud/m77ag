// Lueking ground (Allphin Farms, landlord), from the 2026 John Deere Operations
// Center seeding records. Acres are 2026 seeded acres until FSA acres are on
// file. 73 and 77 are the only irrigated fields on the operation (pivots);
// their corners are dryland.
module.exports = {
  farm: 'LUEKING',
  landlord: 'Allphin Farms',
  fields: [
    { field: '71 LUEKING SEC 19 NW', opsName: '71 - Lueking Sec 19 NW', acres: 99.4, crop2026: 'CORN' },
    { field: '72 LUEKING S BIG CIRCLE', opsName: '72 - Lueking S Big Circle', acres: 64.1, crop2026: 'SORGHUM SUDAN' },
    { field: '73 HOME CIRCLE SEC 19', opsName: '73 - Home Circle - Sec 19', acres: 136.9, crop2026: 'CORN', irrigated: true },
    { field: '73.C.SE SE CORNER SMALL CIRCLE', opsName: '73.C.SE - Southeast Corner Small Circle', acres: 5.3, crop2026: 'SORGHUM' },
    { field: '73.C.SW SW CORNER SMALL CIRCLE', opsName: '73.C.SW - SW Corner Small Circle', acres: 7.5, crop2026: 'SORGHUM' },
    // Split in 2026: corn 56.1 ac and sorghum 56.4 ac, so no single 2026 crop.
    { field: '75.E LUEKING NE HOME', opsName: '75.E - Lueking NE Home-', acres: 112.5, crop2026: null, note: '2026 split: corn 56.1 ac (P05081AML), sorghum 56.4 ac (85Z153), per Operations Center seeding.' },
    { field: '76.E LUEKING SE HOUSE', opsName: '76.E - Lueking SE House', acres: 50.1, crop2026: 'SORGHUM' },
    { field: '77 BIG CIRCLE SEC 30', opsName: '77 - Big Circle - Sec 30', acres: 219.9, crop2026: 'CORN', irrigated: true },
    { field: '77.C.NW NW CORNER BIG CIRCLE', opsName: '77.C.NW - NW Corner Big Circle', acres: 14, crop2026: 'SORGHUM' },
    { field: '79.S LUEKING BY STEVES', opsName: '79.S - Lueking By Steves', acres: 104.1, crop2026: 'SORGHUM SUDAN' }
  ],
  // Applied once: only 73 and 77 are irrigated, everything else is dryland.
  irrigationKey: 'irrigation-only-73-77',
  irrigated: /^(73|77)\s/
};
