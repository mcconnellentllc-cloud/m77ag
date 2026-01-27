const express = require('express');
const router = express.Router();
const CapitalInvestment = require('../models/capitalInvestment');

/**
 * GET /api/capital
 * Get all capital investments
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, status, farm } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (farm) filter['location.associatedFarm'] = farm;

    const investments = await CapitalInvestment.find(filter).sort({ type: 1, name: 1 });
    res.json({ success: true, data: investments });
  } catch (error) {
    console.error('Error fetching capital investments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/capital/summary
 * Get portfolio summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await CapitalInvestment.getPortfolioSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/capital/:id
 * Get single capital investment
 */
router.get('/:id', async (req, res) => {
  try {
    const investment = await CapitalInvestment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    res.json({ success: true, data: investment });
  } catch (error) {
    console.error('Error fetching capital investment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital
 * Create new capital investment
 */
router.post('/', async (req, res) => {
  try {
    const investment = new CapitalInvestment(req.body);
    investment.createdBy = req.userId;
    investment.lastModifiedBy = req.userId;
    await investment.save();
    res.status(201).json({ success: true, data: investment, message: 'Investment created' });
  } catch (error) {
    console.error('Error creating capital investment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/capital/:id
 * Update capital investment
 */
router.put('/:id', async (req, res) => {
  try {
    const investment = await CapitalInvestment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.userId },
      { new: true, runValidators: true }
    );
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    res.json({ success: true, data: investment, message: 'Investment updated' });
  } catch (error) {
    console.error('Error updating capital investment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/capital/:id
 * Delete capital investment
 */
router.delete('/:id', async (req, res) => {
  try {
    const investment = await CapitalInvestment.findByIdAndDelete(req.params.id);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    res.json({ success: true, message: 'Investment deleted' });
  } catch (error) {
    console.error('Error deleting capital investment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital/:id/improvement
 * Add improvement to investment
 */
router.post('/:id/improvement', async (req, res) => {
  try {
    const investment = await CapitalInvestment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    investment.improvements.push(req.body);
    investment.lastModifiedBy = req.userId;
    await investment.save();

    res.json({ success: true, data: investment, message: 'Improvement added' });
  } catch (error) {
    console.error('Error adding improvement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital/:id/loan
 * Add loan to investment
 */
router.post('/:id/loan', async (req, res) => {
  try {
    const investment = await CapitalInvestment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    investment.loans.push(req.body);
    investment.lastModifiedBy = req.userId;
    await investment.save();

    res.json({ success: true, data: investment, message: 'Loan added' });
  } catch (error) {
    console.error('Error adding loan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital/seed/kbfarms
 * Seed KB Farms capital investment data
 */
router.post('/seed/kbfarms', async (req, res) => {
  try {
    // Check if KB Farms data already exists
    const existing = await CapitalInvestment.findOne({ 'location.associatedFarm': 'KB Farms' });
    if (existing) {
      return res.json({
        success: false,
        message: 'KB Farms data already exists. Delete existing entries first to re-seed.',
        count: await CapitalInvestment.countDocuments({ 'location.associatedFarm': 'KB Farms' })
      });
    }

    const { kbFarmsData } = require('../seeds/kbfarms-capital');
    const result = await CapitalInvestment.insertMany(kbFarmsData);

    const totalAcres = kbFarmsData.reduce((sum, item) => sum + (item.landDetails?.totalAcres || 0), 0);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${result.length} KB Farms capital investments`,
      count: result.length,
      totalAcres: totalAcres.toFixed(2),
      data: result.map(r => ({ name: r.name, acres: r.landDetails?.totalAcres || 0 }))
    });
  } catch (error) {
    console.error('Error seeding KB Farms data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
