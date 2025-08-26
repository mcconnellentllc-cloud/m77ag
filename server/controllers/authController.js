// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const database = require('../models/database');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user by email
      const users = await database.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = users[0];
      
      if (!user) {
        // Note: For security, don't specify whether email or password is wrong
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Check password
      // In production, you would hash passwords with bcrypt before storing
      // For now, we're doing a simple comparison
      // const passwordMatch = await bcrypt.compare(password, user.password);
      const passwordMatch = password === user.password;
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Create JWT token
      const secret = process.env.JWT_SECRET || 'your-default-secret-key-change-this';
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        }, 
        secret, 
        { expiresIn: '24h' }
      );
      
      // Return user info and token (never return the password)
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to authenticate user' });
    }
  },
  
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      
      // Check if email already exists
      const existingUsers = await database.query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // In production, hash the password
      // const hashedPassword = await bcrypt.hash(password, 10);
      const hashedPassword = password; // For simplicity in development
      
      // Create user
      const result = await database.query(
        `INSERT INTO users (username, email, password, role, created_at)
         VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP)`,
        [username, email, hashedPassword]
      );
      
      // Create JWT token
      const secret = process.env.JWT_SECRET || 'your-default-secret-key-change-this';
      const token = jwt.sign(
        { 
          id: result.lastID, 
          email, 
          role: 'user' 
        }, 
        secret, 
        { expiresIn: '24h' }
      );
      
      res.status(201).json({ 
        user: {
          id: result.lastID,
          username,
          email,
          role: 'user'
        },
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },
  
  getProfile: async (req, res) => {
    try {
      const { id } = req.user;
      
      const users = await database.query('SELECT id, username, email, role FROM users WHERE id = ?', [id]);
      const user = users[0];
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },
  
  updatePassword: async (req, res) => {
    try {
      const { id } = req.user;
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // Get user with password
      const users = await database.query('SELECT * FROM users WHERE id = ?', [id]);
      const user = users[0];
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      // const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      const passwordMatch = currentPassword === user.password;
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      // const hashedPassword = await bcrypt.hash(newPassword, 10);
      const hashedPassword = newPassword; // For simplicity in development
      
      // Update password
      await database.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
};

module.exports = authController;