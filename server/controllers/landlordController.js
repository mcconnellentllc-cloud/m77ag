const User = require('../models/user');
const CroppingField = require('../models/croppingField');
const CapitalInvestment = require('../models/capitalInvestment');

// Helper: get landlord's farms array from user
async function getLandlordFarms(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return [];
  return user.landlordFarms || [];
}

// =============================================
// GET /api/landlord/preferences
// =============================================
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      preferences: user.landlordPreferences || {}
    });
  } catch (error) {
    console.error('Error getting landlord preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
};

// =============================================
// PUT /api/landlord/preferences
// =============================================
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Merge existing preferences with new ones
    const existing = user.landlordPreferences ? user.landlordPreferences.toObject() : {};
    const updates = req.body;

    // Handle nested grainSalePrice merge
    if (updates.grainSalePrice) {
      existing.grainSalePrice = { ...(existing.grainSalePrice || {}), ...updates.grainSalePrice };
      delete updates.grainSalePrice;
    }

    user.landlordPreferences = { ...existing, ...updates };
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: user.landlordPreferences
    });
  } catch (error) {
    console.error('Error updating landlord preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};

// =============================================
// GET /api/landlord/fields
// Returns all CroppingFields for this landlord's farms
// with real costs, splits, soil, taxes, rotation
// =============================================
exports.getFields = async (req, res) => {
  try {
    const farms = await getLandlordFarms(req.userId);
    if (farms.length === 0) {
      return res.json({ success: true, fields: [], farms: [] });
    }

    const fields = await CroppingField.find({ farm: { $in: farms } })
      .sort({ farm: 1, field: 1 })
      .lean({ virtuals: true });

    // Group fields by farm
    const byFarm = {};
    let totalAcres = 0;
    let totalCropAcres = 0;

    for (const f of fields) {
      if (!byFarm[f.farm]) {
        byFarm[f.farm] = { farm: f.farm, fields: [], totalAcres: 0, cropAcres: 0 };
      }
      byFarm[f.farm].fields.push(f);
      const ac = f.acres || 0;
      byFarm[f.farm].totalAcres += ac;
      totalAcres += ac;
      const crop = (f.crop2026 || '').toUpperCase();
      if (!['PASTURE', 'WASTE', 'BUILDING SITE', 'FALLOW'].includes(crop)) {
        byFarm[f.farm].cropAcres += ac;
        totalCropAcres += ac;
      }
    }

    res.json({
      success: true,
      farms: Object.values(byFarm),
      totalAcres,
      totalCropAcres,
      totalFields: fields.length
    });
  } catch (error) {
    console.error('Error getting landlord fields:', error);
    res.status(500).json({ success: false, message: 'Failed to get fields' });
  }
};

// =============================================
// GET /api/landlord/summary
// Dashboard summary stats from real CroppingField data
// =============================================
exports.getSummary = async (req, res) => {
  try {
    const farms = await getLandlordFarms(req.userId);
    if (farms.length === 0) {
      return res.json({
        success: true,
        summary: { totalAcres: 0, totalFields: 0, cropAcres: 0, farms: 0, cropMix: {}, countyBreakdown: {} }
      });
    }

    const fields = await CroppingField.find({ farm: { $in: farms } }).lean({ virtuals: true });

    let totalAcres = 0;
    let cropAcres = 0;
    const cropMix = {};
    const countyBreakdown = {};
    let totalPropertyTax = 0;

    for (const f of fields) {
      const ac = f.acres || 0;
      totalAcres += ac;

      const crop = (f.crop2026 || 'UNASSIGNED').toUpperCase();
      cropMix[crop] = (cropMix[crop] || 0) + ac;

      if (!['PASTURE', 'WASTE', 'BUILDING SITE', 'FALLOW'].includes(crop)) {
        cropAcres += ac;
      }

      if (f.county) {
        if (!countyBreakdown[f.county]) countyBreakdown[f.county] = { acres: 0, fields: 0 };
        countyBreakdown[f.county].acres += ac;
        countyBreakdown[f.county].fields += 1;
      }

      if (f.taxes && f.taxes.propertyTaxPerAcre) {
        totalPropertyTax += f.taxes.propertyTaxPerAcre * ac;
      }
    }

    res.json({
      success: true,
      summary: {
        totalAcres: +totalAcres.toFixed(2),
        totalFields: fields.length,
        cropAcres: +cropAcres.toFixed(2),
        farms: farms.length,
        cropMix,
        countyBreakdown,
        totalPropertyTax: +totalPropertyTax.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error getting landlord summary:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};

// =============================================
// GET /api/landlord/financial-summary
// Running bill: costs, revenue, net for landlord's fields
// =============================================
exports.getFinancialSummary = async (req, res) => {
  try {
    const farms = await getLandlordFarms(req.userId);
    if (farms.length === 0) {
      return res.json({
        success: true,
        summary: { totalAcres: 0, totalFields: 0, rentOwed: 0, expensesOwed: 0, incomeOwed: 0, ytdIncome: 0 }
      });
    }

    const fields = await CroppingField.find({ farm: { $in: farms } }).lean({ virtuals: true });

    let totalAcres = 0;
    let totalCosts = 0;
    let totalRevenue = 0;
    let totalPropertyTax = 0;

    for (const f of fields) {
      const ac = f.acres || 0;
      totalAcres += ac;

      // Sum costs from the costs object
      if (f.costs) {
        const c = f.costs;
        const costPerAcre = (c.seed || 0) + (c.fertilizer || 0) + (c.chemicals || 0) +
          (c.cropInsurance || 0) + (c.fuelOil || 0) + (c.repairs || 0) +
          (c.customHire || 0) + (c.landRent || 0) + (c.dryingHauling || 0) + (c.misc || 0);
        totalCosts += costPerAcre * ac;
      }

      // Revenue
      const revPerAcre = ((f.projectedYield || 0) * (f.projectedPrice || 0)) + (f.governmentPayment || 0);
      totalRevenue += revPerAcre * ac;

      // Tax
      if (f.taxes && f.taxes.propertyTaxPerAcre) {
        totalPropertyTax += f.taxes.propertyTaxPerAcre * ac;
      }
    }

    res.json({
      success: true,
      summary: {
        totalAcres: +totalAcres.toFixed(2),
        totalFields: fields.length,
        totalCosts: +totalCosts.toFixed(2),
        totalRevenue: +totalRevenue.toFixed(2),
        netIncome: +(totalRevenue - totalCosts).toFixed(2),
        totalPropertyTax: +totalPropertyTax.toFixed(2),
        rentOwed: 0,
        expensesOwed: +totalCosts.toFixed(2),
        incomeOwed: +totalRevenue.toFixed(2),
        ytdIncome: 0
      }
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({ success: false, message: 'Failed to get financial summary' });
  }
};

// =============================================
// GET /api/landlord/properties (legacy - redirects to fields)
// =============================================
exports.getProperties = async (req, res) => {
  return exports.getFields(req, res);
};

// =============================================
// GET /api/landlord/transactions
// =============================================
exports.getTransactions = async (req, res) => {
  try {
    // Transactions will be built out as grain sales / expense entries happen
    res.json({ success: true, transactions: [] });
  } catch (error) {
    console.error('Error getting landlord transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to get transactions' });
  }
};

// =============================================
// ACH setup / disconnect (Stripe - placeholder)
// =============================================
exports.setupACH = async (req, res) => {
  res.json({ success: false, message: 'ACH integration not yet configured' });
};

exports.disconnectACH = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.landlordPreferences.stripeBankAccountId = null;
    await user.save();

    res.json({ success: true, message: 'Bank account disconnected' });
  } catch (error) {
    console.error('Error disconnecting ACH:', error);
    res.status(500).json({ success: false, message: 'Failed to disconnect ACH' });
  }
};
