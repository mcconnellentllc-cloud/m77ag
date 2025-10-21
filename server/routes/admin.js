const express = require('express');
const router = express.Router();

// Middleware functions for authentication
const authenticate = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const { User } = require('../models/user');
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    req.userId = decoded.userId;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Mock data for now - replace with actual database queries
const getMockAnalytics = () => ({
  proposalStats: {
    totalProposals: 45,
    pendingProposals: 12,
    approvedProposals: 20,
    completedProposals: 13,
    totalRevenue: 125000
  },
  customerStats: {
    totalCustomers: 28,
    newThisMonth: 5
  },
  chemicalStats: {
    totalChemicals: 35,
    lowStockItems: 3,
    inventoryValue: 45000
  },
  huntingStats: {
    activeLeases: 5,
    totalBookings: 3,
    revenue: 7500
  },
  recentActivity: [
    {
      id: 1,
      customer_name: 'John Doe',
      service_type: 'Spray Application',
      acres: 150,
      total_cost: 2250,
      status: 'pending',
      created_at: new Date()
    },
    {
      id: 2,
      customer_name: 'Jane Smith',
      service_type: 'Custom Farming',
      acres: 200,
      total_cost: 3000,
      status: 'approved',
      created_at: new Date()
    },
    {
      id: 3,
      customer_name: 'Bob Johnson',
      service_type: 'Hunting Lease',
      acres: 0,
      total_cost: 750,
      status: 'completed',
      created_at: new Date()
    }
  ]
});

// GET /api/admin/analytics - Get dashboard analytics
router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    const analytics = getMockAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
});

// GET /api/admin/proposals - Get all proposals
router.get('/proposals', authenticate, isAdmin, async (req, res) => {
  try {
    const proposals = [
      {
        id: 1,
        customer_name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        service_type: 'Spray Application',
        acres: 150,
        chemicals: ['Herbicide A', 'Fertilizer B'],
        total_cost: 2250,
        status: 'pending',
        created_at: new Date()
      },
      {
        id: 2,
        customer_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0124',
        service_type: 'Custom Farming',
        acres: 200,
        chemicals: ['Pesticide C'],
        total_cost: 3000,
        status: 'approved',
        created_at: new Date()
      }
    ];
    
    res.json({ success: true, proposals });
  } catch (error) {
    console.error('Proposals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch proposals' 
    });
  }
});

// PATCH /api/admin/proposals/:id/status - Update proposal status
router.patch('/proposals/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    console.log(`Updating proposal ${id} to status: ${status}`);
    
    res.json({ 
      success: true, 
      message: 'Proposal status updated successfully' 
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update proposal' 
    });
  }
});

// DELETE /api/admin/proposals/:id - Delete proposal
router.delete('/proposals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting proposal ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Proposal deleted successfully' 
    });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete proposal' 
    });
  }
});

// GET /api/admin/chemicals - Get chemical inventory
router.get('/chemicals', authenticate, isAdmin, async (req, res) => {
  try {
    const chemicals = [
      {
        id: 1,
        name: '2,4-D Herbicide',
        type: 'Herbicide',
        quantity: 250,
        unit: 'gallons',
        cost_per_unit: 45,
        min_stock_level: 50,
        supplier: 'AgChem Supply Co.'
      },
      {
        id: 2,
        name: 'Nitrogen Fertilizer 32-0-0',
        type: 'Fertilizer',
        quantity: 500,
        unit: 'gallons',
        cost_per_unit: 25,
        min_stock_level: 100,
        supplier: 'Farm Nutrients Inc.'
      },
      {
        id: 3,
        name: 'Glyphosate',
        type: 'Herbicide',
        quantity: 30,
        unit: 'gallons',
        cost_per_unit: 55,
        min_stock_level: 50,
        supplier: 'AgChem Supply Co.'
      }
    ];
    
    res.json({ success: true, chemicals });
  } catch (error) {
    console.error('Chemicals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch chemicals' 
    });
  }
});

// POST /api/admin/chemicals - Add new chemical
router.post('/chemicals', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, type, quantity, unit, cost_per_unit, min_stock_level, supplier } = req.body;
    
    if (!name || !type || !quantity || !unit || !cost_per_unit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    console.log('Adding new chemical:', { name, type, quantity });
    
    res.status(201).json({ 
      success: true, 
      message: 'Chemical added successfully',
      chemical: { 
        id: Date.now(), 
        name, 
        type, 
        quantity, 
        unit, 
        cost_per_unit,
        min_stock_level,
        supplier
      }
    });
  } catch (error) {
    console.error('Add chemical error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add chemical' 
    });
  }
});

// PUT /api/admin/chemicals/:id - Update chemical
router.put('/chemicals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`Updating chemical ${id}:`, updateData);
    
    res.json({ 
      success: true, 
      message: 'Chemical updated successfully' 
    });
  } catch (error) {
    console.error('Update chemical error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update chemical' 
    });
  }
});

// DELETE /api/admin/chemicals/:id - Delete chemical
router.delete('/chemicals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting chemical ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Chemical deleted successfully' 
    });
  } catch (error) {
    console.error('Delete chemical error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete chemical' 
    });
  }
});

// GET /api/admin/customers - Get customers
router.get('/customers', authenticate, isAdmin, async (req, res) => {
  try {
    const customers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        address: '123 Farm Road',
        city: 'Denver',
        state: 'CO',
        zip: '80210',
        total_acres: 500,
        total_spent: 15000,
        last_service: '2024-12-15'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0124',
        address: '456 Ranch Drive',
        city: 'Boulder',
        state: 'CO',
        zip: '80302',
        total_acres: 300,
        total_spent: 9000,
        last_service: '2024-11-20'
      }
    ];
    
    res.json({ success: true, customers });
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customers' 
    });
  }
});

// POST /api/admin/customers - Add new customer
router.post('/customers', authenticate, isAdmin, async (req, res) => {
  try {
    const customerData = req.body;
    
    if (!customerData.name || !customerData.email || !customerData.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and phone are required' 
      });
    }
    
    console.log('Adding new customer:', customerData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Customer added successfully',
      customer: { 
        id: Date.now(), 
        ...customerData
      }
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add customer' 
    });
  }
});

// PUT /api/admin/customers/:id - Update customer
router.put('/customers/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`Updating customer ${id}:`, updateData);
    
    res.json({ 
      success: true, 
      message: 'Customer updated successfully' 
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update customer' 
    });
  }
});

// DELETE /api/admin/customers/:id - Delete customer
router.delete('/customers/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting customer ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete customer' 
    });
  }
});

// GET /api/admin/hunting - Get hunting leases
router.get('/hunting', authenticate, isAdmin, async (req, res) => {
  try {
    const leases = [
      {
        id: 1,
        name: 'North Field Deer Lease',
        type: 'Deer Hunting',
        acres: 150,
        location: 'North Section - Field 12',
        price_per_day: 250,
        price_per_week: 1500,
        price_per_season: 5000,
        status: 'available',
        bookings: 2
      },
      {
        id: 2,
        name: 'West Creek Turkey Lease',
        type: 'Turkey Hunting',
        acres: 100,
        location: 'West Section - Creek Area',
        price_per_day: 150,
        price_per_week: 800,
        price_per_season: 2500,
        status: 'available',
        bookings: 1
      }
    ];
    
    res.json({ success: true, leases });
  } catch (error) {
    console.error('Hunting leases error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hunting leases' 
    });
  }
});

// POST /api/admin/hunting - Add new hunting lease
router.post('/hunting', authenticate, isAdmin, async (req, res) => {
  try {
    const leaseData = req.body;
    
    if (!leaseData.name || !leaseData.type || !leaseData.acres || !leaseData.price_per_day) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    console.log('Adding new hunting lease:', leaseData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Hunting lease added successfully',
      lease: { 
        id: Date.now(), 
        ...leaseData
      }
    });
  } catch (error) {
    console.error('Add hunting lease error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add hunting lease' 
    });
  }
});

// PUT /api/admin/hunting/:id - Update hunting lease
router.put('/hunting/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`Updating hunting lease ${id}:`, updateData);
    
    res.json({ 
      success: true, 
      message: 'Hunting lease updated successfully' 
    });
  } catch (error) {
    console.error('Update hunting lease error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update hunting lease' 
    });
  }
});

// DELETE /api/admin/hunting/:id - Delete hunting lease
router.delete('/hunting/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting hunting lease ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Hunting lease deleted successfully' 
    });
  } catch (error) {
    console.error('Delete hunting lease error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete hunting lease' 
    });
  }
});

module.exports = router;