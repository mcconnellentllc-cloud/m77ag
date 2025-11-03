// Script to create default admin user
// Run this ONCE with: node create-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'landlord', 'customer'],
    default: 'customer'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'kyle@m77ag.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      await mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('M77admin2024!', 10);
    
    const admin = await User.create({
      email: 'kyle@m77ag.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: kyle@m77ag.com');
    console.log('Password: M77admin2024!');
    console.log('Role:', admin.role);
    console.log('\nYou can now login at: https://m77ag.com/admin/login.html');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();