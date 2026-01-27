/**
 * KB Farms Capital Investment Seed Data
 * Run: node server/seeds/kbfarms-capital.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CapitalInvestment = require('../models/capitalInvestment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const kbFarmsData = [
  // PAULI SECTION - SW & SE Quarters of 17-6-47
  {
    name: 'Pauli Section',
    type: 'land',
    category: 'pasture',
    description: 'SW & SE quarters of Section 17-6-47 - Pauli family land with crop ground and pasture. 4 miles of new barb wire fencing.',
    location: {
      legalDescription: 'SW & SE 17-6-47',
      county: 'Phillips',
      state: 'CO',
      parcelNumber: 'FSA 3720-3815',
      associatedFarm: 'KB Farms',
      gpsCoordinates: {
        lat: 40.1847,
        lng: -102.3892
      }
    },
    landDetails: {
      totalAcres: 333.6,
      tillableAcres: 269.4,
      pastureAcres: 64.2,
      soilTypes: ['Hard'],
      floodZone: false
    },
    currentValue: {
      estimatedValue: 458610,  // 269.4 tillable × $1,500 + 64.2 pasture × $850
      valuePerAcre: 1375,
      lastAppraisalDate: new Date('2026-01-01'),
      notes: 'Based on NE Colorado 2025 land values: cropland $1,500/ac, pasture $850/ac'
    },
    improvements: [
      {
        date: new Date('2024-01-01'),
        description: '4 miles new barb wire fencing',
        cost: 0,
        category: 'fencing',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Solar well installation',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Bottomless tank',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      }
    ],
    loans: [
      {
        lender: 'Bank (Account *9767)',
        originalAmount: 0,
        currentBalance: 239659.90,
        interestRate: 0,
        paymentAmount: 38583.17,
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-03-01'),
        notes: 'Pauli Section loan - $38,583.17 due 03/01/2026'
      }
    ],
    status: 'owned',
    notes: `FSA Farm: 3720, Tract: 3815
Fields included:
- 23-24 (COMBO): 205.6 acres, SW 17-6-47
- 23 SW PAULI: 77.2 acres
- 23.E SW PAULI: 38.6 acres
- 23.W SW PAULI: 65.4 acres
- 24 SE PAULI: 128.4 acres, SE 17-6-47
- 24.E SE PAULI: 64.2 acres
- 24.W SE PAULI: 64.2 acres
Cross Roads: 3 & 8, 5 & 8
County: Phillips, Intersection: Northeast/Northwest`
  },

  // MICHAEL SECTION - NW, SW, SE Quarters of 13-9-47
  {
    name: 'Michael Section',
    type: 'land',
    category: 'cropland',
    description: 'NW, SW, SE quarters of Section 13-9-47 - Michael family land with crop ground, pasture, rental house, and outbuildings.',
    location: {
      legalDescription: 'NW, SW, SE 13-9-47',
      county: 'Sedgwick',
      state: 'CO',
      parcelNumber: 'FSA 3720-3815',
      associatedFarm: 'KB Farms',
      gpsCoordinates: {
        lat: 40.7234,
        lng: -102.2145
      }
    },
    landDetails: {
      totalAcres: 558.3,
      tillableAcres: 348.2,
      pastureAcres: 202.1,
      buildingSites: 1,
      soilTypes: ['Sand', 'Pasture'],
      floodZone: false
    },
    currentValue: {
      estimatedValue: 609310,  // 348.2 crop × $1,200 + 202.1 pasture × $700 + building site $50,000
      valuePerAcre: 1091,
      lastAppraisalDate: new Date('2026-01-01'),
      notes: 'Based on Sedgwick County 2025 values: cropland $1,200/ac, pasture $700/ac, plus rental house & outbuildings'
    },
    loans: [
      {
        lender: 'Bank (Account *9860)',
        originalAmount: 0,
        currentBalance: 319265.62,
        interestRate: 0,
        paymentAmount: 29502.43,
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-11-01'),
        notes: 'Michael Ground loan - $29,502.43 due 11/01/2026'
      }
    ],
    improvements: [
      {
        date: new Date('2024-01-01'),
        description: 'Brand new barb wire fence along highway',
        cost: 0,
        category: 'fencing',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Well with electricity',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: '5 outbuildings',
        cost: 0,
        category: 'outbuilding',
        addedToValue: true
      }
    ],
    income: {
      leaseType: 'cash_rent',
      notes: 'Rental house on property (298 HWY HOUSE - 8 acres building site)'
    },
    status: 'owned',
    notes: `FSA Farm: 3720, Tract: 3815
Fields included:
- 25.C NW MICHAEL CROP: 107.9 acres, NW13-9-47 (Crop)
- 25.P NW MICHAEL PASTURE: 52.1 acres, NW13-9-47 (Pasture)
- 27 NW MICHAEL: 80.3 acres, NW13-9-47
- 27.W NW MICHAEL: 40.9 acres
- 27.E NW MICHAEL: 39.4 acres
- 28 SW MICHAEL: 150.0 acres, NW13-9-47 (Pasture)
- 28.E SW MICHAEL: 78.0 acres, SW13-9-47
- 28.W SW MICHAEL: 72.0 acres, SW13-9-47
- 29 SE MICHAEL: 80.0 acres, SW13-9-47
- 29.N MICHAEL: 40.9 acres, SE13-9-47
- 29.S MICHAEL: 39.1 acres, SE13-9-47
- 298 HWY HOUSE: 8.0 acres (Building Site)
Cross Roads: 4&11, 2&11, 2&13
County: Sedgwick, Intersection: Southeast/Northeast/Northwest`
  },

  // NEAL'S PASTURE - NW4 17-7-48
  {
    name: "Neal's Pasture",
    type: 'land',
    category: 'pasture',
    description: "Neal's pasture land with new fencing, solar well, and stock tank. Fully paid off - no money owed.",
    location: {
      legalDescription: 'NW4 17-7-48',
      county: 'Logan',
      state: 'CO',
      parcelNumber: 'FSA 4210-4045',
      associatedFarm: 'KB Farms',
      gpsCoordinates: {
        lat: 40.5621,
        lng: -102.4532
      }
    },
    landDetails: {
      totalAcres: 149.7,
      pastureAcres: 143.3,
      wetlandAcres: 6.4,
      soilTypes: ['Pasture', 'Waste'],
      floodZone: false
    },
    currentValue: {
      estimatedValue: 93563,  // 149.7 × $625/ac (Logan County pasture)
      valuePerAcre: 625,
      lastAppraisalDate: new Date('2026-01-01'),
      notes: 'Based on Logan County 2025 pasture values: $500-$725/ac range'
    },
    loans: [], // Paid off - no loans
    improvements: [
      {
        date: new Date('2024-01-01'),
        description: 'New fence around entire property',
        cost: 0,
        category: 'fencing',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Solar powered well',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Stock tank',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      }
    ],
    status: 'owned',
    notes: `FSA Farm: 4210, Tract: 4045
Fields included:
- 201 BY NEAL'S: 143.3 acres, NW4 17-7-48 (Pasture)
- 299 BY NEALS: 6.4 acres, NW4 17-7-48 (Waste)
Cross Roads: 87 & 22
County: Logan, Intersection: Southeast
PAID OFF - No money owed`
  },

  // MADSEN PASTURE - 202 SECTION
  {
    name: 'Madsen Pasture',
    type: 'land',
    category: 'pasture',
    description: 'Madsen pasture with 25,000 bushel grain storage, well with electricity, and small corral system.',
    location: {
      legalDescription: '17-6-47',
      county: 'Phillips',
      state: 'CO',
      parcelNumber: 'FSA 4210-3815',
      associatedFarm: 'KB Farms',
      gpsCoordinates: {
        lat: 40.3421,
        lng: -102.3156
      }
    },
    landDetails: {
      totalAcres: 114.7,
      pastureAcres: 114.7,
      soilTypes: ['Pasture'],
      floodZone: false
    },
    currentValue: {
      estimatedValue: 187500,  // 114.7 pasture × $850 + $75,000 grain storage + $15,000 improvements
      valuePerAcre: 1634,  // Higher due to grain storage infrastructure
      lastAppraisalDate: new Date('2026-01-01'),
      notes: 'Based on Phillips County pasture $850/ac + 25,000 bu grain storage value'
    },
    loans: [
      {
        lender: 'Bank (Account *9826)',
        originalAmount: 0,
        currentBalance: 175581.77,
        interestRate: 0,
        paymentAmount: 15042.48,
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-03-01'),
        notes: 'Madsen Pasture loan - $15,042.48 due 03/01/2026'
      }
    ],
    buildingDetails: {
      storageCapacity: '25,000 bushels',
      utilities: ['electric', 'water']
    },
    improvements: [
      {
        date: new Date('2024-01-01'),
        description: '25,000 bushel grain storage',
        cost: 0,
        category: 'grain_storage',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Well with electricity',
        cost: 0,
        category: 'water_system',
        addedToValue: true
      },
      {
        date: new Date('2024-01-01'),
        description: 'Small corral system',
        cost: 0,
        category: 'livestock_facility',
        addedToValue: true
      }
    ],
    status: 'owned',
    notes: `FSA Farm: 4210, Tract: 3815
Fields included:
- 202 SECTION: 114.7 acres, 17-6-47 (Pasture)
Cross Roads: 5 & 10
County: Phillips, Intersection: Southwest
Features: 25,000 bu grain storage, well, electricity, corral`
  },

  // Additional KB Farms crop fields
  {
    name: 'KB Farms North Fields',
    type: 'land',
    category: 'cropland',
    description: 'Northern crop fields including 20 NORTH, 21 SMALL, and 22 TOP HILL.',
    location: {
      legalDescription: 'N/2 & NE 17-6-47',
      county: 'Phillips',
      state: 'CO',
      parcelNumber: 'FSA 3720-3815',
      associatedFarm: 'KB Farms'
    },
    landDetails: {
      totalAcres: 269.5,
      tillableAcres: 269.5,
      soilTypes: ['Hard'],
      floodZone: false
    },
    currentValue: {
      estimatedValue: 404250,  // 269.5 × $1,500/ac (Phillips County cropland)
      valuePerAcre: 1500,
      lastAppraisalDate: new Date('2026-01-01'),
      notes: 'Based on NE Colorado 2025 dryland cropland values'
    },
    status: 'owned',
    notes: `FSA Farm: 3720, Tract: 3815
Fields included:
- 20 NORTH: 64.8 acres, N/2 17-6-47
- 21 SMALL: 44.7 acres, NE 17-6-47
- 22 TOP HILL: 160.0 acres, N2 17-6-47
Cross Roads: 5 & 10
County: Phillips, Intersection: Southwest`
  }
];

async function seedKBFarms() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if KB Farms data already exists
    const existing = await CapitalInvestment.findOne({ 'location.associatedFarm': 'KB Farms' });
    if (existing) {
      console.log('KB Farms data already exists. Skipping seed.');
      console.log('To re-seed, first delete existing KB Farms entries.');
      await mongoose.disconnect();
      return;
    }

    // Insert KB Farms data
    const result = await CapitalInvestment.insertMany(kbFarmsData);
    console.log(`Successfully seeded ${result.length} KB Farms capital investments:`);
    result.forEach(item => {
      console.log(`  - ${item.name}: ${item.landDetails?.totalAcres || 0} acres`);
    });

    // Calculate totals
    const totalAcres = kbFarmsData.reduce((sum, item) => sum + (item.landDetails?.totalAcres || 0), 0);
    console.log(`\nTotal KB Farms acres: ${totalAcres.toFixed(2)}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding KB Farms data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedKBFarms();
}

module.exports = { kbFarmsData, seedKBFarms };
