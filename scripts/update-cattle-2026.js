/**
 * Update cattle records with 2026 calving season data
 * Data sourced from M77 Angus calving spreadsheet (Feb 2026)
 *
 * Run: node scripts/update-cattle-2026.js
 *
 * Summary:
 *   Total Head: 50 (M77 Owned: 49, Gage: 1)
 *   Total Calves: 23, Live: 23, Dead: 0
 *   Percent Calved: 46%
 *   Heifers: 6, Steers/Bulls: 17
 *   Left to Calve: 27
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Cattle = require('../server/models/cattle');

// All 50 cattle records from the spreadsheet
// Fields: tagNumber, owner, tagColor, calfSex (bull/heifer/null), calfBirthDate,
//         calvingExpected (bool), calvingVerified (bool), cowBCS, maternalScore
const cattleRecords = [
  // Row 1: Tag 1 - M77, Yellow, Bull calf born 2/25/2026
  { tagNumber: '1', owner: 'M77', tagColor: 'Yellow', calfSex: 'bull', calfBirthDate: '2026-02-25', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 2: Tag 2 - M77, Blue, no calf yet
  { tagNumber: '2', owner: 'M77', tagColor: 'Blue', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 3: Tag 7 - M77, Green, no calf yet
  { tagNumber: '7', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 4: Tag 12 - M77, Green, Bull calf born 2/11/2026
  { tagNumber: '12', owner: 'M77', tagColor: 'Green', calfSex: 'bull', calfBirthDate: '2026-02-11', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 5: Tag 13 - M77, Green, no calf yet
  { tagNumber: '13', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 6: Tag 24 - M77, Green, calved 2/4/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '24', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 7: Tag 28 - M77, Blue, calved 2/5/2026, CALV E=1, CALV V=1, BCS=6, MTS=5
  { tagNumber: '28', owner: 'M77', tagColor: 'Blue', calfSex: null, calfBirthDate: '2026-02-05', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 5, hadCalf: true, comments: '' },
  // Row 8: Tag 36 - M77, Blue, Bull calf born 2/15/2026, CALV E=1, CALV V=1, BCS=7, MTS=2
  { tagNumber: '36', owner: 'M77', tagColor: 'Blue', calfSex: 'bull', calfBirthDate: '2026-02-15', calvExpected: true, calvVerified: true, cowBCS: 7, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 9: Tag 39 - GAGE, White, no calf yet
  { tagNumber: '39', owner: 'GAGE', tagColor: 'White', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 10: Tag 45 - M77, Green, no calf yet
  { tagNumber: '45', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 11: Tag 55 - M77, Blue, Bull calf born 2/27/2026, CALV E=1, CALV V=1, BCS=6, MTS=3
  { tagNumber: '55', owner: 'M77', tagColor: 'Blue', calfSex: 'bull', calfBirthDate: '2026-02-27', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 3, hadCalf: true, comments: '' },
  // Row 12: Tag 75 - M77, Blue, Heifer calf born 2/5/2026, CALV E=1, CALV V=1, BCS=6, MTS=5
  { tagNumber: '75', owner: 'M77', tagColor: 'Blue', calfSex: 'heifer', calfBirthDate: '2026-02-05', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 5, hadCalf: true, comments: '' },
  // Row 13: Tag 84 - M77, Purple, no calf yet
  { tagNumber: '84', owner: 'M77', tagColor: 'Purple', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 14: Tag 88 - M77, Blue, calved 2/4/2026, CALV E=1, CALV V=1, BCS=6, MTS=3
  { tagNumber: '88', owner: 'M77', tagColor: 'Blue', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 3, hadCalf: true, comments: '' },
  // Row 15: Tag 94 - M77, Purple, Heifer calf born 2/28/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '94', owner: 'M77', tagColor: 'Purple', calfSex: 'heifer', calfBirthDate: '2026-02-28', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 16: Tag 95 - M77, Purple, no calf yet
  { tagNumber: '95', owner: 'M77', tagColor: 'Purple', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 17: Tag 104 - M77, Purple, Bull calf born 2/8/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '104', owner: 'M77', tagColor: 'Purple', calfSex: 'bull', calfBirthDate: '2026-02-08', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 18: Tag 110 - M77, Blue, calved 2/4/2026, CALV E=1 only
  { tagNumber: '110', owner: 'M77', tagColor: 'Blue', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: true, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 19: Tag 1113 - M77, Green, Bull calf born 2/17/2026, CALV E=1 only
  { tagNumber: '1113', owner: 'M77', tagColor: 'Green', calfSex: 'bull', calfBirthDate: '2026-02-17', calvExpected: true, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 20: Tag 1032 - M77, Green, Bull calf born 2/13/2026
  { tagNumber: '1032', owner: 'M77', tagColor: 'Green', calfSex: 'bull', calfBirthDate: '2026-02-13', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 21: Tag 2201 - M77, Red, no calf yet
  { tagNumber: '2201', owner: 'M77', tagColor: 'Red', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 22: Tag 2203 - M77, Red, calved 2/4/2026, CALV E=1, CALV V=1, BCS=6
  { tagNumber: '2203', owner: 'M77', tagColor: 'Red', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: null, hadCalf: true, comments: '' },
  // Row 23: Tag 2206 - M77, Red, calved 2/4/2026, CALV E=1, CALV V=1, BCS=5
  { tagNumber: '2206', owner: 'M77', tagColor: 'Red', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: true, calvVerified: true, cowBCS: 5, maternalScore: null, hadCalf: true, comments: '' },
  // Row 24: Tag 2210 - M77, Red, no calf yet
  { tagNumber: '2210', owner: 'M77', tagColor: 'Red', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 25: Tag 2214 - M77, Red, Bull calf born 2/11/2026
  { tagNumber: '2214', owner: 'M77', tagColor: 'Red', calfSex: 'bull', calfBirthDate: '2026-02-11', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 26: Tag 2215 - M77, Red, no calf yet
  { tagNumber: '2215', owner: 'M77', tagColor: 'Red', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 27: Tag 2316 - M77, Orange, Bull calf born 2/10/2026, CALV E=1, CALV V=1, BCS=6, MTS=3
  { tagNumber: '2316', owner: 'M77', tagColor: 'Orange', calfSex: 'bull', calfBirthDate: '2026-02-10', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 3, hadCalf: true, comments: '' },
  // Row 28: Tag 2317 - M77, Orange, no calf yet
  { tagNumber: '2317', owner: 'M77', tagColor: 'Orange', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 29: Tag 2318 - M77, Orange, calved 2/4/2026
  { tagNumber: '2318', owner: 'M77', tagColor: 'Orange', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 30: Tag 2319 - M77, Orange, no calf yet
  { tagNumber: '2319', owner: 'M77', tagColor: 'Orange', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 31: Tag 2321 - M77, Orange, Heifer calf born 2/11/2026
  { tagNumber: '2321', owner: 'M77', tagColor: 'Orange', calfSex: 'heifer', calfBirthDate: '2026-02-11', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 32: Tag 2322 - M77, Orange, calved 2/1/2026
  { tagNumber: '2322', owner: 'M77', tagColor: 'Orange', calfSex: null, calfBirthDate: '2026-02-01', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 33: Tag 2324 - M77, Orange, Heifer calf born 2/12/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '2324', owner: 'M77', tagColor: 'Orange', calfSex: 'heifer', calfBirthDate: '2026-02-12', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 34: Tag 2325 - M77, Orange, Heifer calf born 2/12/2026
  { tagNumber: '2325', owner: 'M77', tagColor: 'Orange', calfSex: 'heifer', calfBirthDate: '2026-02-12', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 35: Tag 2426 - M77, Yellow, no calf yet
  { tagNumber: '2426', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 36: Tag 2427 - M77, Yellow, no calf yet
  { tagNumber: '2427', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 37: Tag 2428 - M77, Yellow, no calf yet
  { tagNumber: '2428', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 38: Tag 2429 - M77, Yellow, no calf yet
  { tagNumber: '2429', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 39: Tag 2430 - M77, Yellow, calved 2/4/2026
  { tagNumber: '2430', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: '2026-02-04', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 40: Tag 2431 - M77, Yellow, no calf yet
  { tagNumber: '2431', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 41: Tag 2432 - M77, Yellow, no calf yet
  { tagNumber: '2432', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 42: Tag 6059 - M77, Green, Bull calf born 2/15/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '6059', owner: 'M77', tagColor: 'Green', calfSex: 'bull', calfBirthDate: '2026-02-15', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 43: Tag 6064 - M77, Purple, no calf yet
  { tagNumber: '6064', owner: 'M77', tagColor: 'Purple', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 44: Tag 6069 - M77, Green, calved (no date/sex visible), CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '6069', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 45: Tag 6070 - M77, Yellow, Bull calf born 2/11/2026
  { tagNumber: '6070', owner: 'M77', tagColor: 'Yellow', calfSex: 'bull', calfBirthDate: '2026-02-11', calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: true, comments: '' },
  // Row 46: Tag 6072 - M77, Green, Heifer calf born 2/14/2026, CALV E=1, CALV V=1, BCS=6, MTS=2
  { tagNumber: '6072', owner: 'M77', tagColor: 'Green', calfSex: 'heifer', calfBirthDate: '2026-02-14', calvExpected: true, calvVerified: true, cowBCS: 6, maternalScore: 2, hadCalf: true, comments: '' },
  // Row 47: Tag 6078 - M77, Green, no calf yet
  { tagNumber: '6078', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 48: Tag 6084 - M77, Green, no calf yet
  { tagNumber: '6084', owner: 'M77', tagColor: 'Green', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 49: Tag 6085 - M77, Yellow, no calf yet
  { tagNumber: '6085', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' },
  // Row 50: Tag 6086 - M77, Yellow, no calf yet
  { tagNumber: '6086', owner: 'M77', tagColor: 'Yellow', calfSex: null, calfBirthDate: null, calvExpected: false, calvVerified: false, cowBCS: null, maternalScore: null, hadCalf: false, comments: '' }
];

async function updateCattle() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let updated = 0;
    let created = 0;
    let errors = 0;
    let noChange = 0;
    const errorDetails = [];

    for (const record of cattleRecords) {
      try {
        // Find existing cattle record
        let cattle = await Cattle.findOne({ tagNumber: record.tagNumber });

        if (!cattle) {
          // Create new record if it does not exist
          console.log(`Creating new record for tag ${record.tagNumber}`);

          // Estimate birth date from tag number pattern
          let birthDate;
          const tag = parseInt(record.tagNumber);
          if (tag >= 6000 && tag < 7000) {
            birthDate = new Date('2016-03-01');
          } else if (tag >= 2316 && tag <= 2325) {
            birthDate = new Date('2023-03-01');
          } else if (tag >= 2426 && tag <= 2432) {
            birthDate = new Date('2024-03-01');
          } else if (tag >= 2201 && tag <= 2215) {
            birthDate = new Date('2022-03-01');
          } else if (tag >= 1000 && tag < 2000) {
            birthDate = new Date('2019-03-01');
          } else {
            birthDate = new Date('2018-03-01');
          }

          cattle = new Cattle({
            tagNumber: record.tagNumber,
            type: 'cow',
            breed: 'Angus',
            owner: record.owner,
            tagColor: record.tagColor,
            calvingGroup: 'SPRING',
            birthDate: birthDate,
            status: 'active',
            annualCalvingRecords: []
          });

          created++;
        }

        // Update owner and tag color to match spreadsheet
        cattle.owner = record.owner;
        cattle.tagColor = record.tagColor;

        // Build 2026 annual calving record if cow has calved
        if (record.hadCalf) {
          // Initialize annualCalvingRecords if needed
          if (!cattle.annualCalvingRecords) {
            cattle.annualCalvingRecords = [];
          }

          const calvingRecord = {
            year: 2026,
            hadCalf: true,
            calfSurvived: true,  // All 23 calves are alive per spreadsheet (Dead: 0)
            calfSex: record.calfSex || undefined,
            calfBirthDate: record.calfBirthDate ? new Date(record.calfBirthDate) : undefined,
            cowBCS: record.cowBCS || undefined,
            maternalScore: record.maternalScore || undefined,
            calvingEase: record.calvExpected ? 1 : undefined,
            notes: '2026 spring calving season'
          };

          // Check if 2026 record already exists
          const existingIndex = cattle.annualCalvingRecords.findIndex(r => r.year === 2026);
          if (existingIndex >= 0) {
            cattle.annualCalvingRecords[existingIndex] = calvingRecord;
          } else {
            cattle.annualCalvingRecords.push(calvingRecord);
          }

          updated++;
        } else {
          // No calf yet - just ensure record exists and is up to date
          noChange++;
        }

        await cattle.save();
        console.log(`Tag ${record.tagNumber}: ${record.hadCalf ? 'Updated with 2026 calf data' : 'No calf yet - record confirmed'} (${record.owner}, ${record.tagColor}${record.calfSex ? ', ' + record.calfSex + ' calf' : ''}${record.calfBirthDate ? ', born ' + record.calfBirthDate : ''})`);

      } catch (err) {
        errors++;
        errorDetails.push({ tag: record.tagNumber, error: err.message });
        console.error(`Error processing tag ${record.tagNumber}: ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log('  2026 CALVING RECORD UPDATE COMPLETE');
    console.log('========================================');
    console.log(`Records with 2026 calf data: ${updated}`);
    console.log(`New records created: ${created}`);
    console.log(`Records confirmed (no calf yet): ${noChange}`);
    console.log(`Errors: ${errors}`);
    if (errorDetails.length > 0) {
      console.log('\nError details:');
      errorDetails.forEach(e => console.log(`  Tag ${e.tag}: ${e.error}`));
    }

    // Verify counts match spreadsheet
    console.log('\n--- Verification ---');
    const totalActive = await Cattle.countDocuments({ status: 'active' });
    const withCalves2026 = await Cattle.countDocuments({
      'annualCalvingRecords.year': 2026,
      'annualCalvingRecords.hadCalf': true
    });
    console.log(`Total active cattle in DB: ${totalActive}`);
    console.log(`Cattle with 2026 calves in DB: ${withCalves2026}`);
    console.log(`Expected from spreadsheet: 23 calves out of 50 head`);

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the update
updateCattle();
