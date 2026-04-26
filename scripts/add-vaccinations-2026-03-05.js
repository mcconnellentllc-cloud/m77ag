/**
 * Add Spring 2026 Vaccination Records to Individual Calf Records
 * Treatment Date: March 5, 2026
 * Location: Haxtun, CO
 *
 * Medications (6 cc total per calf):
 *   1. Vision 7 with SPUR (Merck) — 2 cc SQ — Clostridial Bacterin-Toxoid
 *   2. Pyramid 5 (Boehringer Ingelheim) — 2 cc IM — Modified Live Virus (MLV)
 *   3. Endovac-Beef with Immune Plus — 2 cc SQ — Salmonella Bacterin-Toxoid
 *
 * Total: 38 head treated, 228 cc total
 *
 * Run: node scripts/add-vaccinations-2026-03-05.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Cattle = require('../server/models/cattle');

const TREATMENT_DATE = new Date('2026-03-05');

// The three vaccinations administered to every calf
const vaccinations = [
  {
    date: TREATMENT_DATE,
    type: 'vaccination',
    product: 'Vision 7 with SPUR (Merck)',
    dosage: '2 cc',
    route: 'subcutaneous',
    notes: 'Clostridial Bacterin-Toxoid. Protects against 7 clostridial diseases: Blackleg (C. chauvoei), Malignant Edema (C. septicum), Black Disease (C. novyi), Enterotoxemia/Overeating Disease (C. perfringens Types C & D). SPUR adjuvant for enhanced immune response.'
  },
  {
    date: TREATMENT_DATE,
    type: 'vaccination',
    product: 'Pyramid 5 (Boehringer Ingelheim)',
    dosage: '2 cc',
    route: 'intramuscular',
    notes: 'Modified Live Virus (MLV). Respiratory protection: IBR (Bovine Rhinotracheitis), BVD Types 1 & 2, PI3 (Parainfluenza 3), BRSV (Bovine Respiratory Syncytial Virus). Prevents BRD/Shipping Fever.'
  },
  {
    date: TREATMENT_DATE,
    type: 'vaccination',
    product: 'Endovac-Beef with Immune Plus',
    dosage: '2 cc',
    route: 'subcutaneous',
    notes: 'Salmonella Bacterin-Toxoid. Protects against endotoxin-mediated diseases: E. coli, Salmonella typhimurium, Pasteurella multocida, Mannheimia haemolytica. Immune Plus adjuvant stimulates humoral and cell-mediated immunity.'
  }
];

// All 38 calves treated on March 5, 2026
const treatedCalves = [
  { tagNumber: '2316', tagColor: 'Orange', sex: 'steer', notes: '' },
  { tagNumber: '6059', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '2321', tagColor: 'Orange', sex: 'heifer', notes: '' },
  { tagNumber: '95', tagColor: 'Purple', sex: 'steer', notes: '' },
  { tagNumber: '36', tagColor: 'Blue', sex: 'steer', notes: '' },
  { tagNumber: '0001', tagColor: 'Yellow', sex: 'steer', notes: 'Not on master sheet' },
  { tagNumber: '7', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '2430', tagColor: 'Yellow', sex: 'heifer', notes: '' },
  { tagNumber: '1032', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '6069', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '45', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '55', tagColor: 'Blue', sex: 'steer', notes: '' },
  { tagNumber: '110', tagColor: 'Blue', sex: 'heifer', notes: '' },
  { tagNumber: '6070', tagColor: 'Yellow', sex: 'steer', notes: '' },
  { tagNumber: '2324', tagColor: 'Orange', sex: 'heifer', notes: '' },
  { tagNumber: '2210', tagColor: 'Red', sex: 'steer', notes: '' },
  { tagNumber: '2426', tagColor: 'Yellow', sex: 'steer', notes: '' },
  { tagNumber: '2214', tagColor: 'Red', sex: 'steer', notes: '' },
  { tagNumber: '13', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '113', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '2318', tagColor: 'Orange', sex: 'heifer', notes: 'Froze short ears' },
  { tagNumber: '2206', tagColor: 'Red', sex: 'steer', notes: '' },
  { tagNumber: '84', tagColor: 'Purple', sex: 'heifer', notes: '' },
  { tagNumber: '104', tagColor: 'Purple', sex: 'steer', notes: '' },
  { tagNumber: '28', tagColor: 'Blue', sex: 'steer', notes: '' },
  { tagNumber: '6070G', tagColor: 'Green', sex: 'heifer', notes: 'Green tag 6070 (distinct from Yellow tag 6070)' },
  { tagNumber: '75', tagColor: 'Blue', sex: 'heifer', notes: '' },
  { tagNumber: '94', tagColor: 'Purple', sex: 'heifer', notes: '' },
  { tagNumber: '2203', tagColor: 'Red', sex: 'steer', notes: '' },
  { tagNumber: '6064', tagColor: 'Purple', sex: 'steer', notes: '' },
  { tagNumber: '24', tagColor: 'Green', sex: 'steer', notes: '' },
  { tagNumber: '2', tagColor: 'Blue', sex: 'heifer', notes: '' },
  { tagNumber: '2215', tagColor: 'Red', sex: 'steer', notes: '' },
  { tagNumber: '2325', tagColor: 'Orange', sex: 'heifer', notes: '' },
  { tagNumber: '2319', tagColor: 'Orange', sex: 'steer', notes: '' },
  { tagNumber: '2427', tagColor: 'Yellow', sex: 'steer', notes: '' },
  { tagNumber: '2317', tagColor: 'Orange', sex: 'steer', notes: 'Untagged - 2 ears' },
  { tagNumber: '2322', tagColor: 'Orange', sex: 'steer', notes: 'Untagged - 1.5 ears, froze' }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    let updated = 0;
    let created = 0;
    let skipped = 0;
    const issues = [];

    for (const calf of treatedCalves) {
      // Try to find existing record by tagNumber
      let record = await Cattle.findOne({ tagNumber: calf.tagNumber });

      if (record) {
        // Check if these vaccinations were already added (prevent duplicates)
        const alreadyHasVaccination = record.healthRecords?.some(
          h => h.product === 'Vision 7 with SPUR (Merck)' &&
               h.date && h.date.toISOString().startsWith('2026-03-05')
        );

        if (alreadyHasVaccination) {
          console.log(`  SKIP  Tag ${calf.tagNumber} (${calf.tagColor}) - vaccinations already recorded`);
          skipped++;
          continue;
        }

        // Check if this record is a cow/bull (dam) vs a calf
        const isMature = ['cow', 'bull', 'bred_heifer'].includes(record.type);
        if (isMature) {
          // This tag belongs to a dam, not the calf. The calf shares the dam's tag.
          // We need to find the calf record or note the conflict.
          const calfType = calf.sex === 'heifer' ? 'heifer' : 'steer';
          console.log(`  NOTE  Tag ${calf.tagNumber} (${calf.tagColor}) is a ${record.type} in DB. Adding vaccinations to the ${calfType} calf that shares this tag.`);

          // The calves that share dam tags likely don't have their own records yet.
          // Add the vaccination to the existing record's healthRecords since in many
          // operations, the calf records are managed alongside the dam until weaning.
          // We also add a note about it being the calf's vaccination.
          const calfVaccinations = vaccinations.map(v => ({
            ...v,
            notes: `[CALF VACCINATION - ${calfType}] ${v.notes}${calf.notes ? ' | ' + calf.notes : ''}`
          }));

          await Cattle.findByIdAndUpdate(record._id, {
            $push: { healthRecords: { $each: calfVaccinations } }
          });

          updated++;
          console.log(`  OK    Tag ${calf.tagNumber} (${calf.tagColor} ${calf.sex}) - 3 vaccinations added to dam record (calf shares tag)`);
          continue;
        }

        // Record exists and is a calf/steer/heifer - add vaccinations directly
        const calVax = vaccinations.map(v => ({
          ...v,
          notes: v.notes + (calf.notes ? ' | ' + calf.notes : '')
        }));

        await Cattle.findByIdAndUpdate(record._id, {
          $push: { healthRecords: { $each: calVax } }
        });

        // Update type if needed (e.g., 'calf' -> 'steer' or 'heifer')
        const correctType = calf.sex === 'heifer' ? 'heifer' : 'steer';
        if (record.type === 'calf') {
          await Cattle.findByIdAndUpdate(record._id, { type: correctType });
        }

        updated++;
        console.log(`  OK    Tag ${calf.tagNumber} (${calf.tagColor} ${calf.sex}) - 3 vaccinations added`);

      } else {
        // Record doesn't exist - create a new calf record
        const calfType = calf.sex === 'heifer' ? 'heifer' : 'steer';

        try {
          const newCalf = await Cattle.create({
            tagNumber: calf.tagNumber,
            tagColor: calf.tagColor,
            type: calfType,
            breed: 'Commercial',
            owner: 'M77',
            status: 'active',
            calvingGroup: 'SPRING',
            birthDate: new Date('2026-02-15'), // Approximate - spring 2026 calf
            notes: calf.notes || undefined,
            healthRecords: vaccinations.map(v => ({
              ...v,
              notes: v.notes + (calf.notes ? ' | ' + calf.notes : '')
            }))
          });

          created++;
          console.log(`  NEW   Tag ${calf.tagNumber} (${calf.tagColor} ${calfType}) - created with 3 vaccinations`);
        } catch (err) {
          if (err.code === 11000) {
            issues.push(`Tag ${calf.tagNumber} (${calf.tagColor}) - duplicate key error, could not create`);
            console.log(`  ERR   Tag ${calf.tagNumber} (${calf.tagColor}) - duplicate key error`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('VACCINATION UPDATE SUMMARY');
    console.log('========================================');
    console.log(`Treatment Date: March 5, 2026`);
    console.log(`Medications: Vision 7 w/ SPUR, Pyramid 5, Endovac-Beef`);
    console.log(`Dosage: 6 cc per head (2 cc each)`);
    console.log('----------------------------------------');
    console.log(`Records updated:  ${updated}`);
    console.log(`Records created:  ${created}`);
    console.log(`Already recorded: ${skipped}`);
    console.log(`Total processed:  ${updated + created + skipped}`);
    if (issues.length > 0) {
      console.log('\nISSUES:');
      issues.forEach(i => console.log(`  - ${i}`));
    }
    console.log('========================================\n');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
