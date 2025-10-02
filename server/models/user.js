// server/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    default: 'user',
    enum: ['user', 'admin']
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Create model from schema
const User = mongoose.model('User', userSchema);

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@m77ag.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'M77admin2024!';
    
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: 'admin'
      });
      console.log('✅ Default admin user created');
      console.log(`   Email: ${adminEmail}`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

module.exports = { User, createDefaultAdmin };