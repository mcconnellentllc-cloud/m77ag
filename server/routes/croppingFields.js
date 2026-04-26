const express = require('express');
const router = express.Router();
const CroppingField = require('../models/croppingField');
const CapitalInvestment = require('../models/capitalInvestment');

// =============================================
// KB Farms land cost mapping
// Maps quarter number prefixes to their CapitalInvestment parcel name
// so annual loan payments flow into per-acre costs
// =============================================
const KB_QUARTER_TO_PARCEL = {
  '20': 'Pauli Section',
  '21': 'Pauli Section',
  '22': 'Pauli Section',
  '23': 'Pauli Section',
  '24': 'Pauli Section',
  '25': 'Michael Section',
  '26': 'Michael Section',
  '27': 'Michael Section',
  '28': 'Michael Section',
  '29': 'Michael Section',
  '298': 'Michael Section',
  '201': "Neal's Pasture",
  '202': 'Madsen Pasture',
  '299': "Neal's Pasture"
};

// Build land payment per acre for each KBFARMS parcel from CapitalInvestment loans
async function getKBFarmsLandPayments() {
  const kbCapital = await CapitalInvestment.find({ 'location.associatedFarm': 'KB Farms', type: 'land' });
  const parcelPayments = {};

  kbCapital.forEach(cap => {
    const totalAcres = cap.landDetails?.totalAcres || 0;
    let annualPayment = 0;
    (cap.loans || []).forEach(loan => {
      annualPayment += loan.paymentAmount || 0;
    });
    const paymentPerAcre = totalAcres > 0 ? annualPayment / totalAcres : 0;
    parcelPayments[cap.name] = {
      annualPayment,
      totalAcres,
      paymentPerAcre,
      loanBalance: (cap.loans || []).reduce((s, l) => s + (l.currentBalance || 0), 0)
    };
  });

  return parcelPayments;
}

// Get the land payment per acre for a KBFARMS field based on its quarter number
function getLandPaymentForField(fieldName, parcelPayments) {
  // Extract quarter number from field name (e.g., "23.E SW PAULI" -> "23")
  const match = fieldName.match(/^(\d+)/);
  if (!match) return 0;
  const qNum = match[1];
  const parcelName = KB_QUARTER_TO_PARCEL[qNum];
  if (!parcelName || !parcelPayments[parcelName]) return 0;
  return parcelPayments[parcelName].paymentPerAcre;
}

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
        year: parseInt(row.year) || null,
        depth: row.depth || '',
        crop: row.crop || '',
        yieldGoal: parseFloat(row.yieldGoal) || null,

        // Basic / legacy fields
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

        // Extended panel
        bufferPH: parseFloat(row.bufferPH) || null,
        excessLime: row.excessLime || null,
        solubleSalts: parseFloat(row.solubleSalts) || null,
        NO3ppm: parseFloat(row.NO3ppm) || null,
        NO3lbs: parseFloat(row.NO3lbs) || null,
        NO3Total: parseFloat(row.NO3Total) || null,
        olsenP: parseFloat(row.olsenP) || null,
        bray1P: parseFloat(row.bray1P) || null,
        brayP2: parseFloat(row.brayP2) || null,
        calcium: parseFloat(row.calcium) || null,
        magnesium: parseFloat(row.magnesium) || null,
        sodium: parseFloat(row.sodium) || null,
        manganese: parseFloat(row.manganese) || null,
        copper: parseFloat(row.copper) || null,
        boron: parseFloat(row.boron) || null,

        // Base saturation
        baseSat: parseFloat(row.baseSat) || null,
        hSat: parseFloat(row.hSat) || null,
        caSat: parseFloat(row.caSat) || null,
        mgSat: parseFloat(row.mgSat) || null,
        kSat: parseFloat(row.kSat) || null,
        naSat: parseFloat(row.naSat) || null,

        // Alerts
        agronomistAlerts: row.agronomistAlerts || [],
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

// Get all fields (enriched with land payment data for KBFARMS)
router.get('/', async (req, res) => {
  try {
    const { farm, crop } = req.query;
    const filter = {};

    if (farm) filter.farm = farm;
    if (crop) filter.crop2026 = crop;

    const fields = await CroppingField.find(filter).sort({ farm: 1, field: 1 });

    // Enrich KBFARMS fields with land payment per acre from CapitalInvestment loans
    const parcelPayments = await getKBFarmsLandPayments();
    const enriched = fields.map(f => {
      const obj = f.toObject();
      if (obj.farm === 'KBFARMS') {
        obj.landPaymentPerAcre = getLandPaymentForField(obj.field, parcelPayments);
      } else {
        obj.landPaymentPerAcre = 0;
      }
      return obj;
    });

    res.json({
      success: true,
      count: enriched.length,
      fields: enriched
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
// Set market value for all fields in a quarter (by farm + quarter number)
router.put('/quarter/market-value', async (req, res) => {
  try {
    const { farm, quarterNum, marketValuePerAcre } = req.body;
    if (!farm || !quarterNum || typeof marketValuePerAcre !== 'number') {
      return res.status(400).json({ success: false, error: 'Required: farm, quarterNum, marketValuePerAcre' });
    }

    // Match all fields whose name starts with this quarter number
    const regex = new RegExp('^' + quarterNum + '(\\.|\\s)');
    const result = await CroppingField.updateMany(
      { farm, field: { $regex: regex } },
      { $set: { marketValuePerAcre } }
    );

    // Also match standalone fields that are exactly the number + space + name
    const regexExact = new RegExp('^' + quarterNum + '\\s');
    const result2 = await CroppingField.updateMany(
      { farm, field: { $regex: regexExact } },
      { $set: { marketValuePerAcre } }
    );

    const updated = Math.max(result.modifiedCount, result2.modifiedCount);

    res.json({
      success: true,
      modifiedCount: updated,
      message: `Market value set to $${marketValuePerAcre}/ac for quarter ${quarterNum} (${farm})`
    });
  } catch (error) {
    console.error('Error updating quarter market value:', error);
    res.status(500).json({ success: false, error: 'Failed to update market value' });
  }
});

router.put('/:id/budget', async (req, res) => {
  try {
    const { costs, projectedYield, projectedPrice, governmentPayment, marketValuePerAcre } = req.body;

    const updateData = {};
    if (costs) updateData.costs = costs;
    if (typeof projectedYield === 'number') updateData.projectedYield = projectedYield;
    if (typeof projectedPrice === 'number') updateData.projectedPrice = projectedPrice;
    if (typeof governmentPayment === 'number') updateData.governmentPayment = governmentPayment;
    if (typeof marketValuePerAcre === 'number') updateData.marketValuePerAcre = marketValuePerAcre;

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

// === AI SOIL RECOMMENDATIONS ===
// Uses Anthropic Claude API if ANTHROPIC_API_KEY is set, otherwise falls back to rule-based engine
router.post('/ai-recommendation', async (req, res) => {
  try {
    const { prompt, field, latestSample, sampleHistory, concerns } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    // Build context for the AI or rule engine
    const s = latestSample || {};
    const crop = (field && field.crop) || 'Unknown';
    const fieldName = (field && field.name) || 'Unknown';
    const soilType = (field && field.soilType) || '';
    const acres = (field && field.acres) || 0;

    // Try Anthropic API first if available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicResponse = await callAnthropicAPI(prompt, field, latestSample, sampleHistory, concerns);
        if (anthropicResponse) {
          return res.json({ success: true, recommendation: anthropicResponse, source: 'claude' });
        }
      } catch (apiErr) {
        console.error('Anthropic API error, falling back to rule engine:', apiErr.message);
      }
    }

    // Fall back to comprehensive rule-based recommendation engine
    const recommendation = generateDetailedRecommendation(prompt, field, s, sampleHistory || [], concerns || []);
    res.json({ success: true, recommendation, source: 'agronomic-engine' });

  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendation' });
  }
});

// Anthropic API call
async function callAnthropicAPI(prompt, field, latestSample, sampleHistory, concerns) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const s = latestSample || {};
  const crop = (field && field.crop) || 'Unknown';

  // Build soil data summary
  const soilParts = [];
  if (s.ph != null) soilParts.push(`pH: ${s.ph}`);
  if (s.bufferPH != null) soilParts.push(`Buffer pH: ${s.bufferPH}`);
  if (s.organicMatter != null) soilParts.push(`Organic Matter: ${s.organicMatter}%`);
  if (s.NO3ppm != null) soilParts.push(`NO3-N: ${s.NO3ppm} ppm (${s.NO3lbs || '?'} lb/A)`);
  if (s.olsenP != null) soilParts.push(`Olsen P: ${s.olsenP} ppm`);
  if (s.brayP2 != null) soilParts.push(`Bray-2 P: ${s.brayP2} ppm`);
  if (s.potassium != null) soilParts.push(`Potassium: ${s.potassium} ppm`);
  if (s.sulfur != null) soilParts.push(`Sulfur: ${s.sulfur} ppm`);
  if (s.calcium != null) soilParts.push(`Calcium: ${s.calcium} ppm`);
  if (s.magnesium != null) soilParts.push(`Magnesium: ${s.magnesium} ppm`);
  if (s.zinc != null) soilParts.push(`Zinc: ${s.zinc} ppm`);
  if (s.iron != null) soilParts.push(`Iron: ${s.iron} ppm`);
  if (s.boron != null) soilParts.push(`Boron: ${s.boron} ppm`);
  if (s.copper != null) soilParts.push(`Copper: ${s.copper} ppm`);
  if (s.manganese != null) soilParts.push(`Manganese: ${s.manganese} ppm`);
  if (s.cec != null) soilParts.push(`CEC: ${s.cec} me/100g`);
  if (s.caSat != null) soilParts.push(`Ca Sat: ${s.caSat}%`);
  if (s.mgSat != null) soilParts.push(`Mg Sat: ${s.mgSat}%`);
  if (s.kSat != null) soilParts.push(`K Sat: ${s.kSat}%`);
  if (s.naSat != null) soilParts.push(`Na Sat: ${s.naSat}%`);

  const systemPrompt = `You are an expert agronomist in Northeast Colorado dryland and irrigated farming. You provide specific, actionable recommendations based on soil test data. Keep responses practical and focused on the farmer's question. Use specific product rates and application timing when possible. This is for a commercial farming operation (M77 AG) that primarily grows dryland corn, wheat, sorghum, and triticale. Reference common products available in Northeast Colorado. Do not use emojis. Keep a professional tone.`;

  const userMessage = `Field: ${field.name} (${field.farm})
Acres: ${field.acres || 'Unknown'}
Planned Crop: ${crop}
Soil Type: ${field.soilType || 'Not specified'}
County: ${field.county || 'Northeast Colorado'}

Latest Soil Test Results:
${soilParts.join('\n')}

${concerns && concerns.length > 0 ? 'Identified Concerns:\n' + concerns.map(c => `- ${c.area}: ${c.message}`).join('\n') : ''}

${sampleHistory && sampleHistory.length > 1 ? 'Historical samples available for trend analysis (' + sampleHistory.length + ' records).' : ''}

Farmer Question: ${prompt}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const data = await response.json();
  if (data.content && data.content[0] && data.content[0].text) {
    return data.content[0].text;
  }
  return null;
}

// Comprehensive rule-based recommendation engine
function generateDetailedRecommendation(prompt, field, s, history, concerns) {
  const crop = (field && field.crop) || '';
  const acres = (field && field.acres) || 0;
  const fieldName = (field && field.name) || '';
  const promptLower = prompt.toLowerCase();

  let lines = [];

  // Detect what kind of recommendation is being asked for
  const wantsCornStarter = promptLower.includes('corn starter') || promptLower.includes('starter');
  const wantsFertProgram = promptLower.includes('fertilizer program') || promptLower.includes('full program') || promptLower.includes('fert program');
  const wantsConcerns = promptLower.includes('concern') || promptLower.includes('health') || promptLower.includes('problem');
  const wantsMicro = promptLower.includes('micro') || promptLower.includes('trace');
  const wantsLime = promptLower.includes('lime') || promptLower.includes('ph');
  const wantsCompare = promptLower.includes('compare') || promptLower.includes('ideal');

  if (wantsCornStarter) {
    lines.push('### Corn Starter Fertilizer Recommendation');
    lines.push(`**Field:** ${fieldName} | **Crop:** ${crop} | **Acres:** ${acres}`);
    lines.push('');

    if (s.olsenP != null && s.olsenP < 15) {
      lines.push('**Phosphorus is the priority** - Olsen P at ' + s.olsenP + ' ppm is below the 15 ppm threshold for dryland corn.');
      lines.push('');
      lines.push('**Recommended Starter:** 10-34-0 (ammonium polyphosphate) applied in-furrow at planting.');
      lines.push('- Rate: 5-7 gal/acre in a 2x2 band');
      lines.push('- This delivers approximately 15-21 lb/A P2O5 and 5-7 lb/A N');
      lines.push('- The polyphosphate form has better early-season availability in cool soils');
    } else {
      lines.push('Olsen P is ' + (s.olsenP || 'not tested') + ' ppm - ' + (s.olsenP >= 15 ? 'adequate' : 'check levels') + '.');
      lines.push('');
      lines.push('**Recommended Starter Options:**');
      lines.push('- **10-34-0** at 3-5 gal/acre in 2x2 band for general starter response');
      lines.push('- **9-18-9** at 5 gal/acre if K is also needed (K at ' + (s.potassium || '?') + ' ppm)');
    }

    if (s.zinc != null && s.zinc < 0.8) {
      lines.push('');
      lines.push('**Add zinc to starter:** Zn at ' + s.zinc + ' ppm warrants in-furrow zinc.');
      lines.push('- Add 1 qt/acre zinc sulfate solution (36% Zn) to the starter blend');
      lines.push('- Or use a complete starter like 6-24-6 with zinc at 5 gal/acre');
    }

    if (s.sulfur != null && s.sulfur < 8) {
      lines.push('');
      lines.push('**Consider adding sulfur:** S at ' + s.sulfur + ' ppm is low.');
      lines.push('- Add 12-0-0-26S (ATS) at 2-3 gal/acre blended with starter');
    }

    if (s.ph != null) {
      lines.push('');
      if (s.ph < 6.0) {
        lines.push('**pH Note:** At pH ' + s.ph + ', phosphorus availability is reduced. The starter band helps overcome this by placing P near the seedling root zone.');
      } else if (s.ph > 7.5) {
        lines.push('**pH Note:** At pH ' + s.ph + ', consider including a small amount of acidifying product (ATS or UAN) in the starter to improve local P availability.');
      }
    }

    lines.push('');
    lines.push('**Application Timing:** Apply at planting in a 2x2 placement (2 inches to the side, 2 inches below seed). Do not exceed 7 gal/acre total liquid in-furrow on sandy soils to avoid salt injury.');

  } else if (wantsFertProgram) {
    lines.push('### Full Fertilizer Program for ' + (crop || 'Planned Crop'));
    lines.push(`**Field:** ${fieldName} | **Acres:** ${acres}`);
    lines.push('');

    // Nitrogen
    lines.push('**NITROGEN**');
    const residualN = s.NO3lbs || 0;
    if (crop === 'CORN' || crop === 'SORGHUM') {
      const yieldGoal = s.yieldGoal || 80;
      const nFactor = crop === 'CORN' ? 1.2 : 1.0;
      const totalNeed = Math.round(yieldGoal * nFactor);
      const toApply = Math.max(0, totalNeed - residualN);
      lines.push(`- Yield goal: ${yieldGoal} bu/A | N requirement: ${totalNeed} lb/A`);
      lines.push(`- Residual soil N: ${residualN} lb/A`);
      lines.push(`- **Supplemental N needed: ${toApply} lb/A**`);
      if (toApply > 0) {
        lines.push(`- Option 1: UAN 32% at ${Math.round(toApply / 0.32 / 11.06)} gal/A pre-plant or sidedress`);
        lines.push(`- Option 2: Anhydrous ammonia at ${Math.round(toApply / 0.82)} lb/A pre-plant`);
        lines.push(`- Split application recommended: 40% pre-plant, 60% sidedress at V6`);
      }
    } else if (crop === 'WHEAT' || crop === 'TRITICALE') {
      const yieldGoal = s.yieldGoal || 40;
      const totalNeed = Math.round(yieldGoal * 2.0);
      const toApply = Math.max(0, totalNeed - residualN);
      lines.push(`- Yield goal: ${yieldGoal} bu/A | N requirement: ${totalNeed} lb/A`);
      lines.push(`- Residual soil N: ${residualN} lb/A`);
      lines.push(`- **Supplemental N needed: ${toApply} lb/A**`);
      if (toApply > 0) {
        lines.push(`- Apply UAN 32% topdress at greenup: ${Math.round(toApply / 0.32 / 11.06)} gal/A`);
      }
    }

    // Phosphorus
    lines.push('');
    lines.push('**PHOSPHORUS**');
    if (s.olsenP != null) {
      if (s.olsenP < 10) {
        lines.push(`- Olsen P: ${s.olsenP} ppm - **DEFICIENT**`);
        lines.push('- Build application: 40-60 lb/A P2O5 broadcast + 15-20 lb/A P2O5 in starter');
        lines.push('- Product: MAP (11-52-0) at 80-115 lb/A broadcast');
      } else if (s.olsenP < 15) {
        lines.push(`- Olsen P: ${s.olsenP} ppm - below optimal`);
        lines.push('- Maintenance: 25-35 lb/A P2O5 in starter band');
        lines.push('- Product: 10-34-0 at 5-7 gal/A in 2x2');
      } else {
        lines.push(`- Olsen P: ${s.olsenP} ppm - adequate`);
        lines.push('- Maintenance only: starter band if desired');
      }
    } else {
      lines.push('- Olsen P not tested - recommend soil test before program');
    }

    // Potassium
    lines.push('');
    lines.push('**POTASSIUM**');
    if (s.potassium != null) {
      if (s.potassium < 200) {
        lines.push(`- K: ${s.potassium} ppm - **DEFICIENT**`);
        lines.push('- Apply 60-80 lb/A K2O broadcast');
        lines.push('- Product: Potash (0-0-60) at 100-135 lb/A');
      } else if (s.potassium < 300) {
        lines.push(`- K: ${s.potassium} ppm - adequate but monitor`);
      } else {
        lines.push(`- K: ${s.potassium} ppm - sufficient, no application needed`);
      }
    }

    // Sulfur
    lines.push('');
    lines.push('**SULFUR**');
    if (s.sulfur != null) {
      if (s.sulfur < 5) {
        lines.push(`- S: ${s.sulfur} ppm - low`);
        lines.push('- Apply 10-15 lb/A S as ATS (12-0-0-26S) or gypsum');
      } else {
        lines.push(`- S: ${s.sulfur} ppm - adequate`);
      }
    }

    // Micronutrients
    lines.push('');
    lines.push('**MICRONUTRIENTS**');
    if (s.zinc != null && s.zinc < 0.8 && (crop === 'CORN' || crop === 'SORGHUM')) {
      lines.push(`- Zinc: ${s.zinc} ppm - add 1-2 lb/A Zn as zinc sulfate`);
    }
    if (s.boron != null && s.boron < 0.3) {
      lines.push(`- Boron: ${s.boron} ppm - apply 0.5 lb/A B as Solubor`);
    }
    if (s.manganese != null && s.manganese < 2) {
      lines.push(`- Manganese: ${s.manganese} ppm - consider foliar Mn at V6`);
    }

    // Estimated cost
    lines.push('');
    lines.push('**ESTIMATED PROGRAM COST**');
    lines.push('- Consult your local ag retailer for current pricing');
    lines.push('- Budget $40-80/acre for a complete dryland program in NE Colorado');

  } else if (wantsConcerns) {
    lines.push('### Soil Health Assessment');
    lines.push(`**Field:** ${fieldName} | **Crop:** ${crop}`);
    lines.push('');

    if (concerns.length === 0) {
      lines.push('No major concerns detected in the most recent soil test. Key metrics are within acceptable ranges.');
    } else {
      lines.push(`**${concerns.length} concern${concerns.length > 1 ? 's' : ''} identified:**`);
      lines.push('');
      concerns.forEach((c, i) => {
        lines.push(`**${i + 1}. ${c.area}** (${c.severity})`);
        lines.push(`- ${c.message}`);

        // Add specific remediation advice for each concern
        if (c.area === 'pH' && c.severity === 'critical') {
          lines.push('- **Action:** Apply ag lime at 2-3 tons/acre. Use dolomitic lime if Mg is also low. Best applied in fall for spring planting.');
        } else if (c.area === 'pH') {
          lines.push('- **Action:** Monitor and plan lime application before next acid-sensitive crop. Target pH 6.5.');
        } else if (c.area === 'Organic Matter') {
          lines.push('- **Action:** Incorporate crop residue, consider cover crops where moisture allows, minimize tillage.');
        } else if (c.area === 'Nitrogen') {
          lines.push('- **Action:** Plan supplemental N application. Split applications improve efficiency.');
        } else if (c.area === 'Phosphorus') {
          lines.push('- **Action:** Broadcast MAP or DAP in fall, plus in-furrow starter at planting.');
        } else if (c.area === 'Potassium') {
          lines.push('- **Action:** Broadcast potash (0-0-60). K is relatively immobile - fall application works well.');
        }
        lines.push('');
      });
    }

    // Trend analysis
    if (history.length >= 2) {
      lines.push('### Trend Analysis');
      const sorted = [...history].sort((a, b) => (a.year || 0) - (b.year || 0));
      const oldest = sorted[0], newest = sorted[sorted.length - 1];
      if (oldest.ph != null && newest.ph != null) {
        const phChange = newest.ph - oldest.ph;
        lines.push(`- pH trend: ${oldest.ph} -> ${newest.ph} (${phChange > 0 ? '+' : ''}${phChange.toFixed(1)} over ${sorted.length} samples)`);
      }
      if (oldest.organicMatter != null && newest.organicMatter != null) {
        lines.push(`- O.M. trend: ${oldest.organicMatter}% -> ${newest.organicMatter}%`);
      }
    }

  } else if (wantsMicro) {
    lines.push('### Micronutrient Assessment');
    lines.push(`**Field:** ${fieldName} | **Crop:** ${crop}`);
    lines.push('');

    const micros = [
      { key: 'zinc', name: 'Zinc', unit: 'ppm', critical: 0.5, adequate: 1.0, cropNote: 'Critical for corn - affects pollination and kernel set.' },
      { key: 'iron', name: 'Iron', unit: 'ppm', critical: 2, adequate: 4, cropNote: 'Deficiency rare in NE Colorado unless pH > 7.8.' },
      { key: 'boron', name: 'Boron', unit: 'ppm', critical: 0.2, adequate: 0.5, cropNote: 'Important for cell wall formation. Low levels common on sandy soils.' },
      { key: 'manganese', name: 'Manganese', unit: 'ppm', critical: 1, adequate: 2, cropNote: 'Availability drops on high pH and high OM soils.' },
      { key: 'copper', name: 'Copper', unit: 'ppm', critical: 0.2, adequate: 0.5, cropNote: 'Deficiency uncommon. Excess can be toxic.' }
    ];

    micros.forEach(m => {
      const val = s[m.key];
      if (val != null) {
        const status = val < m.critical ? 'DEFICIENT' : val < m.adequate ? 'Low' : 'Adequate';
        lines.push(`**${m.name}:** ${val} ${m.unit} - ${status}`);
        lines.push(`- ${m.cropNote}`);
        if (val < m.adequate) {
          lines.push(`- Consider supplemental application.`);
        }
        lines.push('');
      } else {
        lines.push(`**${m.name}:** Not tested`);
        lines.push('');
      }
    });

  } else if (wantsLime) {
    lines.push('### Lime Recommendation');
    lines.push(`**Field:** ${fieldName} | **pH:** ${s.ph || 'Not tested'} | **Buffer pH:** ${s.bufferPH || 'Not tested'}`);
    lines.push('');

    if (s.ph == null) {
      lines.push('pH has not been tested for this field. A soil test is needed before making lime recommendations.');
    } else if (s.ph >= 6.5) {
      lines.push(`pH at ${s.ph} is within the acceptable range for most crops. No lime application needed.`);
    } else {
      const targetPH = 6.5;
      lines.push(`Current pH: ${s.ph} | Target pH: ${targetPH}`);
      lines.push('');
      if (s.bufferPH != null) {
        // Use buffer pH to estimate lime rate
        const limeRate = Math.max(0, (targetPH - s.bufferPH) * 3.3);
        lines.push(`Based on buffer pH of ${s.bufferPH}:`);
        lines.push(`- **Estimated lime rate: ${limeRate.toFixed(1)} tons/acre** of ENM 60 ag lime`);
        lines.push('- Adjust rate based on lime quality (ENM rating)');
      } else {
        lines.push('Buffer pH not available - estimated lime rate:');
        if (s.ph < 5.5) lines.push('- **2.5-3.5 tons/acre** ag lime');
        else if (s.ph < 6.0) lines.push('- **1.5-2.5 tons/acre** ag lime');
        else lines.push('- **1.0-1.5 tons/acre** ag lime');
      }

      lines.push('');
      if (s.magnesium != null && s.mgSat != null && s.mgSat < 12) {
        lines.push('**Lime Type:** Use dolomitic lime - Mg saturation at ' + s.mgSat + '% is below the 12% ideal.');
      } else {
        lines.push('**Lime Type:** Calcitic (hi-cal) lime is appropriate. Mg levels are adequate.');
      }
      lines.push('');
      lines.push('**Application:** Fall application preferred. Incorporate if possible. Allow 6-12 months for full reaction. Re-test pH after 12 months.');
    }

  } else if (wantsCompare) {
    lines.push('### Comparison to Ideal Levels for ' + (crop || 'General Cropping'));
    lines.push(`**Field:** ${fieldName}`);
    lines.push('');

    const checks = [
      { key: 'ph', name: 'pH', low: 6.0, high: 7.5 },
      { key: 'organicMatter', name: 'Organic Matter', low: 1.5, high: 3.0, unit: '%' },
      { key: 'NO3lbs', name: 'Nitrate-N', low: 15, high: 50, unit: 'lb/A' },
      { key: 'olsenP', name: 'Olsen P', low: 15, high: 30, unit: 'ppm' },
      { key: 'potassium', name: 'Potassium', low: 250, high: 600, unit: 'ppm' },
      { key: 'sulfur', name: 'Sulfur', low: 5, high: 20, unit: 'ppm' },
      { key: 'zinc', name: 'Zinc', low: 0.5, high: 2.0, unit: 'ppm' },
      { key: 'calcium', name: 'Calcium', low: 1000, high: 2500, unit: 'ppm' },
      { key: 'cec', name: 'CEC', low: 10, high: 25, unit: 'me/100g' }
    ];

    checks.forEach(c => {
      const val = s[c.key];
      if (val != null) {
        let status, note;
        if (val < c.low) { status = 'BELOW IDEAL'; note = 'Needs attention'; }
        else if (val > c.high) { status = 'ABOVE IDEAL'; note = 'Monitor'; }
        else { status = 'IN RANGE'; note = 'Good'; }
        lines.push(`- **${c.name}:** ${val}${c.unit || ''} | Ideal: ${c.low}-${c.high}${c.unit || ''} | **${status}** (${note})`);
      }
    });

  } else {
    // General recommendation based on soil data
    lines.push('### Soil Analysis Summary');
    lines.push(`**Field:** ${fieldName} | **Crop:** ${crop} | **Acres:** ${acres}`);
    lines.push('');

    if (!s || Object.keys(s).length === 0) {
      lines.push('No soil test data available for this field. Submit a soil sample to get specific recommendations.');
    } else {
      // Give overview
      lines.push('**Key Metrics:**');
      if (s.ph != null) lines.push(`- pH: ${s.ph} (${s.ph < 6.0 ? 'Acidic - may need lime' : s.ph > 7.5 ? 'Alkaline' : 'Good range'})`);
      if (s.organicMatter != null) lines.push(`- O.M.: ${s.organicMatter}% (${s.organicMatter < 1.5 ? 'Low' : 'Adequate'})`);
      if (s.NO3lbs != null) lines.push(`- Residual N: ${s.NO3lbs} lb/A (${s.NO3lbs < 15 ? 'Supplemental N needed' : 'Good base'})`);
      if (s.olsenP != null) lines.push(`- Phosphorus: ${s.olsenP} ppm (${s.olsenP < 15 ? 'Low - apply P' : 'Adequate'})`);
      if (s.potassium != null) lines.push(`- Potassium: ${s.potassium} ppm (${s.potassium < 250 ? 'Below optimal' : 'Adequate'})`);

      lines.push('');
      lines.push('**For more specific advice, try asking:**');
      lines.push('- "What corn starter fertilizer do you recommend?"');
      lines.push('- "What is the full fertilizer program for this field?"');
      lines.push('- "What are the biggest soil health concerns?"');
      lines.push('- "What micronutrient applications should I consider?"');
      lines.push('- "What lime recommendation would you give?"');
    }
  }

  return lines.join('\n');
}

module.exports = router;
