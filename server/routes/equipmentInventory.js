const express = require('express');
const router = express.Router();
const Equipment = require('../models/equipment');

// Get all equipment (admin - includes private)
router.get('/', async (req, res) => {
  try {
    const { forSale, category } = req.query;
    const filter = {};

    if (forSale !== undefined) {
      filter.forSale = forSale === 'true';
    }
    if (category) {
      filter.category = category;
    }

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get public equipment only (for sale)
router.get('/public', async (req, res) => {
  try {
    const equipment = await Equipment.find({
      forSale: true,
      saleStatus: { $in: ['available', 'pending'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Error fetching public equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get equipment summary/stats
router.get('/summary', async (req, res) => {
  try {
    const allEquipment = await Equipment.find();

    // Calculate totals
    let totalValue = 0;
    let totalOwed = 0;
    let forSaleCount = 0;
    let forSaleValue = 0;
    let upcomingPayments = [];

    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    allEquipment.forEach(item => {
      totalValue += item.currentValue || 0;
      totalOwed += item.amountOwed || 0;

      if (item.forSale) {
        forSaleCount++;
        forSaleValue += item.askingPrice || item.currentValue || 0;
      }

      // Check for upcoming payments
      if (item.hasLoan && item.nextPaymentDate) {
        const paymentDate = new Date(item.nextPaymentDate);
        if (paymentDate <= thirtyDaysOut && paymentDate >= now) {
          upcomingPayments.push({
            equipmentId: item._id,
            title: item.title,
            paymentAmount: item.paymentAmount,
            dueDate: item.nextPaymentDate,
            lender: item.lender
          });
        }
      }
    });

    // Sort upcoming payments by date
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      summary: {
        totalEquipment: allEquipment.length,
        totalValue,
        totalOwed,
        netWorth: totalValue - totalOwed,
        forSaleCount,
        forSaleValue,
        upcomingPayments
      }
    });
  } catch (error) {
    console.error('Error fetching equipment summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// Get single equipment item
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();

    res.status(201).json({
      success: true,
      equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to update equipment' });
  }
});

// Toggle for-sale status
router.patch('/:id/toggle-sale', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    equipment.forSale = !equipment.forSale;
    equipment.saleStatus = equipment.forSale ? 'available' : 'not-for-sale';
    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error toggling sale status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle sale status' });
  }
});

// Update financial info
router.patch('/:id/financial', async (req, res) => {
  try {
    const {
      currentValue,
      amountOwed,
      lender,
      paymentAmount,
      paymentFrequency,
      nextPaymentDate,
      hasLoan
    } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    if (currentValue !== undefined) equipment.currentValue = currentValue;
    if (amountOwed !== undefined) equipment.amountOwed = amountOwed;
    if (lender !== undefined) equipment.lender = lender;
    if (paymentAmount !== undefined) equipment.paymentAmount = paymentAmount;
    if (paymentFrequency !== undefined) equipment.paymentFrequency = paymentFrequency;
    if (nextPaymentDate !== undefined) equipment.nextPaymentDate = nextPaymentDate;
    if (hasLoan !== undefined) equipment.hasLoan = hasLoan;

    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating financial info:', error);
    res.status(500).json({ success: false, error: 'Failed to update financial info' });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete equipment' });
  }
});

// Bulk import equipment (for initial setup)
router.post('/bulk-import', async (req, res) => {
  try {
    const { equipment: equipmentList } = req.body;

    if (!Array.isArray(equipmentList)) {
      return res.status(400).json({ success: false, error: 'Equipment must be an array' });
    }

    const created = await Equipment.insertMany(equipmentList);

    res.status(201).json({
      success: true,
      count: created.length,
      equipment: created
    });
  } catch (error) {
    console.error('Error bulk importing equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to import equipment' });
  }
});

module.exports = router;
