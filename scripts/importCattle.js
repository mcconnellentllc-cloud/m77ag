/**
 * Import cattle data from CSV into MongoDB
 * Run: node scripts/importCattle.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Cattle model
const Cattle = require('../server/models/cattle');

const CSV_PATH = path.join(__dirname, '../data/imports/cattle.csv');

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  return records;
}

function mapTagColor(color) {
  const colorMap = {
    'Yellow': 'Yellow',
    'Blue': 'Blue',
    'Green': 'Green',
    'White': 'White',
    'Purple': 'Purple',
    'Orange': 'Orange',
    'Red': 'Red',
    'Pink': 'Pink',
    'Black': 'Black'
  };
  return colorMap[color] || 'Other';
}

async function importCattle() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Parse CSV
    const records = await parseCSV(CSV_PATH);
    console.log(`Found ${records.length} records to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of records) {
      const tagNumber = row.tag_number;

      if (!tagNumber) {
        errors++;
        continue;
      }

      // Check if already exists
      const exists = await Cattle.findOne({ tagNumber: String(tagNumber) });
      if (exists) {
        console.log(`Skipping ${tagNumber} - already exists`);
        skipped++;
        continue;
      }

      // Build calving records
      const annualCalvingRecords = [];

      // 2024 calving - "31" means had calf that survived to weaning
      if (row.calf_wt_2024 === '31') {
        annualCalvingRecords.push({
          year: 2024,
          hadCalf: true,
          calfSurvived: true,
          notes: 'Calf survived to weaning'
        });
      }

      // 2023 weaning weight
      const ww2023 = parseInt(row.ww_2023);
      if (ww2023 > 0) {
        annualCalvingRecords.push({
          year: 2023,
          hadCalf: true,
          calfSurvived: true,
          weaningWeight: ww2023
        });
      }

      // 2022 calf
      if (row.calf_2022 && row.calf_2022 !== '0') {
        annualCalvingRecords.push({
          year: 2022,
          hadCalf: true,
          calfSurvived: true
        });
      }

      // Calculate birth date from birth_year
      let birthDate = null;
      const birthYear = parseInt(row.birth_year);
      if (birthYear > 0) {
        birthDate = new Date(`${birthYear}-03-01`); // Assume March 1 for spring calvers
      } else {
        // Estimate based on tag number pattern
        // 6xxx = 2016, 2316-2325 = 2023, 2426-2432 = 2024, 2201-2215 = 2022
        const tag = parseInt(tagNumber);
        if (tag >= 6000 && tag < 7000) {
          birthDate = new Date('2016-03-01');
        } else if (tag >= 2316 && tag <= 2325) {
          birthDate = new Date('2023-03-01');
        } else if (tag >= 2426 && tag <= 2432) {
          birthDate = new Date('2024-03-01');
        } else if (tag >= 2201 && tag <= 2215) {
          birthDate = new Date('2022-03-01');
        } else {
          birthDate = new Date('2018-03-01'); // Default estimate
        }
      }

      // Build cattle document
      const cattleData = {
        tagNumber: String(tagNumber),
        type: 'cow',  // All are breeding cows
        breed: 'Angus',
        owner: row.owner || 'M77',
        tagColor: mapTagColor(row.tag_color),
        calvingGroup: row.group_name === 'SPRING' ? 'SPRING' : 'FALL',
        birthDate: birthDate,
        status: 'active',
        annualCalvingRecords: annualCalvingRecords.length > 0 ? annualCalvingRecords : undefined
      };

      // Add dam info if available
      if (row.dam_tag && row.dam_tag !== 'NT' && row.dam_tag !== '') {
        cattleData.dam = {
          tagNumber: String(row.dam_tag)
        };
      }

      // Add yearling weight if available
      const yw = parseInt(row.yearling_weight);
      if (yw > 0) {
        cattleData.weightRecords = [{
          date: new Date(`${birthYear + 1}-10-01`),  // Yearling weight around October
          weight: yw,
          notes: 'Yearling weight'
        }];
      }

      try {
        const cattle = new Cattle(cattleData);
        await cattle.save();
        console.log(`Imported: ${tagNumber} (${row.tag_color})`);
        imported++;
      } catch (err) {
        console.error(`Error importing ${tagNumber}:`, err.message);
        errors++;
      }
    }

    console.log('\n--- Import Complete ---');
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the import
importCattle();
