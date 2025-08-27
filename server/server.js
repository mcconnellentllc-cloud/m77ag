// server.js - Complete revised file
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const { auth, adminOnly } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logging for debugging
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// MongoDB Connection with improved error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  console.log('Starting server despite database connection failure');
});

// Middleware
app.use(logRequest);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser for token handling

// API Routes - Attach before static files to prioritize dynamic routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api', require('./routes/api'));

// Static files with explicit caching headers
app.use(express.static(path.join(__dirname, '../docs'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Protected admin routes - Send complete file with error handling
app.get('/admin/dashboard.html', auth, adminOnly, (req, res) => {
  const filePath = path.join(__dirname, '../docs/admin/dashboard.html');
  console.log(`Serving admin dashboard from: ${filePath}`);
  
  // Check if file exists first
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error serving admin dashboard: ${err}`);
        res.status(500).send('Error loading admin dashboard');
      }
    });
  } else {
    console.error(`Admin dashboard file not found at: ${filePath}`);
    res.status(404).send('Admin dashboard file not found');
  }
});

app.get('/admin/chemicals.html', auth, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/chemicals.html'), (err) => {
    if (err) {
      console.error(`Error serving chemicals page: ${err}`);
      res.status(500).send('Error loading chemicals page');
    }
  });
});

app.get('/admin/proposals.html', auth, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/proposals.html'), (err) => {
    if (err) {
      console.error(`Error serving proposals page: ${err}`);
      res.status(500).send('Error loading proposals page');
    }
  });
});

// Admin routes catch-all for other admin pages
app.get('/admin/*', auth, adminOnly, (req, res) => {
  const filePath = path.join(__dirname, '../docs/admin', req.path.replace('/admin/', ''));
  console.log(`Serving admin file from: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error serving admin file ${filePath}: ${err}`);
        res.status(500).send('Error loading admin page');
      }
    });
  } else {
    console.error(`Admin file not found at: ${filePath}`);
    res.status(404).send('Admin file not found');
  }
});

// Redirect /admin to /admin/dashboard.html
app.get('/admin', auth, adminOnly, (req, res) => {
  res.redirect('/admin/dashboard.html');
});

// Protected user routes
app.get('/account/dashboard', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/dashboard.html'), (err) => {
    if (err) {
      console.error(`Error serving user dashboard: ${err}`);
      res.status(500).send('Error loading user dashboard');
    }
  });
});

// Public account routes
app.get('/account/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'), (err) => {
    if (err) {
      console.error(`Error serving login page: ${err}`);
      res.status(500).send('Error loading login page');
    }
  });
});

app.get('/account/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/register.html'), (err) => {
    if (err) {
      console.error(`Error serving register page: ${err}`);
      res.status(500).send('Error loading register page');
    }
  });
});

app.get('/account', (req, res) => {
  res.redirect('/account/login');
});

// API test endpoint for keep-alive
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Server error: ${err.stack}`);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

// Catch-all route for non-matched routes (serve index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'), (err) => {
    if (err) {
      console.error(`Error serving index page: ${err}`);
      res.status(500).send('Error loading page');
    }
  });
});

// Keep alive function to prevent Render.com free tier from spinning down
const keepAlive = () => {
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      https.get('https://m77ag.com/api/test', (resp) => {
        console.log(`Keep-alive ping at ${new Date().toISOString()}`);
      }).on('error', (err) => {
        console.error('Keep-alive request failed:', err.message);
      });
    }, 840000); // 14 minutes (just under the 15-minute timeout)
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  
  // Start keep-alive
  keepAlive();
});