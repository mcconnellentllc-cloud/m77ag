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
 * Seed KB Farms capital investment data (force=true to replace existing)
 */
router.post('/seed/kbfarms', async (req, res) => {
  try {
    const { force } = req.body;
    const existingCount = await CapitalInvestment.countDocuments({ 'location.associatedFarm': 'KB Farms' });

    // Delete existing if force=true
    if (existingCount > 0) {
      if (!force) {
        return res.json({
          success: false,
          message: 'KB Farms data exists. Click again to replace with updated data.',
          count: existingCount,
          needsForce: true
        });
      }
      await CapitalInvestment.deleteMany({ 'location.associatedFarm': 'KB Farms' });
    }

    // Clear require cache to get fresh data
    delete require.cache[require.resolve('../seeds/kbfarms-capital')];
    const { kbFarmsData } = require('../seeds/kbfarms-capital');
    const result = await CapitalInvestment.insertMany(kbFarmsData);

    const totalAcres = kbFarmsData.reduce((sum, item) => sum + (item.landDetails?.totalAcres || 0), 0);
    const totalValue = kbFarmsData.reduce((sum, item) => sum + (item.currentValue?.estimatedValue || 0), 0);
    const totalDebt = kbFarmsData.reduce((sum, item) => {
      return sum + (item.loans || []).reduce((s, l) => s + (l.currentBalance || 0), 0);
    }, 0);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${result.length} KB Farms capital investments`,
      count: result.length,
      totalAcres: totalAcres.toFixed(2),
      totalValue: totalValue,
      totalDebt: totalDebt,
      equity: totalValue - totalDebt,
      data: result.map(r => ({ name: r.name, acres: r.landDetails?.totalAcres || 0 }))
    });
  } catch (error) {
    console.error('Error seeding KB Farms data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital/sync/vehicles
 * Sync vehicle values from seed data to database (updates values only, preserves other data)
 */
router.post('/sync/vehicles', async (req, res) => {
  try {
    // Clear require cache to get fresh data
    delete require.cache[require.resolve('../seeds/vehicles-capital')];
    const { vehicleData } = require('../seeds/vehicles-capital');

    const results = { updated: [], notFound: [], errors: [] };

    for (const seedVehicle of vehicleData) {
      try {
        // Find by name (case-insensitive)
        const existing = await CapitalInvestment.findOne({
          type: 'vehicle',
          name: { $regex: new RegExp(`^${seedVehicle.name}$`, 'i') }
        });

        if (existing) {
          // Update value fields only
          existing.currentValue = {
            ...existing.currentValue,
            estimatedValue: seedVehicle.currentValue.estimatedValue,
            lastAppraisalDate: seedVehicle.currentValue.lastAppraisalDate,
            notes: seedVehicle.currentValue.notes
          };

          // Update vehicle details if provided
          if (seedVehicle.vehicleDetails) {
            existing.vehicleDetails = {
              ...existing.vehicleDetails,
              ...seedVehicle.vehicleDetails
            };
          }

          await existing.save();
          results.updated.push({
            name: existing.name,
            newValue: seedVehicle.currentValue.estimatedValue
          });
        } else {
          results.notFound.push(seedVehicle.name);
        }
      } catch (err) {
        results.errors.push({ name: seedVehicle.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Synced ${results.updated.length} vehicles. ${results.notFound.length} not found in database.`,
      ...results
    });
  } catch (error) {
    console.error('Error syncing vehicle values:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/capital/seed/vehicles
 * Seed vehicle capital investment data - ONLY adds missing, never overwrites
 */
router.post('/seed/vehicles', async (req, res) => {
  try {
    // Clear require cache to get fresh data
    delete require.cache[require.resolve('../seeds/vehicles-capital')];
    const { vehicleData } = require('../seeds/vehicles-capital');

    // Get existing vehicle names
    const existingVehicles = await CapitalInvestment.find({ type: 'vehicle' }, 'name');
    const existingNames = new Set(existingVehicles.map(v => v.name.toLowerCase().trim()));

    // Only add vehicles that don't exist
    const missingVehicles = vehicleData.filter(v =>
      !existingNames.has(v.name.toLowerCase().trim())
    );

    if (missingVehicles.length === 0) {
      return res.json({
        success: true,
        message: 'All vehicles already exist. No changes made.',
        added: 0,
        existing: existingVehicles.length
      });
    }

    const result = await CapitalInvestment.insertMany(missingVehicles);

    res.status(201).json({
      success: true,
      message: `Added ${result.length} missing vehicles. ${existingVehicles.length} existing vehicles unchanged.`,
      added: result.length,
      existing: existingVehicles.length,
      newVehicles: result.map(r => r.name)
    });
  } catch (error) {
    console.error('Error seeding vehicle data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
