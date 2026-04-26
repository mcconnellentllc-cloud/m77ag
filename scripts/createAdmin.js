/**
 * Create admin user
 * Run: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'office@m77ag.com';
    const password = 'M77admin2025!';

    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      // Update password
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      console.log('Admin password updated!');
    } else {
      // Create new
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new User({
        email,
        password: hashedPassword,
        name: 'M77 Admin',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created!');
    }

    console.log('\nCredentials:');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
