// Server with authentication and MongoDB
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variables

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/m77ag', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  createInitialUsers(); // Create admin and demo users if they don't exist
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  // Continue even if MongoDB fails - static site will still work
});

// Define User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Create initial users
async function createInitialUsers() {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@m77ag.com' });
    
    // If admin doesn't exist, create one
    if (!adminExists) {
      console.log('Creating admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('M77admin2024!', salt);
      
      const adminUser = new User({
        name: 'M77 Admin',
        email: 'admin@m77ag.com',
        password: hashedPassword,
        company: 'M77 AG',
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
    
    // Check if demo user exists
    const demoExists = await User.findOne({ email: 'demo@m77ag.com' });
    
    // If demo user doesn't exist, create one
    if (!demoExists) {
      console.log('Creating demo user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const demoUser = new User({
        name: 'Demo User',
        email: 'demo@m77ag.com',
        password: hashedPassword,
        company: 'Demo Company',
        isAdmin: false
      });
      
      await demoUser.save();
      console.log('Demo user created successfully');
    }
  } catch (err) {
    console.error('Error creating users:', err.message);
  }
}

// Authentication middleware
function auth(req, res, next) {
  const token = req.header('x-auth-token');

  // Check for token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
}

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: 3600 } // 1 hour
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user data route
app.get('/api/auth/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Serve static files from the docs directory
app.use(express.static(path.join(__dirname, '../docs')));

// Serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - With authentication`);
});