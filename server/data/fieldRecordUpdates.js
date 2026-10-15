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
  }
];
