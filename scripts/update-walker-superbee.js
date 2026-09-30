/**
 * Update the 2015 Walker Super Bee 72" record with serial number,
 * engine info, and an open maintenance entry for the main drive belt
 * replacement.
 *
 * Fill in the TODO fields once serial/engine/part number are confirmed.
 * Run: node scripts/update-walker-superbee.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const FarmEquipment = require('../server/models/farmEquipment');
const Equipment = require('../server/models/equipment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Fill these in once we have them:
const WALKER_UPDATE = {
  serialNumber: 'TODO',              // e.g. from frame plate under seat
  engineMake: 'TODO',                // e.g. 'Kohler' or 'Kawasaki'
  engineModel: 'TODO',               // e.g. 'Command Pro EFI 27hp' or 'FX801V'
  engineSerialNumber: 'TODO',        // stamped on engine shroud
  hourMeter: null,                   // current hours
};

// Main drive belt maintenance entry — open (not yet purchased).
// Once we confirm the Walker part number with the serial/engine, and
// once the belt is purchased, fill in partNumber, vendor, cost, and
// installedDate.
const BELT_MAINTENANCE = {
  date: new Date(),
  category: 'repair',
  description: 'Main drive belt replacement — needed',
  status: 'pending_purchase',
  parts: [{
    name: 'Main drive belt (engine to hydro pumps)',
    partNumber: 'TODO — pending serial/engine confirmation',
    quantity: 1,
    unitCost: null,
    vendor: 'Walker Manufacturing (or local Walker dealer)',
    vendorPhone: '800-279-8537'
  }],
  laborHours: null,
  totalCost: null,
  performedBy: '',
  notes: 'Kyle to source and install. Confirm part number by calling Walker parts with serial number in hand.'
};

async function updateWalker() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Look up either FarmEquipment or Equipment record for the Walker.
  // Seed put it in the sale-inventory Equipment collection, so try that first.
  const walker = await Equipment.findOne({
    make: 'Walker',
    model: /Super Bee/i
  });

  if (!walker) {
    console.error('Walker Super Bee record not found. Has seed-equipment been run?');
    process.exit(1);
  }

  console.log('Found:', walker.title, `(${walker._id})`);

  // Apply serial/engine updates when populated.
  let dirty = false;
  if (WALKER_UPDATE.serialNumber !== 'TODO') {
    walker.serialNumber = WALKER_UPDATE.serialNumber;
    dirty = true;
  }
  if (WALKER_UPDATE.hourMeter != null) {
    walker.hourMeter = WALKER_UPDATE.hourMeter;
    dirty = true;
  }
  const engineParts = [];
  if (WALKER_UPDATE.engineMake !== 'TODO') engineParts.push(WALKER_UPDATE.engineMake);
  if (WALKER_UPDATE.engineModel !== 'TODO') engineParts.push(WALKER_UPDATE.engineModel);
  if (WALKER_UPDATE.engineSerialNumber !== 'TODO') engineParts.push(`SN: ${WALKER_UPDATE.engineSerialNumber}`);
  if (engineParts.length) {
    walker.notes = [walker.notes, `Engine: ${engineParts.join(' — ')}`].filter(Boolean).join(' · ');
    dirty = true;
  }

  // Attach the open belt maintenance entry.
  if (BELT_MAINTENANCE.parts[0].partNumber && BELT_MAINTENANCE.parts[0].partNumber !== 'TODO — pending serial/engine confirmation') {
    walker.maintenanceLog = walker.maintenanceLog || [];
    walker.maintenanceLog.push(BELT_MAINTENANCE);
    dirty = true;
    console.log('Added maintenance entry: main drive belt replacement');
  } else {
    console.log('SKIPPING maintenance entry — part number still TODO');
  }

  if (dirty) {
    await walker.save();
    console.log('Walker record updated.');
  } else {
    console.log('No updates applied — all fields still TODO. Fill in WALKER_UPDATE at top of script.');
  }

  await mongoose.disconnect();
}

updateWalker().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
