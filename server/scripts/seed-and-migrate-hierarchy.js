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

// Hierarchy source-of-truth. Edit this when landlord names, shares, or
// new farms change. Re-running the seed reconciles MongoDB to this list.
const HIERARCHY = [
  {
    name: 'M77 AG',
    type: 'owner',
    contact: { name: 'M77 AG' },
    defaultEnterprise: 'M77 AG',
    farms: [
      // type 'owned'      = M77 owns the land outright; share = 0
      // type 'crop-share' = M77 farms it for a landlord; share = landlord %
      // The "Unassigned" buckets exist so legacy and JD-imported fields
      // always have a home until they're tagged correctly via the UI.
      { name: 'MEFARMS',                  landlordName: 'M77 AG',                   type: 'owned',      defaultShare: 0    },
      { name: 'KBFARMS',                  landlordName: 'Kyle & Brandi McConnell',  type: 'crop-share', defaultShare: 0.35 },
      { name: 'LAFARMS',                  landlordName: 'Larry & Adele',            type: 'crop-share', defaultShare: 0.35 },
      { name: 'HDFARMS',                  landlordName: 'Dorothy McConnell',        type: 'crop-share', defaultShare: 0.35 },
      { name: 'A1FARMS',                  landlordName: 'Adele McConnell',          type: 'crop-share', defaultShare: 0.35 },
      { name: 'PETERSON',                 landlordName: 'Lynn Peterson',            type: 'crop-share', defaultShare: 0.35 },
      { name: 'Unassigned',               landlordName: 'M77 AG',                   type: 'owned',      defaultShare: 0    },
      { name: 'Unassigned (JD imported)', landlordName: 'M77 AG',                   type: 'owned',      defaultShare: 0    }
    ]
  },
  {
    name: 'Allphin Farms',
    type: 'landlord',
    contact: { name: 'Allphin Farms' },
    defaultEnterprise: 'Lueking',
    farms: [
      // defaultShare = null means "set later via UI" — financial engine
      // skips fields whose effective share is null until configured.
      { name: 'Lueking', landlordName: 'Allphin Farms', type: 'crop-share', defaultShare: null }
    ]
  },
  {
    name: 'Custom',
    type: 'custom',
    contact: { name: 'Custom (no portal)' },
    defaultEnterprise: 'Custom',
    farms: [
      // Custom-type farms skip the crop-share split entirely; M77 bills
      // these directly. landlordName captures the operator's name.
      { name: 'Nelson',    landlordName: 'Nelson',    type: 'custom', defaultShare: 0 },
      { name: 'Eisenhard', landlordName: 'Eisenhard', type: 'custom', defaultShare: 0 },
      { name: 'RPM',       landlordName: 'RPM',       type: 'custom', defaultShare: 0 }
    ]
  },
  {
    // Quarantine bucket for all JD-imported fields. Every JD sync drops new
    // fields here under a per-org Farm (created on demand). Admin reviews
    // each import via /admin/jd-merge and either Merges (copies JD boundary
    // + jd_field_id onto an existing real field) or Promotes (moves the
    // import to its correct Client/Farm). M77 AG's existing 72 records are
    // never touched by sync.
    name: 'M77 AG - Import',
    type: 'owner',
    contact: { name: 'M77 AG (JD import quarantine)' },
    defaultEnterprise: 'M77 AG',
    farms: []  // populated on-demand during JD sync
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

function farmRecordFor(client, farmDef) {
  return {
    client: client._id,
    name: farmDef.name,
    landlordName: farmDef.landlordName,
    type: farmDef.type,
    defaultShare: farmDef.defaultShare
  };
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
        console.log(`  [dry] would create Client: ${c.name} (${c.type}, defaultEnterprise=${c.defaultEnterprise})`);
        client = { _id: null, name: c.name, type: c.type };
      }
    } else {
      client = await Client.findOneAndUpdate(
        { name: c.name },
        {
          $set: {
            type: c.type,
            contact: c.contact,
            defaultEnterprise: c.defaultEnterprise
          },
          $setOnInsert: { name: c.name }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    clientByName.set(c.name, client);

    for (const farmDef of c.farms) {
      let farm;
      if (DRY_RUN) {
        farm = client._id ? await M77Farm.findOne({ client: client._id, name: farmDef.name }) : null;
        if (!farm) {
          console.log(`  [dry] would create Farm: ${farmDef.name} under ${c.name} ` +
            `(landlord=${farmDef.landlordName}, type=${farmDef.type}, share=${farmDef.defaultShare})`);
          farm = { _id: null, name: farmDef.name };
        }
      } else {
        farm = await M77Farm.findOneAndUpdate(
          { client: client._id, name: farmDef.name },
          {
            $set: {
              landlordName: farmDef.landlordName,
              type:         farmDef.type,
              defaultShare: farmDef.defaultShare
            },
            $setOnInsert: { client: client._id, name: farmDef.name }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      farmByKey.set(`${c.name}::${farmDef.name}`, farm);
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
