// Field name corrections applied to the live records at startup. A correction
// renames the old field; when the corrected field already exists, the old
// record's links move onto it and the old record is removed.
module.exports = [
  {
    key: 'field-60-east-west',
    // Field 60 is split east and west. 60.W is wheat 26; the old "60.S" is 60.E.
    from: /^60\.S\b/i,
    to: '60.E DAILEYRD',
    farm: 'A1FARMS',
    fill: { acres: 78.78, legal: 'NE4 28-7-48', fsaFarm: '4114', tract: '4048', county: 'Logan', section: '28', township: '7N', range: '48W' }
  },
  // Pole Rd fields renumbered to match the Operations Center (Kyle, Oct 17,
  // 2026): field 30 is the full quarter (was 36, Sec 15), field 31 is the
  // roughly 100 acres (was 35, Sec 14). Records and crop history stay linked.
  { key: 'pole-rd-36e-to-30e', from: /^36\.E POLE RD SEC 15$/i, to: '30.E POLE RD SEC 15' },
  { key: 'pole-rd-36w-to-30w', from: /^36\.W POLE RD SEC 15$/i, to: '30.W POLE RD SEC 15' },
  { key: 'pole-rd-35e-to-31e', from: /^35\.E POLE RD SEC 14$/i, to: '31.E POLE RD SEC 14' },
  { key: 'pole-rd-35w-to-31w', from: /^35\.W POLE RD SEC 14$/i, to: '31.W POLE RD SEC 14' }
];

// Cards moved to another farm, applied once each. The card's landlord and
// share follow the new farm; the registry field moves to that farm too.
module.exports.farmMoves = [
  // 30.W is Peterson ground: the 2026 wheat landlord statement pays Lynn
  // Peterson 35% (Kyle, Oct 17, 2026). It was filed under LAFARMS.
  { key: 'field-30w-to-peterson-2026-10-17', match: /^30\.W POLE RD SEC 15$/i, farm: 'PETERSON', landlord: 'Lynn Peterson', sharePercentage: 35 }
];

// Crops set on cards, applied once each and only where the year is still
// blank, so a crop changed on the site later is left alone.
module.exports.cropSets = [
  // Kyle, Oct 17, 2026: 20 goes to sorghum sudan for 2027, 21 to grazing
  // oats and vetch. The summer 2026 tillage on each is charged to these crops.
  { key: 'crop-2027-20-north-2026-10-17', match: /^20 NORTH$/i, year: 2027, crop: 'SORGHUM SUDAN' },
  { key: 'crop-2027-21-small-2026-10-17', match: /^21 SMALL$/i, year: 2027, crop: 'OATS & VETCH' }
];
