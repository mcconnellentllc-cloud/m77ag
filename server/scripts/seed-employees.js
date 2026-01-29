/**
 * Seed script for initial employee data
 * Run with: node server/scripts/seed-employees.js
 * Use --force to skip confirmation prompt
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/employee');

const forceMode = process.argv.includes('--force');

const employees = [
  {
    firstName: 'Kyle',
    lastName: 'McConnell',
    email: 'kyle@m77ag.com',
    position: 'Owner / Operator',
    employmentType: 'contract',
    startDate: new Date('2025-09-15'),
    isActive: true,
    payType: 'salary',
    annualSalary: 77777.77,
    monthlyRate: 77777.77 / 12, // ~$6481.48/month
    payFrequency: 'monthly',
    hasProfitShare: true,
    profitSharePercent: 85,
    notes: 'Owner - 85% profit share. Contract labor paid monthly.'
  },
  {
    firstName: 'Matt',
    lastName: 'Allphin',
    email: 'matt@m77ag.com',
    position: 'Partner / Operator',
    employmentType: 'contract',
    startDate: new Date('2025-09-15'),
    isActive: true,
    payType: 'salary',
    annualSalary: 77777.77,
    monthlyRate: 77777.77 / 12, // ~$6481.48/month
    payFrequency: 'monthly',
    hasProfitShare: true,
    profitSharePercent: 15,
    notes: 'Partner - 15% profit share. Contract labor paid monthly.'
  },
  {
    firstName: 'Brandi',
    lastName: 'McConnell',
    email: 'brandi@m77ag.com',
    position: 'Office Manager',
    employmentType: 'contract',
    startDate: new Date('2025-09-15'),
    isActive: true,
    payType: 'monthly',
    annualSalary: 14400, // $1,200 x 12
    monthlyRate: 1200,
    payFrequency: 'monthly',
    hasProfitShare: false,
    profitSharePercent: 0,
    notes: 'Contract labor - $1,200/month flat rate.'
  }
];

async function seedEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if employees already exist
    const existingCount = await Employee.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing employees.`);

      if (!forceMode) {
        const response = await new Promise(resolve => {
          process.stdout.write('Do you want to clear and reseed? (y/n): ');
          process.stdin.once('data', data => resolve(data.toString().trim().toLowerCase()));
        });

        if (response !== 'y') {
          console.log('Seeding cancelled.');
          process.exit(0);
        }
      } else {
        console.log('Force mode enabled - clearing existing employees...');
      }

      await Employee.deleteMany({});
      console.log('Cleared existing employees.');
    }

    // Insert employees
    const result = await Employee.insertMany(employees);
    console.log(`\nSuccessfully seeded ${result.length} employees:\n`);

    result.forEach(emp => {
      console.log(`  - ${emp.firstName} ${emp.lastName}`);
      console.log(`    Position: ${emp.position}`);
      console.log(`    Start Date: ${emp.startDate.toLocaleDateString()}`);
      if (emp.payType === 'salary') {
        console.log(`    Annual Salary: $${emp.annualSalary.toLocaleString()}`);
      } else {
        console.log(`    Monthly Rate: $${emp.monthlyRate.toLocaleString()}`);
      }
      if (emp.hasProfitShare) {
        console.log(`    Profit Share: ${emp.profitSharePercent}%`);
      }
      console.log('');
    });

    console.log('Employee seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedEmployees();
}

module.exports = { employees, seedEmployees };
