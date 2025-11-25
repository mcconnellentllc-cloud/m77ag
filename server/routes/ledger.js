const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const Ledger = require('../models/ledger');
const Property = require('../models/property');

// Get all ledger entries
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    // Landlords can only see their own ledger entries
    if (role === 'landlord') {
      query.landlord = req.user._id;
    }

    // Apply filters
    if (req.query.landlord && role !== 'landlord') query.landlord = req.query.landlord;
    if (req.query.property) query.property = req.query.property;
    if (req.query.status) query.status = req.query.status;
    if (req.query.cropYear) query.cropYear = req.query.cropYear;
    if (req.query.entryType) query.entryType = req.query.entryType;

    const entries = await Ledger.find(query)
      .populate('landlord', 'firstName lastName email username')
      .populate('property', 'name')
      .populate('transaction')
      .populate('createdBy', 'firstName lastName username')
      .sort({ entryDate: -1 });

    res.json({
      success: true,
      count: entries.length,
      entries
    });
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ledger entries',
      error: error.message
    });
  }
});

// Get single ledger entry
router.get('/:id', authenticate, async (req, res) => {
  try {
    const entry = await Ledger.findById(req.params.id)
      .populate('landlord', 'firstName lastName email username phone')
      .populate('property', 'name')
      .populate('transaction')
      .populate('createdBy', 'firstName lastName username');

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && entry.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this ledger entry'
      });
    }

    res.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Error fetching ledger entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ledger entry',
      error: error.message
    });
  }
});

// Create new ledger entry
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can create ledger entries
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can create ledger entries'
      });
    }

    const entryData = {
      ...req.body,
      createdBy: req.user._id
    };

    const entry = new Ledger(entryData);
    await entry.save();

    const populatedEntry = await Ledger.findById(entry._id)
      .populate('landlord', 'firstName lastName email username')
      .populate('property', 'name');

    res.status(201).json({
      success: true,
      message: 'Ledger entry created successfully',
      entry: populatedEntry
    });
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ledger entry',
      error: error.message
    });
  }
});

// Record payment on ledger entry
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can record payments
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can record payments'
      });
    }

    const entry = await Ledger.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    const { amount, method, reference, notes } = req.body;

    await entry.recordPayment(amount, { method, reference, notes });

    const updatedEntry = await Ledger.findById(entry._id)
      .populate('landlord', 'firstName lastName email username')
      .populate('property', 'name');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// Mark ledger entry as paid
router.post('/:id/mark-paid', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can mark as paid
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can mark entries as paid'
      });
    }

    const entry = await Ledger.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    const { method, reference, notes } = req.body;

    await entry.markAsPaid({ method, reference, notes });

    const updatedEntry = await Ledger.findById(entry._id)
      .populate('landlord', 'firstName lastName email username')
      .populate('property', 'name');

    res.json({
      success: true,
      message: 'Entry marked as paid',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error marking as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking as paid',
      error: error.message
    });
  }
});

// Get landlord account summary
router.get('/summary/landlord/:landlordId', authenticate, async (req, res) => {
  try {
    const { landlordId } = req.params;

    // Check access permissions
    if (req.user.role === 'landlord' && req.user._id.toString() !== landlordId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own account summary'
      });
    }

    const summary = await Ledger.getLandlordAccountSummary(landlordId);

    res.json({
      success: true,
      landlordId,
      summary
    });
  } catch (error) {
    console.error('Error fetching landlord summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landlord summary',
      error: error.message
    });
  }
});

// Get property ledger summary
router.get('/summary/property/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const cropYear = req.query.cropYear ? parseInt(req.query.cropYear) : null;

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

    const summary = await Ledger.getPropertyLedgerSummary(propertyId, cropYear);

    res.json({
      success: true,
      propertyId,
      cropYear: cropYear || 'all years',
      summary
    });
  } catch (error) {
    console.error('Error fetching property ledger summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property ledger summary',
      error: error.message
    });
  }
});

// Update ledger entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update ledger entries
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update ledger entries'
      });
    }

    const entry = await Ledger.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    Object.assign(entry, req.body);
    await entry.save();

    const updatedEntry = await Ledger.findById(entry._id)
      .populate('landlord', 'firstName lastName email username')
      .populate('property', 'name');

    res.json({
      success: true,
      message: 'Ledger entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ledger entry',
      error: error.message
    });
  }
});

// Delete ledger entry (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const entry = await Ledger.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    await entry.deleteOne();

    res.json({
      success: true,
      message: 'Ledger entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ledger entry',
      error: error.message
    });
  }
});

module.exports = router;
