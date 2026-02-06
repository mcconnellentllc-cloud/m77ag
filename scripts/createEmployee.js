/**
 * Create employee user
 * Run: node scripts/createEmployee.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Import the User model
const User = require('../server/models/user');

async function createEmployee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const employeeData = {
      name: 'Matt',
      email: 'matt@togoag.com',
      phone: '000-000-0000', // Placeholder - can be updated later
      password: 'm77ag1',
      role: 'farmer',
      isActive: true,
      emailVerified: true,
      employeePermissions: {
        canAddCattleRecords: true,
        canEditCattleRecords: true,
        canDeleteCattleRecords: false,
        canAddEquipmentLogs: true,
        canEditEquipmentLogs: true,
        canAddTransactions: false,
        canEditTransactions: false,
        canViewFinancials: true,
        canViewReports: true,
        accessAreas: ['cattle', 'crops', 'equipment']
      }
    };

    // Check if exists
    const existing = await User.findOne({ email: employeeData.email });
    if (existing) {
      console.log('Employee already exists. Updating password...');
      existing.password = employeeData.password;
      existing.role = 'employee';
      existing.employeePermissions = employeeData.employeePermissions;
      await existing.save();
      console.log('Employee updated!');
    } else {
      const employee = new User(employeeData);
      await employee.save();
      console.log('Employee user created!');
    }

    console.log('\nCredentials:');
    console.log('Email:', employeeData.email);
    console.log('Password:', employeeData.password);
    console.log('Role: employee');
    console.log('\nMatt can change the password after logging in.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createEmployee();
