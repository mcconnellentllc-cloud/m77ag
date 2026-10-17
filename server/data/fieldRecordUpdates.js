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
