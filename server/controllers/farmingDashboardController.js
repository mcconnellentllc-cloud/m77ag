const Field = require('../models/field');
const Farm = require('../models/farm');
const HarvestData = require('../models/harvestData');
const CropInsurance = require('../models/cropInsurance');
const CropInventory = require('../models/cropInventory');
const Transaction = require('../models/transaction');
const Ledger = require('../models/ledger');

// Get comprehensive farming dashboard data
exports.getDashboardSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get all farms
    const farms = await Farm.find({ active: true }).lean();

    // Get all active fields with their data
    const fields = await Field.find({ active: true })
      .populate('farm', 'farmName farmCode')
      .lean();

    // Calculate stats
    const totalAcres = fields.reduce((sum, f) => sum + (f.acres || 0), 0);
    const totalFields = fields.length;

    // Get unique counties
    const counties = [...new Set(fields.map(f => f.location?.county).filter(Boolean))];

    // Group fields by farm
    const farmSummary = {};
    fields.forEach(field => {
      const farmCode = field.farm?.farmCode || 'UNKNOWN';
      if (!farmSummary[farmCode]) {
        farmSummary[farmCode] = {
          farmName: field.farm?.farmName || farmCode,
          farmCode: farmCode,
          totalAcres: 0,
          fieldCount: 0,
          counties: new Set(),
          crops: {},
          leaseTypes: {}
        };
      }
      farmSummary[farmCode].totalAcres += field.acres || 0;
      farmSummary[farmCode].fieldCount++;
      if (field.location?.county) {
        farmSummary[farmCode].counties.add(field.location.county);
      }

      // Track current crops
      if (field.currentCrop?.cropType) {
        const crop = field.currentCrop.cropType;
        farmSummary[farmCode].crops[crop] = (farmSummary[farmCode].crops[crop] || 0) + (field.acres || 0);
      }

      // Track lease types
      if (field.leaseTerms?.leaseType) {
        const leaseType = field.leaseTerms.leaseType;
        farmSummary[farmCode].leaseTypes[leaseType] = (farmSummary[farmCode].leaseTypes[leaseType] || 0) + 1;
      }
    });

    // Convert Sets to arrays
    Object.values(farmSummary).forEach(farm => {
      farm.counties = Array.from(farm.counties);
    });

    // Calculate growing crops summary
    const growingCrops = {};
    fields.forEach(field => {
      if (field.currentCrop?.cropType && field.currentCrop?.year === year) {
        const crop = field.currentCrop.cropType;
        growingCrops[crop] = (growingCrops[crop] || 0) + (field.acres || 0);
      }
    });

    // Calculate rotation data (years of crop plans)
    const rotationData = [];
    const rotationYears = [year - 1, year, year + 1, year + 2];
    fields.slice(0, 10).forEach(field => {
      const rotation = {
        fieldName: field.fieldName,
        fieldNumber: field.fieldNumber,
        farm: field.farm?.farmCode,
        years: {}
      };

      rotationYears.forEach(y => {
        // Check crop history for past years
        const historyEntry = field.cropHistory?.find(h => h.year === y);
        if (historyEntry) {
          rotation.years[y] = historyEntry.cropType;
        }

        // Check current crop
        if (field.currentCrop?.year === y) {
          rotation.years[y] = field.currentCrop.cropType;
        }

        // Check crop plan for future years
        const planEntry = field.cropPlan?.find(p => p.year === y);
        if (planEntry) {
          rotation.years[y] = planEntry.cropType;
        }
      });

      rotationData.push(rotation);
    });

    res.json({
      success: true,
      year,
      stats: {
        totalAcres: Math.round(totalAcres),
        totalFields,
        farmCount: farms.length,
        countyCount: counties.length,
        counties
      },
      growingCrops,
      farmSummary: Object.values(farmSummary),
      rotationPreview: rotationData,
      rotationYears
    });
  } catch (error) {
    console.error('Error getting farming dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get farming dashboard data',
      error: error.message
    });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get crop inventory data
    const inventories = await CropInventory.find({
      year: year,
      status: 'active'
    }).lean();

    const summary = {
      totalBushels: 0,
      contracted: 0,
      available: 0,
      byCrop: {},
      byLocation: {}
    };

    inventories.forEach(inv => {
      summary.totalBushels += inv.currentQuantity || 0;
      summary.contracted += inv.reservedQuantity || 0;

      // By crop
      if (!summary.byCrop[inv.cropType]) {
        summary.byCrop[inv.cropType] = {
          onFarm: 0,
          elevator: 0,
          total: 0
        };
      }
      summary.byCrop[inv.cropType].total += inv.currentQuantity || 0;

      if (inv.storageLocation === 'on-farm-bin' || inv.storageLocation === 'on-farm-pile') {
        summary.byCrop[inv.cropType].onFarm += inv.currentQuantity || 0;
      } else {
        summary.byCrop[inv.cropType].elevator += inv.currentQuantity || 0;
      }

      // By location
      if (!summary.byLocation[inv.storageLocation]) {
        summary.byLocation[inv.storageLocation] = 0;
      }
      summary.byLocation[inv.storageLocation] += inv.currentQuantity || 0;
    });

    summary.available = summary.totalBushels - summary.contracted;

    res.json({
      success: true,
      year,
      summary
    });
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory summary',
      error: error.message
    });
  }
};

// Get insurance summary
exports.getInsuranceSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get insurance policies
    const policies = await CropInsurance.find({
      policyYear: year
    }).lean();

    const summary = {
      totalPolicies: policies.length,
      totalAcresCovered: 0,
      totalPremium: 0,
      producerPremium: 0,
      landlordShare: 0,
      m77Share: 0,
      byCrop: {},
      pendingClaims: 0,
      paidClaims: 0
    };

    policies.forEach(policy => {
      summary.totalAcresCovered += policy.totalAcresCovered || 0;
      summary.totalPremium += policy.totalPremium || 0;
      summary.producerPremium += policy.producerPremium || 0;

      // Count claims
      policy.claims?.forEach(claim => {
        if (claim.status === 'pending' || claim.status === 'under-review') {
          summary.pendingClaims++;
        } else if (claim.status === 'paid') {
          summary.paidClaims++;
        }
      });

      // By crop
      policy.coveredFields?.forEach(cf => {
        if (!summary.byCrop[cf.cropType]) {
          summary.byCrop[cf.cropType] = {
            acres: 0,
            premium: 0
          };
        }
        summary.byCrop[cf.cropType].acres += cf.acres || 0;
      });
    });

    // Standard split: 65% M77 / 35% Landlord
    summary.m77Share = Math.round(summary.producerPremium * 0.65);
    summary.landlordShare = Math.round(summary.producerPremium * 0.35);

    res.json({
      success: true,
      year,
      summary
    });
  } catch (error) {
    console.error('Error getting insurance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insurance summary',
      error: error.message
    });
  }
};

// Get projected costs and revenue
exports.getProjections = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get fields with financial projections
    const fields = await Field.find({
      active: true,
      'currentCrop.year': year
    }).lean();

    // Get transactions for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Calculate projections
    let projectedRevenue = 0;
    let operatingCosts = 0;
    let landRent = 0;
    let insuranceCosts = 0;

    // Sum up field financials
    fields.forEach(field => {
      if (field.financials) {
        projectedRevenue += field.financials.projectedRevenue || 0;
        operatingCosts += field.financials.totalExpenses || 0;
      }
      if (field.leaseTerms) {
        landRent += field.leaseTerms.totalRent || 0;
      }
    });

    // Sum up transactions by category
    transactions.forEach(tx => {
      if (tx.type === 'income') {
        projectedRevenue += tx.amount || 0;
      } else {
        if (tx.category === 'insurance') {
          insuranceCosts += tx.amount || 0;
        } else if (tx.category === 'rent' || tx.category === 'land_rent') {
          landRent += tx.amount || 0;
        } else {
          operatingCosts += tx.amount || 0;
        }
      }
    });

    const projectedNet = projectedRevenue - operatingCosts - landRent - insuranceCosts;

    res.json({
      success: true,
      year,
      projections: {
        projectedRevenue: Math.round(projectedRevenue),
        operatingCosts: Math.round(operatingCosts),
        landRent: Math.round(landRent),
        insuranceCosts: Math.round(insuranceCosts),
        projectedNet: Math.round(projectedNet)
      }
    });
  } catch (error) {
    console.error('Error getting projections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projections',
      error: error.message
    });
  }
};

// Get planting plan
exports.getPlantingPlan = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get fields with crop plans for the year
    const fields = await Field.find({
      active: true,
      $or: [
        { 'currentCrop.year': year },
        { 'cropPlan.year': year }
      ]
    })
      .populate('farm', 'farmName farmCode')
      .lean();

    const plantingPlan = [];

    fields.forEach(field => {
      let cropData = null;

      // Check current crop first
      if (field.currentCrop?.year === year) {
        cropData = field.currentCrop;
      }

      // Check crop plan
      const planEntry = field.cropPlan?.find(p => p.year === year);
      if (planEntry) {
        cropData = planEntry;
      }

      if (cropData) {
        plantingPlan.push({
          fieldId: field._id,
          fieldName: field.fieldName,
          fieldNumber: field.fieldNumber,
          farm: field.farm?.farmCode,
          acres: field.acres,
          cropType: cropData.cropType,
          variety: cropData.variety,
          plantingDate: cropData.plantingDate,
          expectedHarvestDate: cropData.expectedHarvestDate,
          estimatedYield: cropData.estimatedYield || cropData.expectedYield,
          notes: cropData.notes
        });
      }
    });

    // Sort by farm and field name
    plantingPlan.sort((a, b) => {
      if (a.farm !== b.farm) return (a.farm || '').localeCompare(b.farm || '');
      return (a.fieldName || '').localeCompare(b.fieldName || '');
    });

    // Summary by crop
    const cropSummary = {};
    plantingPlan.forEach(p => {
      if (!cropSummary[p.cropType]) {
        cropSummary[p.cropType] = {
          acres: 0,
          fieldCount: 0
        };
      }
      cropSummary[p.cropType].acres += p.acres || 0;
      cropSummary[p.cropType].fieldCount++;
    });

    res.json({
      success: true,
      year,
      plantingPlan,
      cropSummary,
      totalPlannedAcres: plantingPlan.reduce((sum, p) => sum + (p.acres || 0), 0),
      totalPlannedFields: plantingPlan.length
    });
  } catch (error) {
    console.error('Error getting planting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get planting plan',
      error: error.message
    });
  }
};

// Get crop rotation data
exports.getRotations = async (req, res) => {
  try {
    const startYear = parseInt(req.query.startYear) || new Date().getFullYear() - 3;
    const endYear = parseInt(req.query.endYear) || new Date().getFullYear() + 4;
    const farmCode = req.query.farm;

    let query = { active: true };
    if (farmCode) {
      const farm = await Farm.findOne({ farmCode: farmCode.toUpperCase() });
      if (farm) {
        query.farm = farm._id;
      }
    }

    const fields = await Field.find(query)
      .populate('farm', 'farmName farmCode')
      .sort({ 'farm.farmCode': 1, fieldName: 1 })
      .lean();

    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }

    const rotations = fields.map(field => {
      const rotation = {
        fieldId: field._id,
        fieldName: field.fieldName,
        fieldNumber: field.fieldNumber,
        farm: field.farm?.farmCode,
        acres: field.acres,
        soilType: field.soilType,
        county: field.location?.county,
        crops: {}
      };

      years.forEach(year => {
        // Check history
        const historyEntry = field.cropHistory?.find(h => h.year === year);
        if (historyEntry) {
          rotation.crops[year] = {
            type: historyEntry.cropType,
            yield: historyEntry.yield,
            source: 'history'
          };
          return;
        }

        // Check current
        if (field.currentCrop?.year === year) {
          rotation.crops[year] = {
            type: field.currentCrop.cropType,
            yield: field.currentCrop.actualYield || field.currentCrop.estimatedYield,
            source: 'current'
          };
          return;
        }

        // Check plan
        const planEntry = field.cropPlan?.find(p => p.year === year);
        if (planEntry) {
          rotation.crops[year] = {
            type: planEntry.cropType,
            source: 'plan'
          };
          return;
        }

        rotation.crops[year] = null;
      });

      return rotation;
    });

    res.json({
      success: true,
      years,
      rotations,
      fieldCount: rotations.length
    });
  } catch (error) {
    console.error('Error getting rotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rotation data',
      error: error.message
    });
  }
};

// Get sliding scale status
exports.getSlidingScaleStatus = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const inventories = await CropInventory.find({
      year: year,
      status: 'active',
      'slidingScale.enabled': true
    }).lean();

    const slidingScales = inventories.map(inv => ({
      inventoryId: inv._id,
      cropType: inv.cropType,
      currentQuantity: inv.currentQuantity,
      storageLocation: inv.storageLocation,
      minimumPrice: inv.slidingScale.minimumPrice,
      targetPrice: inv.slidingScale.targetPrice,
      maximumHold: inv.slidingScale.maximumHold,
      tiers: inv.slidingScale.tiers?.map(tier => ({
        pricePerBushel: tier.pricePerBushel,
        percentToSell: tier.percentToSell,
        bushelsToSell: tier.bushelsToSell,
        triggerType: tier.triggerType,
        executed: tier.executed,
        executedDate: tier.executedDate,
        executedPrice: tier.executedPrice
      })) || [],
      autoSellEnabled: inv.slidingScale.autoSellEnabled
    }));

    // Group by crop
    const byCrop = {};
    slidingScales.forEach(ss => {
      if (!byCrop[ss.cropType]) {
        byCrop[ss.cropType] = [];
      }
      byCrop[ss.cropType].push(ss);
    });

    res.json({
      success: true,
      year,
      slidingScales,
      byCrop,
      totalActiveScales: slidingScales.length
    });
  } catch (error) {
    console.error('Error getting sliding scale status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sliding scale status',
      error: error.message
    });
  }
};

// Get alerts and notifications
exports.getAlerts = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const alerts = [];

    // Check for upcoming insurance deadlines
    const upcomingPolicies = await CropInsurance.find({
      status: 'active',
      $or: [
        { premiumDueDate: { $lte: thirtyDaysOut, $gte: today } },
        { salesClosingDate: { $lte: thirtyDaysOut, $gte: today } },
        { acreageReportingDate: { $lte: thirtyDaysOut, $gte: today } }
      ]
    }).lean();

    upcomingPolicies.forEach(policy => {
      if (policy.premiumDueDate && policy.premiumDueDate <= thirtyDaysOut) {
        alerts.push({
          type: 'warning',
          title: 'Insurance Premium Due',
          message: `${policy.policyType} premium of $${policy.producerPremium?.toLocaleString()} due by ${new Date(policy.premiumDueDate).toLocaleDateString()}`,
          date: policy.premiumDueDate,
          category: 'insurance'
        });
      }
    });

    // Check for executed sliding scale tiers
    const recentExecutions = await CropInventory.find({
      'slidingScale.tiers.executed': true,
      'slidingScale.tiers.executedDate': { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();

    recentExecutions.forEach(inv => {
      inv.slidingScale?.tiers?.forEach(tier => {
        if (tier.executed && tier.executedDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
          alerts.push({
            type: 'success',
            title: 'Sliding Scale Triggered',
            message: `${inv.cropType} sold ${tier.executedBushels?.toLocaleString()} bu at $${tier.executedPrice}/bu`,
            date: tier.executedDate,
            category: 'inventory'
          });
        }
      });
    });

    // Check for pending claims
    const policiesWithClaims = await CropInsurance.find({
      'claims.status': { $in: ['pending', 'under-review'] }
    }).lean();

    policiesWithClaims.forEach(policy => {
      policy.claims?.forEach(claim => {
        if (claim.status === 'pending' || claim.status === 'under-review') {
          alerts.push({
            type: 'info',
            title: 'Pending Insurance Claim',
            message: `${claim.claimType} claim #${claim.claimNumber} - ${claim.status}`,
            date: claim.claimDate,
            category: 'insurance'
          });
        }
      });
    });

    // Sort by date, most recent first
    alerts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      alerts: alerts.slice(0, 20), // Limit to 20 most recent
      totalAlerts: alerts.length
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
};
