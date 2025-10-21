const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');

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

// Get dashboard analytics - Protected route for admins only
router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    // For now, return mock data
    // TODO: Replace with actual database queries
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

// Get all proposals - Protected route for admins
router.get('/proposals', authenticate, isAdmin, async (req, res) => {
  try {
    // TODO: Fetch from database
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

// Update proposal status - Protected route for admins
router.patch('/proposals/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    // TODO: Update in database
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

// Delete proposal - Protected route for admins
router.delete('/proposals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Delete from database
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

// Get chemical inventory - Protected route for admins
router.get('/chemicals', authenticate, isAdmin, async (req, res) => {
  try {
    // TODO: Fetch from database
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

// Add new chemical - Protected route for admins
router.post('/chemicals', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, type, quantity, unit, cost_per_unit, min_stock_level, supplier } = req.body;
    
    // Validate required fields
    if (!name || !type || !quantity || !unit || !cost_per_unit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // TODO: Save to database
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

// Update chemical - Protected route for admins
router.put('/chemicals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Update in database
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

// Delete chemical - Protected route for admins
router.delete('/chemicals/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Delete from database
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

// Get customers - Protected route for admins
router.get('/customers', authenticate, isAdmin, async (req, res) => {
  try {
    // TODO: Fetch from database
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

// Add new customer - Protected route for admins
router.post('/customers', authenticate, isAdmin, async (req, res) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    if (!customerData.name || !customerData.email || !customerData.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and phone are required' 
      });
    }
    
    // TODO: Save to database
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

// Update customer - Protected route for admins
router.put('/customers/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Update in database
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

// Delete customer - Protected route for admins
router.delete('/customers/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Delete from database
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

module.exports = router;