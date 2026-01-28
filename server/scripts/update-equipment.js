/**
 * Equipment Update Script
 * Updates equipment with correct values, serial numbers, and loan amounts
 * Also removes equipment that is no longer owned
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Equipment = require('../models/equipment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Equipment to update with correct information
const equipmentUpdates = [
  {
    // 2019 JD 8370RT Track Tractor
    search: { title: /8370/i },
    update: {
      title: '2019 John Deere 8370RT Track Tractor',
      year: 2019,
      make: 'John Deere',
      model: '8370RT',
      serialNumber: '1RW8370REJD920111',
      hours: 3252,
      currentValue: 277500,
      amountOwed: 222690.85,
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9914',
      category: 'Tractors'
    }
  },
  {
    // 2022 JD 6145R Tractor
    search: { title: /6145/i },
    update: {
      title: '2022 John Deere 6145R Tractor',
      year: 2022,
      make: 'John Deere',
      model: '6145R',
      serialNumber: '1L06145RCNP149997',
      hours: 496,
      currentValue: 215000,
      amountOwed: 153776.14, // Split of $307,552.28 loan (approx 50%)
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9885',
      category: 'Tractors'
    }
  },
  {
    // 2016 JD 8320R Tractor
    search: { title: /8320/i },
    update: {
      title: '2016 John Deere 8320R Tractor',
      year: 2016,
      make: 'John Deere',
      model: '8320R',
      serialNumber: '1RW8320REGD113101',
      hours: 5686,
      currentValue: 199900,
      amountOwed: 153776.14, // Split of $307,552.28 loan (approx 50%)
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9885',
      category: 'Tractors'
    }
  },
  {
    // 2017 Claas Lexion 760TT Combine
    search: { title: /lexion|claas/i },
    update: {
      title: '2017 Claas Lexion 760TT Combine',
      year: 2017,
      make: 'Claas',
      model: 'Lexion 760TT',
      serialNumber: 'C7900519',
      currentValue: 322500,
      amountOwed: 0,
      hasLoan: false,
      category: 'Combines'
    }
  },
  {
    // Frontier AF12G Snow Plow
    search: { title: /frontier.*snow|snow.*plow|af12/i },
    update: {
      title: 'Frontier AF12G Snow Plow',
      make: 'Frontier',
      model: 'AF12G',
      currentValue: 8000,
      amountOwed: 0,
      hasLoan: false,
      category: 'Implements'
    }
  },
  {
    // JD StarFire 3000
    search: { title: /starfire/i },
    update: {
      title: '2014 John Deere StarFire 3000 GPS Receiver',
      year: 2014,
      make: 'John Deere',
      model: 'StarFire 3000',
      serialNumber: 'PCGT3TA699971',
      currentValue: 5000,
      amountOwed: 0,
      hasLoan: false,
      category: 'Technology'
    }
  },
  {
    // JD Gen 4 CommandCenter
    search: { title: /command.*center|gen.*4/i },
    update: {
      title: 'John Deere Gen 4 CommandCenter Display',
      make: 'John Deere',
      model: 'Gen 4 CommandCenter',
      currentValue: 1500,
      amountOwed: 0,
      hasLoan: false,
      category: 'Technology'
    }
  },
  {
    // Drago Corn Head
    search: { title: /drago/i },
    update: {
      amountOwed: 34796.16,
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9910',
      category: 'Headers'
    }
  },
  {
    // 24 Row 1770NT Planter
    search: { title: /1770|planter.*24/i },
    update: {
      title: 'John Deere 1770NT 24 Row Planter',
      make: 'John Deere',
      model: '1770NT',
      currentValue: 125000, // Estimated market value
      amountOwed: 59549.58,
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9843',
      category: 'Planters'
    }
  },
  {
    // Bale Mover (for sale)
    search: { title: /bale.*mover/i },
    update: {
      amountOwed: 6843.13,
      hasLoan: true,
      lender: 'John Deere Financial',
      loanAccountNumber: '*9713',
      forSale: true,
      saleStatus: 'available'
    }
  }
];

// New equipment to add
const newEquipment = [
  {
    title: '1986 Caterpillar 340 Front End Loader',
    year: 1986,
    make: 'Caterpillar',
    model: '340',
    category: 'Loaders',
    currentValue: 15000, // Estimated for 1986 Cat loader
    amountOwed: 6160.36,
    hasLoan: true,
    lender: 'John Deere Financial',
    loanAccountNumber: '*9719',
    description: 'Front end loader',
    ownerEntity: 'M77 AG'
  },
  {
    title: '2022 Honeybee 36\' Wheat Header',
    year: 2022,
    make: 'Honeybee',
    model: '36\' Header',
    category: 'Headers',
    currentValue: 45000, // Estimated market value
    amountOwed: 16690.50,
    hasLoan: true,
    lender: 'John Deere Financial',
    loanAccountNumber: '*9679',
    description: '36 foot wheat header adapted for Cat/Claas combine',
    ownerEntity: 'M77 AG'
  }
];

// Equipment to remove (no longer owned)
const equipmentToRemove = [
  { title: /mac.*don|macd|973/i },
  { title: /pioneer.*weigh|weigh.*trailer/i },
  { title: /green.*truck/i }
];

async function updateEquipment() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let updatedCount = 0;
    let addedCount = 0;
    let removedCount = 0;

    // Update existing equipment
    console.log('\n--- Updating existing equipment ---');
    for (const item of equipmentUpdates) {
      const equipment = await Equipment.findOne(item.search);
      if (equipment) {
        Object.assign(equipment, item.update);
        await equipment.save();
        console.log(`✓ Updated: ${equipment.title}`);
        updatedCount++;
      } else {
        console.log(`⚠ Not found: ${JSON.stringify(item.search)}`);
      }
    }

    // Add new equipment
    console.log('\n--- Adding new equipment ---');
    for (const item of newEquipment) {
      // Check if it already exists
      const existing = await Equipment.findOne({
        $or: [
          { title: new RegExp(item.model, 'i') },
          { loanAccountNumber: item.loanAccountNumber }
        ]
      });

      if (!existing) {
        const equipment = new Equipment(item);
        await equipment.save();
        console.log(`✓ Added: ${item.title}`);
        addedCount++;
      } else {
        // Update existing instead
        Object.assign(existing, item);
        await existing.save();
        console.log(`✓ Updated existing: ${existing.title}`);
        updatedCount++;
      }
    }

    // Remove equipment no longer owned
    console.log('\n--- Removing sold equipment ---');
    for (const search of equipmentToRemove) {
      const result = await Equipment.deleteMany(search);
      if (result.deletedCount > 0) {
        console.log(`✓ Removed ${result.deletedCount} item(s) matching: ${JSON.stringify(search)}`);
        removedCount += result.deletedCount;
      } else {
        console.log(`⚠ No items found matching: ${JSON.stringify(search)}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Updated: ${updatedCount} items`);
    console.log(`Added: ${addedCount} items`);
    console.log(`Removed: ${removedCount} items`);

    // Show current totals
    const allEquipment = await Equipment.find();
    let totalValue = 0;
    let totalOwed = 0;
    allEquipment.forEach(item => {
      totalValue += item.currentValue || 0;
      totalOwed += item.amountOwed || 0;
    });

    console.log('\n--- Current Equipment Summary ---');
    console.log(`Total Items: ${allEquipment.length}`);
    console.log(`Total Value: $${totalValue.toLocaleString()}`);
    console.log(`Total Owed: $${totalOwed.toLocaleString()}`);
    console.log(`Net Equity: $${(totalValue - totalOwed).toLocaleString()}`);

    // List items with loans
    console.log('\n--- Items with Loans ---');
    const itemsWithLoans = allEquipment.filter(e => e.hasLoan && e.amountOwed > 0);
    itemsWithLoans.sort((a, b) => b.amountOwed - a.amountOwed);
    itemsWithLoans.forEach(item => {
      console.log(`  ${item.loanAccountNumber || 'N/A'}: ${item.title} - $${item.amountOwed.toLocaleString()}`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEquipment();
