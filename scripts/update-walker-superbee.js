/**
 * Update the Walker MBSSD Super B 72" record — a rolling capture of
 * everything we learn about this mower. Kyle sent photos of the frame
 * plate, engine, shroud decal, and belt markings; each new detail is
 * merged into WALKER_UPDATE below.
 *
 * Run: node scripts/update-walker-superbee.js
 *
 * Confirmed (2026-09-30):
 *  - Manufacturer: Walker MFG. Co., Fort Collins, CO
 *  - Year: 2008 (seed originally had this wrong as 2015)
 *  - Model No: MBSSD
 *  - Serial No: 07208
 *  - Engine: 27 HP / 20.1 kW (likely Kohler Command Pro CH740, pending
 *    engine-tag close-up to confirm exact model + engine serial)
 *  - Unit weight: 730 lbs / 331 kg
 *  - Fuel: dual fuel tanks (left + right with FUEL TANK selector)
 *  - Main drive belt (engine → hydro pumps): Walker MFG. PN 2248
 *    (confirmed off the belt itself; Made in Mexico; date code 2919MX)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Equipment = require('../server/models/equipment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const WALKER_UPDATE = {
  correctedTitle: '2008 Walker MBSSD Super B 72"',
  correctedModel: 'MBSSD',
  correctedYear: 2008,
  serialNumber: '07208',
  unitWeightLbs: 730,
  hourMeter: null,                   // pending — need to read the hour meter

  engine: {
    make: 'Kohler',                  // pending engine-tag close-up
    model: 'Command Pro CH740',      // pending engine-tag close-up
    horsepower: 27,                  // confirmed (plate + shroud decal)
    kilowatts: 20.1,                 // confirmed off Walker plate
    serialNumber: 'TODO',            // need engine-tag close-up
    fuelType: 'Gasoline',            // dual fuel tank config, non-EFI
    confidence: 'engine make/model inferred from OHV housing style, wing-nut air cleaner, and standard 2008 MBSSD spec — pending engine-tag close-up'
  },

  configuration: {
    deckSize: '72"',
    deckType: 'GHS (Grass Handling System) — collection',
    fuelTanks: 'Dual (left + right, with FUEL TANK selector valve)',
    manufacturer: {
      name: 'Walker Mfg. Co.',
      address: '5925 E. Harmony Road, Fort Collins, CO 80528',
      phone: '(970) 221-5614',
      web: 'www.walkermowers.com'
    }
  },

  parts: [
    {
      name: 'Main drive belt (engine to hydro pumps)',
      walkerPartNumber: '2248',
      manufacturer: 'Walker MFG. (Made in Mexico)',
      dateCodeSeen: '2919MX',
      notes: 'Confirmed off the belt itself. Engine-to-pump drive belt.'
    }
    // TODO: deck belts, spindle bearings, blades, filters, plugs, mule drive.
  ]
};

const BELT_MAINTENANCE = {
  date: new Date(),
  category: 'repair',
  description: 'Main drive belt (engine to hydro pumps) replacement',
  status: 'part_identified',
  parts: [{
    name: 'Main drive belt',
    partNumber: 'Walker MFG. 2248',
    quantity: 1,
    unitCost: null,
    vendor: null
  }],
  laborHours: null,
  totalCost: null,
  performedBy: '',
  notes: 'Part number confirmed off the OEM belt (Walker MFG. 2248, date code 2919MX). Source from Walker Parts (800-279-8537) or any Walker dealer. Reference: MBSSD, SN 07208.'
};

async function updateWalker() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const walker = await Equipment.findOne({
    make: 'Walker',
    $or: [
      { model: /MBSSD/i },
      { model: /Super B/i },
      { model: /Super Bee/i }
    ]
  });

  if (!walker) {
    console.error('Walker record not found. Has seed-equipment been run?');
    process.exit(1);
  }

  console.log('Found:', walker.title, `(${walker._id})`);

  if (WALKER_UPDATE.correctedTitle) walker.title = WALKER_UPDATE.correctedTitle;
  if (WALKER_UPDATE.correctedModel) walker.model = WALKER_UPDATE.correctedModel;
  if (WALKER_UPDATE.correctedYear) walker.year = WALKER_UPDATE.correctedYear;
  if (WALKER_UPDATE.serialNumber !== 'TODO') walker.serialNumber = WALKER_UPDATE.serialNumber;
  if (WALKER_UPDATE.hourMeter != null) walker.hourMeter = WALKER_UPDATE.hourMeter;

  const facts = [];
  facts.push('Owner: M77 AG');
  facts.push('Insured: Yes');
  facts.push(`Serial: ${WALKER_UPDATE.serialNumber}`);
  facts.push(`Unit weight: ${WALKER_UPDATE.unitWeightLbs} lbs`);
  facts.push(`Deck: ${WALKER_UPDATE.configuration.deckSize} ${WALKER_UPDATE.configuration.deckType}`);
  facts.push(`Fuel: ${WALKER_UPDATE.configuration.fuelTanks}`);

  const eng = WALKER_UPDATE.engine;
  const engParts = [];
  if (eng.make !== 'TODO') engParts.push(eng.make);
  if (eng.model !== 'TODO') engParts.push(eng.model);
  if (eng.horsepower) engParts.push(`${eng.horsepower} HP / ${eng.kilowatts} kW`);
  if (eng.serialNumber !== 'TODO') engParts.push(`Engine SN: ${eng.serialNumber}`);
  if (engParts.length) facts.push(`Engine: ${engParts.join(' — ')}`);

  if (WALKER_UPDATE.parts.length) {
    const partsLines = WALKER_UPDATE.parts
      .map(p => `${p.name}: Walker PN ${p.walkerPartNumber}`)
      .join(' · ');
    facts.push(`Known parts: ${partsLines}`);
  }

  walker.notes = facts.join(' · ');

  walker.maintenanceLog = walker.maintenanceLog || [];
  const alreadyLogged = walker.maintenanceLog.some(m =>
    m.description === BELT_MAINTENANCE.description &&
    m.status === 'part_identified'
  );
  if (!alreadyLogged) {
    walker.maintenanceLog.push(BELT_MAINTENANCE);
    console.log('Added maintenance entry: main drive belt (Walker PN 2248)');
  }

  await walker.save();
  console.log('---');
  console.log('Walker record updated:');
  console.log('  Title:      ', walker.title);
  console.log('  Year:       ', walker.year);
  console.log('  Model:      ', walker.model);
  console.log('  Serial:     ', walker.serialNumber);
  console.log('  Notes:      ', walker.notes);
  console.log('  Maint entries:', walker.maintenanceLog?.length || 0);

  await mongoose.disconnect();
}

updateWalker().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
