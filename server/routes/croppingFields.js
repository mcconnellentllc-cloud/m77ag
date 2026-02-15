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
