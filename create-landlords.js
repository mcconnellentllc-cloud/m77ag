// Create landlord accounts for M77 AG
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/user');

const landlords = [
  {
    name: 'Peterson Farms',
    email: 'peterson@m77ag.com',
    phone: '970-774-3276',
    password: 'Bushelbuster',
    landlordFarms: ['PETERSON']
  },
  {
    name: 'McConnell Farms',
    email: 'mcconnell@m77ag.com',
    phone: '970-774-3276',
    password: 'Hangon00',
    landlordFarms: ['KBFARMS', 'LAFARMS', 'HDFARMS', 'MEFARMS', 'A1FARMS']
  },
  {
    name: 'Dorothy McConnell',
    email: 'gigi@m77ag.com',
    phone: '970-774-3276',
    password: 'Dorothy',
    landlordFarms: ['HDFARMS']
  }
];

async function createLandlords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('='.repeat(60));

    let created = 0;
    let updated = 0;

    for (const ll of landlords) {
      const existing = await User.findOne({ email: ll.email });

      if (existing) {
        // Update role, farms, and password
        existing.role = 'landlord';
        existing.landlordFarms = ll.landlordFarms;
        existing.name = ll.name;
        existing.password = ll.password;
        existing.isActive = true;
        await existing.save();
        console.log(`  Updated: ${ll.name} (${ll.email}) -> farms: ${ll.landlordFarms.join(', ') || 'none assigned'}`);
        updated++;
      } else {
        await User.create({
          name: ll.name,
          email: ll.email,
          phone: ll.phone,
          password: ll.password,
          role: 'landlord',
          isActive: true,
          emailVerified: true,
          landlordFarms: ll.landlordFarms
        });
        console.log(`  Created: ${ll.name} (${ll.email}) -> farms: ${ll.landlordFarms.join(', ') || 'none assigned'}`);
        created++;
      }
    }

    console.log('='.repeat(60));
    console.log(`Created: ${created}, Updated: ${updated}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createLandlords();
