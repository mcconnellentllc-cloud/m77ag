const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },

  // User Type
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },

  // Profile
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },

  // Hunting Info
  huntingLicense: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// Create default admin user if none exists
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const defaultAdmin = new User({
        name: 'M77 AG Admin',
        email: 'admin@m77ag.com',
        phone: '970-571-1015',
        password: 'M77ag2024!Admin', // Change this after first login!
        role: 'admin',
        emailVerified: true,
        isActive: true
      });

      await defaultAdmin.save();
      console.log('✅ Default admin user created: admin@m77ag.com');
      console.log('⚠️  Default password: M77ag2024!Admin (CHANGE THIS!)');
    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
}

module.exports = User;
module.exports.createDefaultAdmin = createDefaultAdmin;
