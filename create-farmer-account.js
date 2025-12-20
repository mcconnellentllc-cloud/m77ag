// Script to create farmer account
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./server/models/user');

async function createFarmerAccount() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/m77ag';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'office@m77ag.com' });

    if (existingUser) {
      console.log('User already exists. Updating to farmer role...');
      existingUser.role = 'farmer';
      existingUser.firstName = 'Kyle';
      existingUser.lastName = 'McConnell';
      await existingUser.save();
      console.log('✅ User updated to farmer role');
    } else {
      // Create new farmer account
      const farmer = await User.create({
        username: 'm77ag_admin',
        email: 'office@m77ag.com',
        password: 'M77Agadmin2024!',
        role: 'farmer',
        firstName: 'Kyle',
        lastName: 'McConnell'
      });

      console.log('✅ Farmer account created successfully!');
      console.log('Email:', farmer.email);
      console.log('Role:', farmer.role);
    }

    await mongoose.connection.close();
    console.log('\nYou can now log in at: http://localhost:5000/farmer/login.html');

  } catch (error) {
    console.error('Error creating farmer account:', error.message);
    process.exit(1);
  }
}

createFarmerAccount();
