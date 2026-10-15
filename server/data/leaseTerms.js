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
      fieldLandlords: [{ match: /KIRBY/i, landlord: 'Lisa Atkins' }, { match: /PAULS/i, landlord: 'Paul Barkey' }]
    }
  ]
};
