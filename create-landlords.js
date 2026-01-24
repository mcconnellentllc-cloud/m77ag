// Script to create landlord accounts for M77 AG Land Management
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./server/models/user');

// Landlords based on M77AG Master Workbook
const landlords = [
  {
    name: 'HD Farms',
    email: 'hdfarms@m77ag.com',
    identifier: 'HDFARMS',
    farms: ['HDFARMS']
  },
  {
    name: 'KB Farms',
    email: 'kbfarms@m77ag.com',
    identifier: 'KBFARMS',
    farms: ['KBFARMS']
  },
  {
    name: 'LA Farms',
    email: 'lafarms@m77ag.com',
    identifier: 'LAFARMS',
    farms: ['LAFARMS']
  },
  {
    name: 'ME Farms',
    email: 'mefarms@m77ag.com',
    identifier: 'MEFARMS',
    farms: ['MEFARMS']
  },
  {
    name: 'Peterson Farms',
    email: 'peterson@m77ag.com',
    identifier: 'PETERSON',
    farms: ['PETERSON']
  },
  {
    name: 'A1 Farms',
    email: 'a1farms@m77ag.com',
    identifier: 'A1FARMS',
    farms: ['A1FARMS']
  },
  {
    name: 'Vandenbark',
    email: 'vandenbark@m77ag.com',
    identifier: 'VANDENBARK',
    farms: ['VANDENBARK']
  }
];

async function createLandlords() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    console.log('='.repeat(80));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const landlord of landlords) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: landlord.email });

      if (existingUser) {
        // Update to landlord role if not already
        if (existingUser.role !== 'landlord') {
          existingUser.role = 'landlord';
          existingUser.firstName = landlord.name.split(' ')[0];
          existingUser.lastName = landlord.name.split(' ').slice(1).join(' ') || 'Farms';
          await existingUser.save();
          console.log(`✓ Updated ${landlord.name} to landlord role`);
          updated++;
        } else {
          console.log(`- Skipped ${landlord.name} (already exists as landlord)`);
          skipped++;
        }
      } else {
        // Create new landlord account
        const newLandlord = await User.create({
          username: landlord.identifier.toLowerCase(),
          email: landlord.email,
          password: 'Farm2026',
          role: 'landlord',
          firstName: landlord.name.split(' ')[0],
          lastName: landlord.name.split(' ').slice(1).join(' ') || 'Farms',
          phone: '970-774-3276'  // M77 AG office number
        });

        console.log(`✓ Created ${landlord.name} (${landlord.email})`);
        created++;
      }
    }

    console.log('='.repeat(80));
    console.log(`\nSummary:`);
    console.log(`  Created: ${created} landlords`);
    console.log(`  Updated: ${updated} landlords`);
    console.log(`  Skipped: ${skipped} landlords`);
    console.log(`  Total: ${landlords.length} landlords`);
    console.log(`\nAll landlord accounts use password: Farm2026`);
    console.log('='.repeat(80));

    await mongoose.connection.close();

  } catch (error) {
    console.error('Error creating landlord accounts:', error.message);
    process.exit(1);
  }
}

createLandlords();
