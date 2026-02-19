/**
 * seed-soil-data.js
 * Imports all 51 fields of soil sample history from the parsed Excel data
 * into the CroppingField soil.samples[] array.
 *
 * Usage:
 *   node server/scripts/seed-soil-data.js
 *
 * This reads server/data/soil-field-data.json (parsed from the original spreadsheets)
 * and maps each field ID to the matching CroppingField document(s).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const CroppingField = require('../models/croppingField');

// Load the parsed soil data
const FIELD_DATA = require('../data/soil-field-data.json');

// ======================================================================
// Field ID -> CroppingField matching rules
// The soil data uses IDs like "10-N", "28 E", "14", "45"
// The CroppingField.field names use patterns like "10.N OURS", "28.E MICHAEL", "45 W. TOWN"
// ======================================================================

// Explicit mapping for field IDs that map to MULTIPLE CroppingField docs
// (soil was taken from one location but applies to both halves)
const MULTI_FIELD_MAP = {
  '14': [{ farm: 'LAFARMS', prefix: '14.N' }, { farm: 'LAFARMS', prefix: '14.S' }],
  '17': [{ farm: 'LAFARMS', prefix: '17.E' }, { farm: 'LAFARMS', prefix: '17.W' }]
};

// Build field prefix from soil data ID: "10-N" -> "10.N", "28 E" -> "28.E", "45" -> "45"
function soilIdToPrefix(id) {
  // "28 E" -> "28.E", "28 NE" -> "28.NE"
  if (/^\d+ [A-Z]+$/.test(id)) {
    return id.replace(' ', '.');
  }
  // "10-N" -> "10.N"
  if (id.includes('-')) {
    return id.replace('-', '.');
  }
  // "45" -> "45" (standalone number)
  return id;
}

// Determine which farm a field belongs to based on its number prefix
function getFarmForFieldNum(num) {
  const n = parseInt(num);
  if (n >= 10 && n <= 19) return 'LAFARMS';
  if (n >= 20 && n <= 29) return 'KBFARMS';
  if (n >= 30 && n <= 39) return 'PETERSON';
  if (n >= 40 && n <= 49) return 'HDFARMS';
  if (n >= 50 && n <= 59) return 'MEFARMS';
  if (n >= 60 && n <= 69) return 'A1FARMS';
  // Special case: 36-W is LAFARMS not PETERSON
  return null;
}

// Special overrides for fields that don't follow the default farm assignment
const FARM_OVERRIDES = {
  '36-W': 'LAFARMS'   // 36.W POLE RD SEC 15 is LAFARMS, not PETERSON
};

// Convert a soil history record to a soil sample document
function historyToSample(histEntry, soilField) {
  return {
    year: histEntry.year,
    crop: histEntry.crop || soilField.crop2026 || '',
    yieldGoal: typeof histEntry.yieldGoal === 'number' ? histEntry.yieldGoal : (parseFloat(histEntry.yieldGoal) || null),
    depth: '0-8 in',

    // Basic / legacy fields
    ph: histEntry.pH || null,
    nitrogen: histEntry.NO3_ppm || null,
    phosphorus: histEntry.Olsen_P || null,
    potassium: histEntry.Potassium_ppm || null,
    sulfur: histEntry.Sulfur_ppm || null,
    zinc: histEntry.Zinc_ppm || null,
    iron: histEntry.Iron_ppm || null,
    organicMatter: histEntry.OM_pct || null,
    cec: histEntry.CEC || null,

    // Extended panel
    bufferPH: histEntry.Buffer_pH || null,
    NO3ppm: histEntry.NO3_ppm || null,
    NO3lbs: histEntry.NO3_lbs_A || null,
    NO3Total: histEntry.NO3_lbs_A || null,
    olsenP: histEntry.Olsen_P || null,
    bray1P: histEntry.Bray1_P || null,
    brayP2: histEntry.Bray2_P || null,
    calcium: histEntry.Calcium_ppm || null,
    magnesium: histEntry.Magnesium_ppm || null,
    sodium: histEntry.Sodium_ppm || null,
    manganese: histEntry.Manganese_ppm || null,
    copper: histEntry.Copper_ppm || null,
    boron: histEntry.Boron_ppm || null,

    // Base saturation
    baseSat: histEntry.Base_Sat_pct || null,
    hSat: histEntry.H_Sat_pct || null,
    caSat: histEntry.Ca_Sat_pct || null,
    mgSat: histEntry.Mg_Sat_pct || null,
    kSat: histEntry.K_Sat_pct || null,
    naSat: histEntry.Na_Sat_pct || null,

    notes: ''
  };
}

// Convert soil2026 (current year top-level data) to a sample
function soil2026ToSample(soilField) {
  const s = soilField.soil2026;
  if (!s) return null;
  return {
    year: 2026,
    crop: soilField.crop2026 || '',
    yieldGoal: typeof soilField.yieldGoal === 'number' ? soilField.yieldGoal : (parseFloat(soilField.yieldGoal) || null),
    depth: '0-8 in',

    ph: s.pH || null,
    nitrogen: s.NO3ppm || null,
    phosphorus: s.olsenP || null,
    potassium: s.potassium || null,
    sulfur: s.sulfur || null,
    zinc: s.zinc || null,
    iron: s.iron || null,
    organicMatter: s.OM || null,
    cec: s.CEC || null,

    bufferPH: s.bufferPH || null,
    excessLime: s.excessLime || null,
    solubleSalts: s.solubleSalts || null,
    NO3ppm: s.NO3ppm || null,
    NO3lbs: s.NO3lbs || null,
    NO3Total: s.NO3Total || null,
    olsenP: s.olsenP || null,
    brayP2: s.brayP2 || null,
    calcium: s.calcium || null,
    magnesium: s.magnesium || null,
    sodium: s.sodium || null,
    manganese: s.manganese || null,
    copper: s.copper || null,
    boron: s.boron || null,

    baseSat: s.baseSat || null,
    hSat: s.hSat || null,
    caSat: s.caSat || null,
    mgSat: s.mgSat || null,
    kSat: s.kSat || null,
    naSat: s.naSat || null,

    notes: ''
  };
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  let totalUpdated = 0;
  let totalSamples = 0;
  let notFound = [];

  for (const soilField of FIELD_DATA) {
    const id = soilField.id;

    // Build soil samples from history + soil2026
    const samples = [];

    // Add all history entries as samples
    const historyYears = new Set();
    (soilField.history || []).forEach(h => {
      samples.push(historyToSample(h, soilField));
      historyYears.add(h.year);
    });

    // Add soil2026 if not already in history
    if (soilField.soil2026 && !historyYears.has(2026)) {
      const s2026 = soil2026ToSample(soilField);
      if (s2026) samples.push(s2026);
    }

    // Build agronomist alerts from the alerts array
    const agronomistAlerts = (soilField.alerts || []).map(a => ({
      type: a.type,
      message: a.message
    }));

    // Attach alerts to the most recent sample
    if (agronomistAlerts.length > 0 && samples.length > 0) {
      // Sort samples by year descending, attach to newest
      samples.sort((a, b) => (b.year || 0) - (a.year || 0));
      samples[0].agronomistAlerts = agronomistAlerts;
    }

    // Sort samples by year ascending for clean storage
    samples.sort((a, b) => (a.year || 0) - (b.year || 0));

    // Determine which CroppingField docs to update
    let targets = [];

    if (MULTI_FIELD_MAP[id]) {
      // Fields that map to multiple docs (14, 17)
      targets = MULTI_FIELD_MAP[id];
    } else {
      const prefix = soilIdToPrefix(id);
      const numStr = id.match(/^(\d+)/)[1];
      const farm = FARM_OVERRIDES[id] || getFarmForFieldNum(numStr);
      if (farm) {
        targets = [{ farm, prefix }];
      }
    }

    if (targets.length === 0) {
      notFound.push(id);
      console.log(`  [SKIP] ${id} - could not determine farm`);
      continue;
    }

    for (const target of targets) {
      // Find the CroppingField where field name starts with prefix
      const regex = new RegExp('^' + target.prefix.replace('.', '\\.') + '(\\s|$)');
      const field = await CroppingField.findOne({
        farm: target.farm,
        field: { $regex: regex }
      });

      if (!field) {
        notFound.push(`${id} -> ${target.farm}/${target.prefix}`);
        console.log(`  [NOT FOUND] ${id} -> ${target.farm} field starting with "${target.prefix}"`);
        continue;
      }

      // Initialize soil object if missing
      if (!field.soil) {
        field.soil = { samples: [] };
      }
      if (!field.soil.samples) {
        field.soil.samples = [];
      }

      // Clear existing samples (fresh import)
      field.soil.samples = samples;

      await field.save();
      totalUpdated++;
      totalSamples += samples.length;
      console.log(`  [OK] ${id} -> ${field.farm} / ${field.field} (${samples.length} samples)`);
    }
  }

  console.log('\n========================================');
  console.log(`Fields updated: ${totalUpdated}`);
  console.log(`Total soil samples inserted: ${totalSamples}`);
  if (notFound.length > 0) {
    console.log(`Not found (${notFound.length}):`);
    notFound.forEach(n => console.log(`  - ${n}`));
  }
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
