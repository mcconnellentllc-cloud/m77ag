// APH by field from the Rain and Hail APH database (ten-year history, 2025),
// matched by legal description (section, township, range) and crop. Where a
// section holds more than one unit for the crop, the unit whose description
// names the card's field number is used (for example "13-14 LA BAM E" for
// 13.E BAM E). Wheat uses the summer fallow unit over continuous crop.
const DB = require('../data/aphDatabase2025.json');

const numbersIn = s => (String(s || '').match(/\d+/g) || []).map(Number);
const fieldNumberOf = name => { const m = String(name || '').match(/^#?(\d+)/); return m ? Number(m[1]) : null; };

function aphFromDatabase(cf, crop) {
  if (!cf || !crop || !cf.section || !cf.township || !cf.range) return null;
  const sec = String(Number(cf.section));
  const twp = String(cf.township).toUpperCase();
  const rng = String(cf.range).toUpperCase();
  let units = DB.units.filter(u => u.crop === crop && u.approvedYield > 0 &&
    u.legals.some(l => l.section === sec && l.township === twp && l.range === rng));
  if (!units.length) return null;
  if (crop === 'WHEAT' && units.some(u => /FALLOW/i.test(u.practice))) units = units.filter(u => /FALLOW/i.test(u.practice));
  if (units.length > 1) {
    const num = fieldNumberOf(cf.field);
    const named = units.filter(u => numbersIn(u.unitDescription).includes(num));
    if (named.length) units = named;
  }
  const values = [...new Set(units.map(u => u.approvedYield))];
  if (values.length > 1) {
    return { ambiguous: true, detail: `${units.length} ${crop.toLowerCase()} units in sec ${sec} ${twp} ${rng} with APH ${values.join(', ')}: ` +
      units.map(u => `${u.unitNumber}${u.unitDescription ? ' "' + u.unitDescription + '"' : ''}`).join('; ') };
  }
  const u = units[0];
  return { value: u.approvedYield, source: `APH ${u.approvedYield}, Rain and Hail 2025 APH database, unit ${u.unitNumber}${u.unitDescription ? ' "' + u.unitDescription + '"' : ''}${crop === 'WHEAT' ? ' (' + String(u.practice).toLowerCase() + ')' : ''}` };
}

module.exports = { aphFromDatabase };
