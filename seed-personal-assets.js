/**
 * Seed Personal Assets for Kyle & Brandi McConnell
 * and McConnell Enterprises LLC assets (forklifts)
 *
 * Run: node seed-personal-assets.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CapitalInvestment = require('./server/models/capitalInvestment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Kyle & Brandi Personal Vehicles
// NOTE: Estimated values are placeholders - update with actual values
const personalVehicles = [
  {
    name: 'RV',
    type: 'other',
    category: 'other',
    description: 'Recreational Vehicle',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  },
  {
    name: 'Pontiac Trans Am',
    type: 'other',
    category: 'other',
    description: 'Classic Car',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  },
  {
    name: '2011 Ford F-250',
    type: 'other',
    category: 'other',
    description: '2011 Ford F-250 Pickup Truck',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  },
  {
    name: '2011 Dodge Ram 1500',
    type: 'other',
    category: 'other',
    description: '2011 Dodge Ram 1500 Pickup Truck',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  },
  {
    name: 'Cadillac Escalade',
    type: 'other',
    category: 'other',
    description: 'Cadillac Escalade SUV',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  },
  {
    name: 'Toyota Camry',
    type: 'other',
    category: 'other',
    description: 'Toyota Camry Sedan',
    location: { associatedFarm: 'PERSONAL' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'Kyle & Brandi McConnell - Personal Asset'
  }
];

// McConnell Enterprises LLC Assets
const mceAssets = [
  {
    name: 'Forklift #1',
    type: 'other',
    category: 'other',
    description: 'McConnell Enterprises LLC - Forklift',
    location: { associatedFarm: 'MCE' },
    status: 'owned',
    currentValue: { estimatedValue: 0 }, // TODO: Enter actual value
    notes: 'McConnell Enterprises LLC Asset'
  }
];

async function seedAssets() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed personal vehicles
    console.log('\n--- Seeding Kyle & Brandi Personal Vehicles ---');
    for (const vehicle of personalVehicles) {
      const existing = await CapitalInvestment.findOne({
        name: vehicle.name,
        'location.associatedFarm': 'PERSONAL'
      });

      if (existing) {
        console.log(`  Already exists: ${vehicle.name}`);
      } else {
        await CapitalInvestment.create(vehicle);
        console.log(`  Created: ${vehicle.name}`);
      }
    }

    // Seed MCE assets
    console.log('\n--- Seeding McConnell Enterprises Assets ---');
    for (const asset of mceAssets) {
      const existing = await CapitalInvestment.findOne({
        name: asset.name,
        'location.associatedFarm': 'MCE'
      });

      if (existing) {
        console.log(`  Already exists: ${asset.name}`);
      } else {
        await CapitalInvestment.create(asset);
        console.log(`  Created: ${asset.name}`);
      }
    }

    console.log('\nDone! Assets seeded successfully.');
    console.log('\nNOTE: All values are set to $0. Update with actual values via:');
    console.log('  - The admin dashboard');
    console.log('  - Or the API: PUT /api/capital-investments/:id');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding assets:', error);
    process.exit(1);
  }
}

seedAssets();
