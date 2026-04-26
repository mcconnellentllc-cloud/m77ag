/**
 * Seed Clients/M77Farms and migrate existing M77Field rows into the
 * Client → M77Farm → M77Field hierarchy.
 *
 * Idempotent: safe to run multiple times. Uses upsert by (clientName) and
 * (clientId, farmName) so re-runs don't duplicate rows.
 *
 * Field linking strategy:
 *   - If M77Field.rotationGroup matches a known M77 AG farm name (LAFARMS,
 *     KBFARMS, HDFARMS, MEFARMS, A1FARMS, PETERSON), link to that farm.
 *   - Otherwise link to "Unassigned" under M77 AG.
 *
 * NOTE on the schema's `required: true` for client/farm: this script writes
 * directly via updateOne (no Mongoose validation), so it can populate
 * existing documents that pre-date the hierarchy without triggering
 * validation errors.
 *
 * Usage:
 *   npm run migrate:hierarchy
 *   DRY_RUN=1 npm run migrate:hierarchy   # report only, no writes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('../models/client');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// ---- Hierarchy definition (the source of truth) ----------------------------

// All farm names that will exist after seeding. The first item in each
// `farms` array is the "Unassigned" bucket per Client (used when an existing
// or imported M77Field can't be assigned a more specific farm).
const HIERARCHY = [
  {
    name: 'M77 AG',
    type: 'owner',
    contact: { name: 'M77 AG' },
    defaultShare: 0,
    farms: [
      'Unassigned',
      'Unassigned (JD imported)',
      'LAFARMS',
      'KBFARMS',
      'HDFARMS',
      'MEFARMS',
      'A1FARMS',
      'PETERSON'
    ]
  },
  {
    name: 'Allphin Farms',
    type: 'landlord',
    contact: { name: 'Allphin Farms' },
    defaultShare: 0,
    farms: ['Lueking']
  },
  {
    name: 'Custom',
    type: 'custom',
    contact: { name: 'Custom (no portal)' },
    defaultShare: 0,
    farms: ['Nelson', 'Eisenhard', 'RPM']
  }
];

// Existing rotationGroup values that map to M77 AG farms. Anything else on
// an existing field falls through to "Unassigned" under M77 AG.
const M77_AG_FARM_NAMES = new Set([
  'LAFARMS', 'KBFARMS', 'HDFARMS', 'MEFARMS', 'A1FARMS', 'PETERSON'
]);

function normalizeFarmName(s) {
  return String(s || '').trim().toUpperCase();
}

// ---- Main ------------------------------------------------------------------

async function seedClientsAndFarms() {
  // clientId by name and farmId by (clientName + farmName) — built as we go.
  const clientByName = new Map();
  const farmByKey = new Map(); // key = `${clientName}::${farmName}`

  for (const c of HIERARCHY) {
    let client;
    if (DRY_RUN) {
      client = await Client.findOne({ name: c.name });
      if (!client) {
        console.log(`  [dry] would create Client: ${c.name} (${c.type})`);
        client = { _id: null, name: c.name, type: c.type };
      }
    } else {
      client = await Client.findOneAndUpdate(
        { name: c.name },
        {
          $set: { type: c.type, contact: c.contact, defaultShare: c.defaultShare },
          $setOnInsert: { name: c.name }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    clientByName.set(c.name, client);

    for (const farmName of c.farms) {
      let farm;
      if (DRY_RUN) {
        farm = client._id ? await M77Farm.findOne({ client: client._id, name: farmName }) : null;
        if (!farm) {
          console.log(`  [dry] would create Farm: ${farmName} under ${c.name}`);
          farm = { _id: null, name: farmName };
        }
      } else {
        farm = await M77Farm.findOneAndUpdate(
          { client: client._id, name: farmName },
          {
            $setOnInsert: { client: client._id, name: farmName }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      farmByKey.set(`${c.name}::${farmName}`, farm);
    }
  }
  return { clientByName, farmByKey };
}

async function linkExistingFields({ clientByName, farmByKey }) {
  const m77ag = clientByName.get('M77 AG');
  const farmUnassigned = farmByKey.get('M77 AG::Unassigned');

  // Only consider fields that don't yet have a client/farm assignment.
  // Direct collection access bypasses Mongoose's `required` validators on the
  // existing rows.
  const cursor = M77Field.collection.find({
    $or: [
      { client: { $exists: false } },
      { client: null },
      { farm: { $exists: false } },
      { farm: null }
    ]
  });

  let total = 0;
  let linkedToM77Farm = 0;
  let linkedToUnassigned = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    total++;

    const rotationName = normalizeFarmName(doc.rotationGroup);
    let targetFarm = null;
    let targetClient = m77ag;

    if (M77_AG_FARM_NAMES.has(rotationName)) {
      targetFarm = farmByKey.get(`M77 AG::${rotationName}`);
      linkedToM77Farm++;
    } else {
      targetFarm = farmUnassigned;
      linkedToUnassigned++;
    }

    if (!targetFarm || !targetClient || !targetFarm._id || !targetClient._id) {
      if (DRY_RUN) continue;
      console.warn(`  [warn] skipping field ${doc._id} — target farm/client missing`);
      continue;
    }

    if (DRY_RUN) continue;

    await M77Field.collection.updateOne(
      { _id: doc._id },
      { $set: { client: targetClient._id, farm: targetFarm._id } }
    );
  }

  return { total, linkedToM77Farm, linkedToUnassigned };
}

(async () => {
  console.log('='.repeat(60));
  console.log('M77 Client / Farm hierarchy seed + field migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const beforeClients = await Client.countDocuments();
    const beforeFarms = await M77Farm.countDocuments();
    const beforeFields = await M77Field.countDocuments();
    const beforeUnlinked = await M77Field.collection.countDocuments({
      $or: [
        { client: { $exists: false } }, { client: null },
        { farm: { $exists: false } },   { farm: null }
      ]
    });

    console.log('\nBefore counts:');
    console.log(`  Clients         : ${beforeClients}`);
    console.log(`  M77Farms        : ${beforeFarms}`);
    console.log(`  M77Fields       : ${beforeFields} (unlinked: ${beforeUnlinked})`);

    console.log('\nSeeding clients + farms ...');
    const seeded = await seedClientsAndFarms();

    console.log('\nLinking existing M77Field rows ...');
    const linked = await linkExistingFields(seeded);
    console.log(`  scanned=${linked.total} matchedRotation=${linked.linkedToM77Farm} unassigned=${linked.linkedToUnassigned}`);

    const afterClients = await Client.countDocuments();
    const afterFarms = await M77Farm.countDocuments();
    const afterUnlinked = await M77Field.collection.countDocuments({
      $or: [
        { client: { $exists: false } }, { client: null },
        { farm: { $exists: false } },   { farm: null }
      ]
    });

    console.log('\nAfter counts:');
    console.log(`  Clients         : ${afterClients}`);
    console.log(`  M77Farms        : ${afterFarms}`);
    console.log(`  M77Fields       : ${beforeFields} (unlinked: ${afterUnlinked})`);

    if (afterUnlinked > 0 && !DRY_RUN) {
      console.warn(`\nWARNING: ${afterUnlinked} M77Field rows are still unlinked. Check logs above.`);
      process.exitCode = 2;
    } else {
      console.log('\nDone.');
    }
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
})();
