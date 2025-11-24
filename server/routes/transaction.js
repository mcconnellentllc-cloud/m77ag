const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const Transaction = require('../models/transaction');
const Property = require('../models/property');
const Field = require('../models/field');

// Get all transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    // Build query based on role and filters
    if (role === 'landlord') {
      query.landlord = req.user._id;
    }

    // Apply filters from query params
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.property) query.property = req.query.property;
    if (req.query.field) query.field = req.query.field;
    if (req.query.landlord && role !== 'landlord') query.landlord = req.query.landlord;
    if (req.query.status) query.status = req.query.status;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('property', 'name')
      .populate('field', 'name')
      .populate('landlord', 'firstName lastName email username')
      .populate('createdBy', 'firstName lastName username')
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 100);

    // Calculate totals
    const totals = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0
    };

    totals.forEach(item => {
      if (item._id === 'income') summary.totalIncome = item.total;
      if (item._id === 'expense') summary.totalExpense = item.total;
    });

    summary.netProfit = summary.totalIncome - summary.totalExpense;

    res.json({
      success: true,
      count: transactions.length,
      summary,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// Get single transaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('property', 'name')
      .populate('field', 'name')
      .populate('landlord', 'firstName lastName email username')
      .populate('createdBy', 'firstName lastName username');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && transaction.landlord && transaction.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this transaction'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
});

// Create new transaction
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can create transactions
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can create transactions'
      });
    }

    const transactionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('property', 'name')
      .populate('field', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: populatedTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
});

// Bulk create transactions (for imports)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can bulk create
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can bulk import transactions'
      });
    }

    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Transactions must be an array'
      });
    }

    // Add createdBy to each transaction
    const transactionsWithCreator = transactions.map(t => ({
      ...t,
      createdBy: req.user._id
    }));

    const created = await Transaction.insertMany(transactionsWithCreator);

    res.status(201).json({
      success: true,
      message: `${created.length} transactions created successfully`,
      count: created.length,
      transactions: created
    });
  } catch (error) {
    console.error('Error bulk creating transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating transactions',
      error: error.message
    });
  }
});

// Update transaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update transactions
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update transactions'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('property', 'name')
      .populate('field', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
});

// Delete transaction (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction',
      error: error.message
    });
  }
});

// Get transaction totals by category
router.get('/reports/by-category', authenticate, async (req, res) => {
  try {
    const filters = {};

    if (req.user.role === 'landlord') {
      filters.landlord = req.user._id;
    }

    if (req.query.property) filters.property = req.query.property;
    if (req.query.landlord && req.user.role !== 'landlord') filters.landlord = req.query.landlord;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filters.date = {};
      if (req.query.startDate) filters.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.date.$lte = new Date(req.query.endDate);
    }

    filters.status = 'completed';

    const categoryTotals = await Transaction.getTotalsByCategory(filters);

    res.json({
      success: true,
      categoryTotals
    });
  } catch (error) {
    console.error('Error fetching category totals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category totals',
      error: error.message
    });
  }
});

// Get property financial summary
router.get('/reports/property/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const year = req.query.year ? parseInt(req.query.year) : null;

    // Check access permissions
    if (req.user.role === 'landlord') {
      const property = await Property.findById(propertyId);
      if (!property || property.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this property'
        });
      }
    }

    const summary = await Transaction.getPropertySummary(propertyId, year);

    // Get property details for per-acre calculations
    const property = await Property.findById(propertyId).select('name totalAcres farmableAcres');

    if (property) {
      const acres = property.farmableAcres || property.totalAcres;
      summary.perAcreMetrics = {
        incomePerAcre: summary.totalIncome / acres,
        expensePerAcre: summary.totalExpense / acres,
        profitPerAcre: summary.netProfit / acres,
        acres
      };
    }

    res.json({
      success: true,
      property: property ? { name: property.name, acres: property.totalAcres } : null,
      year: year || 'all time',
      summary
    });
  } catch (error) {
    console.error('Error fetching property summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property summary',
      error: error.message
    });
  }
});

module.exports = router;
