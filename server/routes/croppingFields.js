const express = require('express');
const router = express.Router();
const CroppingField = require('../models/croppingField');

// === CSV IMPORT ENDPOINT ===
router.post('/import/crop-history', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    let updated = 0;
    let notFound = 0;
    const missing = [];

    for (const row of rows) {
      const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
      if (!field) {
        if (!missing.find(m => m.farm === row.farm && m.field === row.field)) {
          missing.push({ farm: row.farm, field: row.field });
        }
        notFound++;
        continue;
      }

      const year = parseInt(row.year);
      if (!year) continue;

      const costs = row.costs || {};
      const entry = {
        year,
        crop: row.crop || '',
        variety: row.variety || '',
        yieldPerAcre: parseFloat(row.yieldPerAcre) || 0,
        pricePerBushel: parseFloat(row.pricePerBushel) || 0,
        costs: {
          seed: parseFloat(costs.seed || row.seed) || 0,
          fertilizer: parseFloat(costs.fertilizer || row.fertilizer) || 0,
          chemicals: parseFloat(costs.chemicals || row.chemicals) || 0,
          cropInsurance: parseFloat(costs.cropInsurance || row.cropInsurance) || 0,
          fuelOil: parseFloat(costs.fuelOil || row.fuelOil) || 0,
          repairs: parseFloat(costs.repairs || row.repairs) || 0,
          customHire: parseFloat(costs.customHire || row.customHire) || 0,
          landRent: parseFloat(costs.landRent || row.landRent) || 0,
          dryingHauling: parseFloat(costs.dryingHauling || row.dryingHauling) || 0,
          taxes: parseFloat(costs.taxes || row.taxes) || 0,
          misc: parseFloat(costs.misc || row.misc) || 0
        },
        notes: row.notes || ''
      };

      const c = entry.costs;
      entry.totalCost = c.seed + c.fertilizer + c.chemicals + c.cropInsurance +
        c.fuelOil + c.repairs + c.customHire + c.landRent + c.dryingHauling +
        c.taxes + c.misc;

      const acres = field.acres || 0;
      entry.grossRevenue = entry.yieldPerAcre * entry.pricePerBushel * acres;
      entry.netIncome = entry.grossRevenue - (entry.totalCost * acres);
      entry.profitPerAcre = acres > 0 ? (entry.grossRevenue / acres) - entry.totalCost : 0;

      const existingIdx = field.cropHistory.findIndex(h => h.year === year);
      if (existingIdx >= 0) {
        field.cropHistory[existingIdx] = { ...field.cropHistory[existingIdx].toObject(), ...entry };
      } else {
        field.cropHistory.push(entry);
      }
      field.cropHistory.sort((a, b) => b.year - a.year);

      const cropKey = `crop${year}`;
      if (field.schema.paths[cropKey] && entry.crop) {
        field[cropKey] = entry.crop;
      }

      await field.save();
      updated++;
    }

    res.json({
      success: true,
      updated,
      notFound,
      missing,
      message: `Imported ${updated} crop history records. ${notFound > 0 ? notFound + ' rows had unmatched fields.' : ''}`
    });
  } catch (error) {
    console.error('Error importing crop history:', error);
    res.status(500).json({ success: false, error: 'Import failed: ' + error.message });
  }
});

router.post('/import/field-details', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    let updated = 0;
    let notFound = 0;

    for (const row of rows) {
      const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
      if (!field) { notFound++; continue; }

      if (row.county) field.county = row.county;
      if (row.soilType || row.soilClass) {
        if (!field.soil) field.soil = {};
        if (row.soilType) field.soil.type = row.soilType;
        if (row.soilClass) field.soil.class = row.soilClass;
      }
      if (row.leaseType) {
        field.lease = {
          type: row.leaseType,
          landlord: row.landlord || '',
          rentPerAcre: parseFloat(row.rentPerAcre) || 0,
          sharePercentage: parseFloat(row.sharePercentage) || 0
        };
      }
      if (row.insProvider || row.insType) {
        field.insurance = {
          provider: row.insProvider || '',
          type: row.insType || '',
          level: parseFloat(row.insLevel) || 0,
          guaranteedYield: parseFloat(row.insGuaranteedYield) || 0,
          guaranteedPrice: parseFloat(row.insGuaranteedPrice) || 0,
          premiumPerAcre: parseFloat(row.insPremiumPerAcre) || 0,
          subsidy: parseFloat(row.insSubsidy) || 0,
          netPremium: parseFloat(row.insNetPremium) || 0
        };
      }
      if (row.propertyTaxPerAcre || row.assessedValue) {
        field.taxes = {
          propertyTaxPerAcre: parseFloat(row.propertyTaxPerAcre) || 0,
          assessedValue: parseFloat(row.assessedValue) || 0,
          taxingAuthority: row.taxAuthority || ''
        };
      }
      if (row.notes) field.notes = row.notes;

      await field.save();
      updated++;
    }

    res.json({ success: true, updated, notFound, message: `Updated ${updated} field details.` });
  } catch (error) {
    console.error('Error importing field details:', error);
    res.status(500).json({ success: false, error: 'Import failed: ' + error.message });
  }
});

router.post('/import/soil-samples', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    let updated = 0;
    let notFound = 0;

    for (const row of rows) {
      const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
      if (!field) { notFound++; continue; }

      if (!field.soil) field.soil = { samples: [] };
      if (!field.soil.samples) field.soil.samples = [];

      field.soil.samples.push({
        date: row.date ? new Date(row.date) : null,
        depth: row.depth || '',
        ph: parseFloat(row.ph) || null,
        nitrogen: parseFloat(row.nitrogen) || null,
        phosphorus: parseFloat(row.phosphorus) || null,
        potassium: parseFloat(row.potassium) || null,
        sulfur: parseFloat(row.sulfur) || null,
        zinc: parseFloat(row.zinc) || null,
        iron: parseFloat(row.iron) || null,
        organicMatter: parseFloat(row.organicMatter) || null,
        cec: parseFloat(row.cec) || null,
        salts: parseFloat(row.salts) || null,
        notes: row.notes || ''
      });
      field.soil.samples.sort((a, b) => new Date(b.date) - new Date(a.date));

      await field.save();
      updated++;
    }

    res.json({ success: true, updated, notFound, message: `Imported ${updated} soil samples.` });
  } catch (error) {
    console.error('Error importing soil samples:', error);
    res.status(500).json({ success: false, error: 'Import failed: ' + error.message });
  }
});

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

// Get summary by crop code (across all years)
router.get('/summary/crop-codes', async (req, res) => {
  try {
    const { year } = req.query;
    const fields = await CroppingField.find({});

    const codeSummary = {};
    const years = year ? [parseInt(year)] : [2025, 2026, 2027, 2028, 2029, 2030];

    fields.forEach(f => {
      years.forEach(yr => {
        const crop = f[`crop${yr}`];
        if (!crop || !f.acres) return;
        const nonProductive = ['WASTE', 'BUILDING SITE', 'PASTURE', 'FALLOW'];
        if (nonProductive.includes(crop)) return;

        const code = crop.toUpperCase().replace(/\s+/g, '-') + String(yr).slice(-2);
        if (!codeSummary[code]) {
          codeSummary[code] = {
            cropCode: code,
            crop,
            year: yr,
            totalAcres: 0,
            fieldCount: 0,
            farms: {},
            fields: []
          };
        }
        codeSummary[code].totalAcres += f.acres;
        codeSummary[code].fieldCount++;
        codeSummary[code].farms[f.farm] = (codeSummary[code].farms[f.farm] || 0) + f.acres;
        codeSummary[code].fields.push({
          id: f._id,
          farm: f.farm,
          field: f.field,
          acres: f.acres
        });
      });
    });

    // Sort by year then crop
    const sorted = Object.values(codeSummary).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.crop.localeCompare(b.crop);
    });

    res.json({ success: true, cropCodes: sorted });
  } catch (error) {
    console.error('Error fetching crop code summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crop code summary' });
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

// === FIELD DETAILS (soil, lease, insurance, taxes, location) ===
router.put('/:id/details', async (req, res) => {
  try {
    const { soil, lease, insurance, taxes, county, section, township, range, notes } = req.body;
    const updateData = {};

    if (soil) updateData.soil = soil;
    if (lease) updateData.lease = lease;
    if (insurance) updateData.insurance = insurance;
    if (taxes) updateData.taxes = taxes;
    if (county !== undefined) updateData.county = county;
    if (section !== undefined) updateData.section = section;
    if (township !== undefined) updateData.township = township;
    if (range !== undefined) updateData.range = range;
    if (notes !== undefined) updateData.notes = notes;

    const field = await CroppingField.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    res.json({ success: true, field });
  } catch (error) {
    console.error('Error updating field details:', error);
    res.status(500).json({ success: false, error: 'Failed to update field details' });
  }
});

// === CROP HISTORY ===

// Add a crop history entry
router.post('/:id/crop-history', async (req, res) => {
  try {
    const field = await CroppingField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    const entry = req.body;

    // Auto-calculate totals if costs are provided
    if (entry.costs) {
      const c = entry.costs;
      entry.totalCost = (c.seed || 0) + (c.fertilizer || 0) + (c.chemicals || 0) +
        (c.cropInsurance || 0) + (c.fuelOil || 0) + (c.repairs || 0) +
        (c.customHire || 0) + (c.landRent || 0) + (c.dryingHauling || 0) +
        (c.taxes || 0) + (c.misc || 0);
    }

    if (entry.yieldPerAcre && entry.pricePerBushel) {
      entry.grossRevenue = entry.yieldPerAcre * entry.pricePerBushel * (field.acres || 0);
    }

    if (entry.totalCost !== undefined) {
      const totalCostField = (entry.totalCost || 0) * (field.acres || 0);
      entry.netIncome = (entry.grossRevenue || 0) - totalCostField;
      entry.profitPerAcre = (entry.grossRevenue || 0) / (field.acres || 1) - (entry.totalCost || 0);
    }

    // Check if year already exists, replace it
    const existingIdx = field.cropHistory.findIndex(h => h.year === entry.year);
    if (existingIdx >= 0) {
      field.cropHistory[existingIdx] = { ...field.cropHistory[existingIdx].toObject(), ...entry };
    } else {
      field.cropHistory.push(entry);
    }

    // Sort by year descending
    field.cropHistory.sort((a, b) => b.year - a.year);

    await field.save();
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error adding crop history:', error);
    res.status(500).json({ success: false, error: 'Failed to add crop history' });
  }
});

// Delete a crop history entry
router.delete('/:id/crop-history/:entryId', async (req, res) => {
  try {
    const field = await CroppingField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    field.cropHistory = field.cropHistory.filter(h => h._id.toString() !== req.params.entryId);
    await field.save();
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error deleting crop history:', error);
    res.status(500).json({ success: false, error: 'Failed to delete crop history' });
  }
});

// === SOIL SAMPLES ===

// Add a soil sample
router.post('/:id/soil-sample', async (req, res) => {
  try {
    const field = await CroppingField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    if (!field.soil) {
      field.soil = { samples: [] };
    }
    if (!field.soil.samples) {
      field.soil.samples = [];
    }

    field.soil.samples.push(req.body);
    field.soil.samples.sort((a, b) => new Date(b.date) - new Date(a.date));

    await field.save();
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error adding soil sample:', error);
    res.status(500).json({ success: false, error: 'Failed to add soil sample' });
  }
});

// Delete a soil sample
router.delete('/:id/soil-sample/:sampleId', async (req, res) => {
  try {
    const field = await CroppingField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    if (field.soil && field.soil.samples) {
      field.soil.samples = field.soil.samples.filter(s => s._id.toString() !== req.params.sampleId);
    }

    await field.save();
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error deleting soil sample:', error);
    res.status(500).json({ success: false, error: 'Failed to delete soil sample' });
  }
});

module.exports = router;
