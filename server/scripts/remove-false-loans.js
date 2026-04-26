/**
 * Remove incorrectly assigned loans from equipment
 * These were assumed and not provided by the user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('../models/equipment');

async function removeFalseLoans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Equipment that should NOT have loans
    const itemsToFix = [
      { search: /P2085|Air Drill/i, name: 'New Holland P2085 Air Drill' },
      { search: /DC162|Swather/i, name: 'Case IH DC162 Swather' }
    ];

    for (const item of itemsToFix) {
      const result = await Equipment.findOneAndUpdate(
        { title: item.search },
        {
          $set: {
            hasLoan: false,
            amountOwed: 0,
            lender: '',
            loanAccountNumber: ''
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`Fixed: ${result.title}`);
        console.log(`  hasLoan: false, amountOwed: $0`);
      } else {
        console.log(`Not found: ${item.name}`);
      }
    }

    await mongoose.disconnect();
    console.log('\nDone! False loans removed.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeFalseLoans();
