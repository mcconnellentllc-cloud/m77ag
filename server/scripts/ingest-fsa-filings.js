/**
 * FSA filings ingest + binding pass (Phase D-2).
 *
 * Two phases run back-to-back, both idempotent:
 *
 *   1. INGEST  Upsert known CCC-902 filings into the fsaFilings collection
 *              by (entity, programYear, fsn, tract). Re-runs reconcile to
 *              the FSA_FILINGS array — edit it when new CCC-902s land.
 *
 *   2. BIND    Apply per-field FSA overlays to M77Field rows:
 *                - Kirby House / Kirby South  → fsaLeaseHolderName: 'Lisa Atkins'
 *                - Pauls fields                → fsaLeaseHolderName: 'Paul Barkey'
 *              Plus mark every other in-rotation field (M77 AG / Allphin Farms)
 *              that doesn't yet have an fsaFarmSerial as needsFsaAssignment=true.
 *              Custom-client fields and JD quarantine imports are skipped.
 *
 * Latest year wins as the current snapshot; prior years are appended to
 * M77Field.fsaHistory. Workbook origin values land in legacyFsaFarm /
 * legacyFsaTract for traceability.
 *
 * Usage:
 *   npm run ingest:fsa-filings          # live
 *   DRY_RUN=1 npm run ingest:fsa-filings
 */

const mongoose = require('mongoose');
require('dotenv').config();

const M77Field = require('../models/m77Field');
const M77Farm = require('../models/m77Farm');
const Client = require('../models/client');
const FsaFiling = require('../models/fsaFiling');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// ---- Known FSA filings -----------------------------------------------------
// Edit this when new CCC-902s arrive (Phillips, Logan beyond what's already
// here, or any new year). The script upserts by (entity, programYear, fsn,
// tract), so re-running with new entries is safe.
const FSA_FILINGS = [
  // ---- Lisa Atkins (Kirby fields, MEFARMS) -------------------------------
  // 2026 CCC-902 — Tract 5418, Logan admin county, 151.34 ac.
  {
    entity: 'M77 Ag Inc.', programYear: 2026, county: 'Logan', state: 'CO',
    fsn: '4207', tract: '5418',
    leaseHolder: 'Lisa Atkins',
    acres: 151.34, leaseType: 'Crop Share', source: 'CCC-902'
  },
  // Workbook archival entry — kept so the binding script can detect the
  // (FSN 4207, Tract 5418) pair for "55 Kirby House" by historical match
  // even if the 2026 numbers diverge.
  {
    entity: 'M77 Ag Inc.', programYear: 2025, county: 'Logan', state: 'CO',
    fsn: '4207', tract: '5418',
    leaseHolder: 'Lisa Atkins',
    acres: null, leaseType: 'Crop Share', source: 'workbook'
  },
  // 56 Kirby South — workbook only (no 2026 CCC-902 ingested yet).
  {
    entity: 'M77 Ag Inc.', programYear: 2025, county: 'Logan', state: 'CO',
    fsn: '4667', tract: '5798',
    leaseHolder: 'Lisa Atkins',
    acres: null, leaseType: 'Crop Share', source: 'workbook'
  },

  // ---- Paul Barkey (Pauls fields, MEFARMS) -------------------------------
  // 2026 CCC-902 — Tract 6954, 67.92 ac.
  {
    entity: 'M77 Ag Inc.', programYear: 2026, county: 'Logan', state: 'CO',
    fsn: '247', tract: '6954',
    leaseHolder: 'Paul Barkey',
    acres: 67.92, leaseType: 'Crop Share', source: 'CCC-902'
  },
  // Workbook archival entry — older Tract 1311 under same FSN.
  {
    entity: 'M77 Ag Inc.', programYear: 2024, county: 'Logan', state: 'CO',
    fsn: '247', tract: '1311',
    leaseHolder: 'Paul Barkey',
    acres: null, leaseType: 'Crop Share', source: 'workbook'
  }

  // ---- Phillips / additional Logan filings -------------------------------
  // ADD HERE when CCC-902 PDFs are uploaded. Schema:
  // { entity, programYear, county, state, fsn, tract,
  //   leaseHolder, acres, leaseType, source }
];

// ---- Per-field bindings ----------------------------------------------------
// Each rule names the M77 fields to look for (case-insensitive substring
// match against M77Field.name) plus the FSA filing key to apply.
//
// IMPORTANT: This is the source of truth for the binding pass. When new
// FSA-recorded lease holders need to be wired up, add a new rule here and
// re-run the script.
const FIELD_BINDINGS = [
  {
    matchAny: [/kirby\s*house/i, /\bkirby\b(?!\s*south)/i],
    fsaKey:   { entity: 'M77 Ag Inc.', fsn: '4207', tract: '5418' },
    legacy:   { fsaFarm: '4207', fsaTract: '5418' }
  },
  {
    matchAny: [/kirby\s*south/i],
    fsaKey:   { entity: 'M77 Ag Inc.', fsn: '4667', tract: '5798' },
    legacy:   { fsaFarm: '4667', fsaTract: '5798' }
  },
  {
    // Both "54 Pauls" and "599 Pauls" land here — same lease holder
    // (Paul Barkey), same FSN. Tract 6954 is the 2026 number; the workbook
    // had 1311. Latest year wins as current.
    matchAny: [/\bpauls\b/i],
    fsaKey:   { entity: 'M77 Ag Inc.', fsn: '247', tract: '6954' },
    legacy:   { fsaFarm: '247', fsaTract: '1311' }
  }
];

// Clients whose fields are NOT subject to FSA tracking (no FSA filings
// expected — Custom is direct billing, Import is quarantine).
const CLIENTS_EXCLUDED_FROM_FSA = new Set(['Custom', 'M77 AG - Import']);

// ---------------------------------------------------------------------------

async function ingestFilings() {
  let inserted = 0, updated = 0;
  for (const f of FSA_FILINGS) {
    const filter = {
      entity: f.entity,
      programYear: f.programYear,
      fsn: f.fsn,
      tract: f.tract
    };
    if (DRY_RUN) {
      const exists = await FsaFiling.findOne(filter);
      if (exists) updated++; else inserted++;
      continue;
    }
    const res = await FsaFiling.updateOne(
      filter,
      { $set: f, $setOnInsert: filter },
      { upsert: true }
    );
    if (res.upsertedCount) inserted++;
    else if (res.modifiedCount) updated++;
  }
  return { inserted, updated, total: FSA_FILINGS.length };
}

// Find the latest filing matching an FSA key (entity + fsn + tract). Used
// to populate the current snapshot on a M77Field. Returns null if no
// matching filing exists.
async function latestFilingFor(key) {
  return FsaFiling.findOne({
    entity: key.entity, fsn: key.fsn, tract: key.tract
  }).sort({ programYear: -1 }).lean();
}

// All filings for an FSA key, oldest → newest, for fsaHistory archival.
async function allFilingsFor(key) {
  return FsaFiling.find({
    entity: key.entity, fsn: key.fsn, tract: key.tract
  }).sort({ programYear: 1 }).lean();
}

async function applyBinding(field, rule) {
  const latest = await latestFilingFor(rule.fsaKey);
  if (!latest) {
    return { skipped: true, reason: `no FsaFiling matches ${JSON.stringify(rule.fsaKey)}` };
  }
  const history = await allFilingsFor(rule.fsaKey);
  const historyEntries = history.map(h => ({
    programYear: h.programYear,
    fsn: h.fsn,
    tract: h.tract,
    owner: h.leaseHolder,
    acres: h.acres,
    leaseType: h.leaseType,
    source: h.source,
    appliedAt: new Date()
  }));

  if (DRY_RUN) {
    return { dryRun: true, latest, historyCount: history.length };
  }

  await M77Field.collection.updateOne(
    { _id: field._id },
    {
      $set: {
        fsaFarmSerial: latest.fsn,
        fsaTract: latest.tract,
        fsaLeaseHolderName: latest.leaseHolder,
        fsaLeasedAcres: latest.acres,
        fsaLeaseType: latest.leaseType,
        fsaCounty: latest.county,
        fsaProgramYear: latest.programYear,
        legacyFsaFarm: rule.legacy?.fsaFarm || field.legacyFsaFarm,
        legacyFsaTract: rule.legacy?.fsaTract || field.legacyFsaTract,
        needsFsaAssignment: false,
        fsaHistory: historyEntries
      }
    }
  );
  return { applied: true, programYear: latest.programYear, leaseHolder: latest.leaseHolder };
}

async function bindFields() {
  // Pre-load excluded clients so we can skip their fields in one pass.
  const excludedClients = await Client.find({
    name: { $in: Array.from(CLIENTS_EXCLUDED_FROM_FSA) }
  }).select('_id name');
  const excludedIds = new Set(excludedClients.map(c => String(c._id)));

  let bound = 0, markedNeedsAssignment = 0, alreadyHadFsa = 0, skippedExcluded = 0;
  const allFields = await M77Field.find({})
    .populate('client', 'name')
    .populate('farm', 'name');

  for (const field of allFields) {
    const cid = String(field.client?._id || field.client);
    if (excludedIds.has(cid)) { skippedExcluded++; continue; }

    // Skip if already linked to a binding-driven FSA record. The script is
    // idempotent: once Atkins/Barkey are stamped, re-runs are no-ops.
    let matchedRule = null;
    for (const rule of FIELD_BINDINGS) {
      if (rule.matchAny.some(rx => rx.test(field.name))) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      const result = await applyBinding(field, matchedRule);
      if (result.applied || result.dryRun) bound++;
      continue;
    }

    if (field.fsaFarmSerial) { alreadyHadFsa++; continue; }
    if (field.needsFsaAssignment) { continue; }

    // No FSA data and no rule fires — flag for manual assignment.
    if (!DRY_RUN) {
      await M77Field.collection.updateOne(
        { _id: field._id },
        { $set: { needsFsaAssignment: true } }
      );
    }
    markedNeedsAssignment++;
  }
  return { bound, markedNeedsAssignment, alreadyHadFsa, skippedExcluded };
}

// ---------------------------------------------------------------------------

(async () => {
  console.log('='.repeat(60));
  console.log('FSA filings ingest + binding pass');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('\nIngesting FSA filings ...');
    const ing = await ingestFilings();
    console.log(`  inserted=${ing.inserted} updated=${ing.updated} total=${ing.total}`);

    console.log('\nBinding fields to FSA records ...');
    const bind = await bindFields();
    console.log(`  bound=${bind.bound} markedNeedsAssignment=${bind.markedNeedsAssignment} alreadyHadFsa=${bind.alreadyHadFsa} skippedExcluded=${bind.skippedExcluded}`);

    const filings = await FsaFiling.countDocuments();
    const needs = await M77Field.countDocuments({ needsFsaAssignment: true });
    const linked = await M77Field.countDocuments({ fsaFarmSerial: { $ne: null } });
    console.log('\nAfter counts:');
    console.log(`  fsaFilings collection : ${filings}`);
    console.log(`  M77Fields with FSA    : ${linked}`);
    console.log(`  M77Fields needing FSA : ${needs}`);

    console.log('\nDone.');
  } catch (err) {
    console.error('\nFSA ingest failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
})();
