const express = require('express');
const router = express.Router();
const CroppingField = require('../models/croppingField');

// Get all fields
router.get('/', async (req, res) => {
  try {
    const { farm, crop } = req.query;
    const filter = {};

    if (farm) filter.farm = farm;
    if (crop) filter.crop2026 = crop;

    const fields = await CroppingField.find(filter).sort({ farm: 1, field: 1 });

    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fields' });
  }
});

// Get budget summary - overall M77 AG rollup
router.get('/summary/budget', async (req, res) => {
  try {
    const fields = await CroppingField.find({});

    // Non-productive crop types - no revenue expected
    const nonProductive = ['PASTURE', 'FALLOW', 'WASTE', 'BUILDING SITE'];

    let totalAcres = 0;
    let productiveAcres = 0;
    let totalCosts = 0;
    let totalRevenue = 0;
    const costBreakdown = {
      seed: 0, fertilizer: 0, chemicals: 0, cropInsurance: 0,
      fuelOil: 0, repairs: 0, customHire: 0, landRent: 0,
      dryingHauling: 0, misc: 0
    };

    const farmSummaries = {};

    fields.forEach(f => {
      const acres = f.acres || 0;
      totalAcres += acres;

      if (!nonProductive.includes(f.crop2026)) {
        productiveAcres += acres;
      }

      // Cost calculations
      const c = f.costs || {};
      const fieldCostPerAcre = (c.seed || 0) + (c.fertilizer || 0) + (c.chemicals || 0) +
        (c.cropInsurance || 0) + (c.fuelOil || 0) + (c.repairs || 0) +
        (c.customHire || 0) + (c.landRent || 0) + (c.dryingHauling || 0) + (c.misc || 0);
      const fieldTotalCost = fieldCostPerAcre * acres;
      totalCosts += fieldTotalCost;

      // Revenue calculations
      const revenuePerAcre = ((f.projectedYield || 0) * (f.projectedPrice || 0)) + (f.governmentPayment || 0);
      const fieldTotalRevenue = revenuePerAcre * acres;
      totalRevenue += fieldTotalRevenue;

      // Accumulate cost breakdown
      Object.keys(costBreakdown).forEach(key => {
        costBreakdown[key] += (c[key] || 0) * acres;
      });

      // Farm rollup
      if (!farmSummaries[f.farm]) {
        farmSummaries[f.farm] = {
          farm: f.farm,
          totalAcres: 0,
          productiveAcres: 0,
          fieldCount: 0,
          totalCosts: 0,
          totalRevenue: 0,
          netIncome: 0,
          crops: {}
        };
      }
      const fs = farmSummaries[f.farm];
      fs.totalAcres += acres;
      fs.fieldCount++;
      if (!nonProductive.includes(f.crop2026)) {
        fs.productiveAcres += acres;
      }
      fs.totalCosts += fieldTotalCost;
      fs.totalRevenue += fieldTotalRevenue;
      fs.netIncome += (revenuePerAcre - fieldCostPerAcre) * acres;

      // Crop breakdown per farm
      const crop = f.crop2026 || 'UNKNOWN';
      if (!fs.crops[crop]) {
        fs.crops[crop] = { acres: 0, cost: 0, revenue: 0, fields: 0 };
      }
      fs.crops[crop].acres += acres;
      fs.crops[crop].cost += fieldTotalCost;
      fs.crops[crop].revenue += fieldTotalRevenue;
      fs.crops[crop].fields++;
    });

    // Convert farm summaries to array sorted by name
    const farms = Object.values(farmSummaries)
      .map(fs => ({
        ...fs,
        avgCostPerAcre: fs.totalAcres > 0 ? fs.totalCosts / fs.totalAcres : 0,
        avgRevenuePerAcre: fs.productiveAcres > 0 ? fs.totalRevenue / fs.productiveAcres : 0
      }))
      .sort((a, b) => a.farm.localeCompare(b.farm));

    res.json({
      success: true,
      overall: {
        totalAcres,
        productiveAcres,
        totalFields: fields.length,
        totalCosts,
        totalRevenue,
        netIncome: totalRevenue - totalCosts,
        avgCostPerAcre: totalAcres > 0 ? totalCosts / totalAcres : 0,
        avgRevenuePerAcre: productiveAcres > 0 ? totalRevenue / productiveAcres : 0,
        costBreakdown
      },
      farms
    });
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch budget summary' });
  }
});

// Get budget detail for a specific farm
router.get('/summary/budget/:farmName', async (req, res) => {
  try {
    const fields = await CroppingField.find({ farm: req.params.farmName }).sort({ field: 1 });
    const nonProductive = ['PASTURE', 'FALLOW', 'WASTE', 'BUILDING SITE'];

    let totalAcres = 0;
    let productiveAcres = 0;
    let totalCosts = 0;
    let totalRevenue = 0;

    const fieldDetails = fields.map(f => {
      const acres = f.acres || 0;
      totalAcres += acres;
      if (!nonProductive.includes(f.crop2026)) productiveAcres += acres;

      const c = f.costs || {};
      const costPerAcre = (c.seed || 0) + (c.fertilizer || 0) + (c.chemicals || 0) +
        (c.cropInsurance || 0) + (c.fuelOil || 0) + (c.repairs || 0) +
        (c.customHire || 0) + (c.landRent || 0) + (c.dryingHauling || 0) + (c.misc || 0);
      const fieldCost = costPerAcre * acres;
      const revenuePerAcre = ((f.projectedYield || 0) * (f.projectedPrice || 0)) + (f.governmentPayment || 0);
      const fieldRevenue = revenuePerAcre * acres;

      totalCosts += fieldCost;
      totalRevenue += fieldRevenue;

      return {
        _id: f._id,
        field: f.field,
        crop: f.crop2026,
        acres,
        costs: f.costs || {},
        costPerAcre,
        totalCost: fieldCost,
        projectedYield: f.projectedYield || 0,
        projectedPrice: f.projectedPrice || 0,
        governmentPayment: f.governmentPayment || 0,
        revenuePerAcre,
        totalRevenue: fieldRevenue,
        netPerAcre: revenuePerAcre - costPerAcre,
        netIncome: fieldRevenue - fieldCost,
        isProductive: !nonProductive.includes(f.crop2026)
      };
    });

    res.json({
      success: true,
      farm: req.params.farmName,
      summary: {
        totalAcres,
        productiveAcres,
        fieldCount: fields.length,
        totalCosts,
        totalRevenue,
        netIncome: totalRevenue - totalCosts
      },
      fields: fieldDetails
    });
  } catch (error) {
    console.error('Error fetching farm budget:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farm budget' });
  }
});

// Bulk update budget for a field
router.put('/:id/budget', async (req, res) => {
  try {
    const { costs, projectedYield, projectedPrice, governmentPayment } = req.body;

    const updateData = {};
    if (costs) updateData.costs = costs;
    if (typeof projectedYield === 'number') updateData.projectedYield = projectedYield;
    if (typeof projectedPrice === 'number') updateData.projectedPrice = projectedPrice;
    if (typeof governmentPayment === 'number') updateData.governmentPayment = governmentPayment;

    const field = await CroppingField.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    res.json({ success: true, field });
  } catch (error) {
    console.error('Error updating field budget:', error);
    res.status(500).json({ success: false, error: 'Failed to update budget' });
  }
});

// Get summary by farm
router.get('/summary/farms', async (req, res) => {
  try {
    const fields = await CroppingField.find({});

    const farmSummary = {};
    fields.forEach(f => {
      if (!farmSummary[f.farm]) {
        farmSummary[f.farm] = {
          farm: f.farm,
          totalAcres: 0,
          fieldCount: 0,
          crops: {}
        };
      }
      farmSummary[f.farm].fieldCount++;
      if (f.acres) {
        farmSummary[f.farm].totalAcres += f.acres;
        farmSummary[f.farm].crops[f.crop2026] = (farmSummary[f.farm].crops[f.crop2026] || 0) + f.acres;
      }
    });

    res.json({
      success: true,
      farms: Object.values(farmSummary)
    });
  } catch (error) {
    console.error('Error fetching farm summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farm summary' });
  }
});

// Get summary by crop for 2026
router.get('/summary/crops', async (req, res) => {
  try {
    const fields = await CroppingField.find({});

    const cropSummary = {};
    let totalAcres = 0;

    fields.forEach(f => {
      if (f.acres && f.crop2026) {
        totalAcres += f.acres;
        if (!cropSummary[f.crop2026]) {
          cropSummary[f.crop2026] = {
            crop: f.crop2026,
            totalAcres: 0,
            fieldCount: 0
          };
        }
        cropSummary[f.crop2026].totalAcres += f.acres;
        cropSummary[f.crop2026].fieldCount++;
      }
    });

    // Sort by acres descending
    const sortedCrops = Object.values(cropSummary).sort((a, b) => b.totalAcres - a.totalAcres);

    res.json({
      success: true,
      totalAcres,
      crops: sortedCrops
    });
  } catch (error) {
    console.error('Error fetching crop summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crop summary' });
  }
});

// Get fields by farm
router.get('/farm/:farmName', async (req, res) => {
  try {
    const fields = await CroppingField.find({ farm: req.params.farmName }).sort({ field: 1 });

    const totalAcres = fields.reduce((sum, f) => sum + (f.acres || 0), 0);

    res.json({
      success: true,
      farm: req.params.farmName,
      fieldCount: fields.length,
      totalAcres,
      fields
    });
  } catch (error) {
    console.error('Error fetching farm fields:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farm fields' });
  }
});

// Get single field
router.get('/:id', async (req, res) => {
  try {
    const field = await CroppingField.findById(req.params.id);

    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    res.json({ success: true, field });
  } catch (error) {
    console.error('Error fetching field:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch field' });
  }
});

// Update field
router.put('/:id', async (req, res) => {
  try {
    const field = await CroppingField.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    res.json({ success: true, field });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ success: false, error: 'Failed to update field' });
  }
});

module.exports = router;
