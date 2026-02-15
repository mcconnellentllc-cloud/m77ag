/**
 * Vehicles Capital Investment Seed Data
 * Run: node server/seeds/vehicles-capital.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CapitalInvestment = require('../models/capitalInvestment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Market values researched Jan 2026 using KBB, Edmunds, CARFAX, ClassicCars.com
// Values calculated at 85% of market spread per user directive
const vehicleData = [
  // Farm Trucks - Combined loan account *9803
  {
    name: '2011 Ford F-250 (Grey)',
    type: 'vehicle',
    category: 'truck',
    description: 'Grey 2011 Ford F-250 work truck',
    vehicleDetails: {
      year: 2011,
      make: 'Ford',
      model: 'F-250',
      color: 'Grey'
    },
    acquisition: {
      notes: 'Farm work truck'
    },
    currentValue: {
      estimatedValue: 14600,  // 85% of KBB $14,650-$19,700 Crew Cab range
      lastAppraisalDate: new Date('2026-01-30'),
      notes: 'KBB Crew Cab XL-Lariat range: $14,650-$19,700'
    },
    loans: [
      {
        lender: 'Bank (Account *9803 - Pickups)',
        originalAmount: 0,
        currentBalance: 11266.57,  // Half of $22,533.13 total
        interestRate: 0,
        paymentAmount: 5973.43,  // Half of $11,946.85
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-09-15'),
        notes: 'Pickups loan (shared) - total $22,533.13, payment $11,946.85 due 09/15/2026'
      }
    ],
    status: 'owned',
    notes: 'Personal/Farm vehicle - Loan account *9803'
  },
  {
    name: '2011 Dodge Ram 1500',
    type: 'vehicle',
    category: 'truck',
    description: '2011 Dodge Ram 1500 pickup truck',
    vehicleDetails: {
      year: 2011,
      make: 'Dodge',
      model: 'Ram 1500'
    },
    acquisition: {
      notes: 'Farm work truck'
    },
    currentValue: {
      estimatedValue: 6800,  // 85% of KBB $6,518-$9,525 range
      lastAppraisalDate: new Date('2026-01-30'),
      notes: 'KBB Crew Cab ST: $9,525 resale, $4,775 trade-in'
    },
    loans: [
      {
        lender: 'Bank (Account *9803 - Pickups)',
        originalAmount: 0,
        currentBalance: 11266.56,  // Half of $22,533.13 total
        interestRate: 0,
        paymentAmount: 5973.42,  // Half of $11,946.85
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-09-15'),
        notes: 'Pickups loan (shared) - total $22,533.13, payment $11,946.85 due 09/15/2026'
      }
    ],
    status: 'owned',
    notes: 'Personal/Farm vehicle - Loan account *9803'
  },

  // Personal Vehicles
  {
    name: 'Cadillac Escalade',
    type: 'vehicle',
    category: 'car',
    description: 'Cadillac Escalade SUV',
    vehicleDetails: {
      make: 'Cadillac',
      model: 'Escalade',
      mileage: 104000
    },
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 20900,  // 85% of 2018 KBB $16,602-$32,622 avg ~$24,600
      lastAppraisalDate: new Date('2026-01-30'),
      notes: '2018 model range per KBB/CARFAX with high mileage'
    },
    status: 'owned',
    notes: 'Personal vehicle - 104,000 miles'
  },
  {
    name: 'Toyota Camry',
    type: 'vehicle',
    category: 'car',
    description: "Brandi's Grey Camry",
    vehicleDetails: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Grey'
    },
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 14700,  // 85% of KBB 2020 LE $15,950-$18,700 range
      lastAppraisalDate: new Date('2026-01-30'),
      notes: '2020-2021 Camry LE range per KBB'
    },
    status: 'owned',
    notes: 'Personal vehicle'
  },
  {
    name: 'Pontiac Trans Am',
    type: 'vehicle',
    category: 'car',
    description: '1979 Pontiac Trans Am',
    vehicleDetails: {
      year: 1979,
      make: 'Pontiac',
      model: 'Trans AM',
      vin: '2W87K9L155721',
      mileage: 65000
    },
    acquisition: {
      purchasePrice: 6753,
      notes: 'Classic/Collector vehicle'
    },
    currentValue: {
      estimatedValue: 23000,  // 85% of ClassicCars.com $16,900-$37,500 range avg ~$27,000
      lastAppraisalDate: new Date('2026-01-30'),
      notes: 'Classic car - ClassicCars.com/Hagerty. BaT sold similar for $37,500 Jan 2026'
    },
    status: 'owned',
    notes: 'Personal vehicle - Unit #57, Title: 37E061442'
  },

  // RV
  {
    name: 'Monaco Diplomat RV',
    type: 'vehicle',
    category: 'rv',
    description: '2001 Roadmaster Diplomat RV',
    vehicleDetails: {
      year: 2001,
      make: 'Roadmaster',
      model: 'Diplomat',
      vin: '1RF12051312013422',
      mileage: 92000
    },
    acquisition: {
      purchasePrice: 37878,
      notes: 'Recreational vehicle'
    },
    currentValue: {
      estimatedValue: 34000,  // 85% of $30,000-$50,000 range avg ~$40,000
      lastAppraisalDate: new Date('2026-01-30'),
      notes: 'J.D. Power/SmartRVGuide comparable 2001 Diplomat listings'
    },
    loans: [
      {
        lender: 'RV Loan',
        currentBalance: 28274.95,
        notes: 'Unit #58'
      }
    ],
    status: 'owned',
    notes: 'Recreational vehicle - Unit #58'
  }
];

async function seedVehicles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if vehicle data already exists
    const existing = await CapitalInvestment.findOne({ type: 'vehicle' });
    if (existing) {
      console.log('Vehicle data already exists. Skipping seed.');
      console.log('To re-seed, first delete existing vehicle entries.');
      await mongoose.disconnect();
      return;
    }

    // Insert vehicle data
    const result = await CapitalInvestment.insertMany(vehicleData);
    console.log(`Successfully seeded ${result.length} vehicles:`);
    result.forEach(item => {
      console.log(`  - ${item.name}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding vehicle data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedVehicles();
}

module.exports = { vehicleData, seedVehicles };
