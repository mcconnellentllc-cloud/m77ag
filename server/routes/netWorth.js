const express = require('express');
const router = express.Router();
const Equipment = require('../models/equipment');
const RealEstate = require('../models/realEstate');
const Entity = require('../models/entity');
const CroppingField = require('../models/croppingField');
const CapitalInvestment = require('../models/capitalInvestment');

// Define entities for net worth tracking
const ENTITIES = ['M77 AG', 'McConnell Enterprises', 'Kyle & Brandi McConnell'];

// Aggregate KB Farms land value from CroppingField market values + CapitalInvestment loans
async function getKBFarmsLandSummary() {
  // Get all KBFARMS owned fields with market value set
  const kbFields = await CroppingField.find({ farm: 'KBFARMS' });

  let totalAcres = 0;
  let totalMarketValue = 0;
  kbFields.forEach(f => {
    const acres = f.acres || 0;
    const mvpa = f.marketValuePerAcre || 0;
    totalAcres += acres;
    totalMarketValue += mvpa * acres;
  });

  // Get KB Farms loan balances from CapitalInvestment
  const kbCapital = await CapitalInvestment.find({ 'location.associatedFarm': 'KB Farms', type: 'land' });
  let totalOwed = 0;
  let annualPayments = 0;
  kbCapital.forEach(cap => {
    (cap.loans || []).forEach(loan => {
      totalOwed += loan.currentBalance || 0;
      annualPayments += loan.paymentAmount || 0;
    });
  });

  return {
    count: kbCapital.length,
    acres: totalAcres,
    value: totalMarketValue,
    owed: totalOwed,
    annualPayments
  };
}

// Get complete net worth summary for all entities
router.get('/summary', async (req, res) => {
  try {
    // Fetch all equipment and real estate
    const allEquipment = await Equipment.find();
    const allRealEstate = await RealEstate.find();
    const entities = await Entity.find();
    const kbFarmsLand = await getKBFarmsLandSummary();

    // Build entity summaries
    const entitySummaries = {};

    // Initialize all entities
    ENTITIES.forEach(entityName => {
      entitySummaries[entityName] = {
        name: entityName,
        equipment: { count: 0, value: 0, owed: 0 },
        realEstate: { count: 0, value: 0, owed: 0, acres: 0, annualTaxes: 0 },
        farmland: { count: 0, value: 0, owed: 0, acres: 0 },
        additionalAssets: { count: 0, value: 0 },
        additionalLiabilities: { count: 0, amount: 0 },
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0
      };
    });

    // Process equipment
    allEquipment.forEach(item => {
      const entityName = item.ownerEntity || 'M77 AG';
      if (entitySummaries[entityName]) {
        entitySummaries[entityName].equipment.count++;
        entitySummaries[entityName].equipment.value += item.currentValue || 0;
        entitySummaries[entityName].equipment.owed += item.amountOwed || 0;
      }
    });

    // Process real estate
    allRealEstate.forEach(prop => {
      const entityName = prop.ownerEntity || 'M77 AG';
      if (entitySummaries[entityName]) {
        entitySummaries[entityName].realEstate.count++;
        entitySummaries[entityName].realEstate.value += prop.currentValue || 0;
        entitySummaries[entityName].realEstate.owed += prop.amountOwed || 0;
        entitySummaries[entityName].realEstate.acres += prop.acres || 0;
        entitySummaries[entityName].realEstate.annualTaxes += prop.annualTaxes || 0;
      }
    });

    // Inject KB Farms land (CroppingField market values + CapitalInvestment loans)
    // into Kyle & Brandi McConnell entity as farmland
    const kbEntity = 'Kyle & Brandi McConnell';
    if (entitySummaries[kbEntity]) {
      entitySummaries[kbEntity].farmland = {
        count: kbFarmsLand.count,
        value: kbFarmsLand.value,
        owed: kbFarmsLand.owed,
        acres: kbFarmsLand.acres
      };
    }

    // Process additional assets/liabilities from entities collection
    entities.forEach(entity => {
      if (entitySummaries[entity.name]) {
        // Additional assets
        if (entity.additionalAssets && entity.additionalAssets.length > 0) {
          entity.additionalAssets.forEach(asset => {
            entitySummaries[entity.name].additionalAssets.count++;
            entitySummaries[entity.name].additionalAssets.value += asset.value || 0;
          });
        }
        // Additional liabilities
        if (entity.additionalLiabilities && entity.additionalLiabilities.length > 0) {
          entity.additionalLiabilities.forEach(liability => {
            entitySummaries[entity.name].additionalLiabilities.count++;
            entitySummaries[entity.name].additionalLiabilities.amount += liability.amount || 0;
          });
        }
      }
    });

    // Calculate totals for each entity (including farmland)
    Object.keys(entitySummaries).forEach(name => {
      const entity = entitySummaries[name];
      const farmlandValue = entity.farmland ? entity.farmland.value : 0;
      const farmlandOwed = entity.farmland ? entity.farmland.owed : 0;
      entity.totalAssets = entity.equipment.value + entity.realEstate.value + farmlandValue + entity.additionalAssets.value;
      entity.totalLiabilities = entity.equipment.owed + entity.realEstate.owed + farmlandOwed + entity.additionalLiabilities.amount;
      entity.netWorth = entity.totalAssets - entity.totalLiabilities;
    });

    // Calculate grand totals
    const grandTotal = {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      equipment: { count: 0, value: 0, owed: 0 },
      realEstate: { count: 0, value: 0, owed: 0, acres: 0, annualTaxes: 0 }
    };

    Object.values(entitySummaries).forEach(entity => {
      grandTotal.totalAssets += entity.totalAssets;
      grandTotal.totalLiabilities += entity.totalLiabilities;
      grandTotal.netWorth += entity.netWorth;
      grandTotal.equipment.count += entity.equipment.count;
      grandTotal.equipment.value += entity.equipment.value;
      grandTotal.equipment.owed += entity.equipment.owed;
      grandTotal.realEstate.count += entity.realEstate.count;
      grandTotal.realEstate.value += entity.realEstate.value + (entity.farmland ? entity.farmland.value : 0);
      grandTotal.realEstate.owed += entity.realEstate.owed + (entity.farmland ? entity.farmland.owed : 0);
      grandTotal.realEstate.acres += entity.realEstate.acres + (entity.farmland ? entity.farmland.acres : 0);
      grandTotal.realEstate.annualTaxes += entity.realEstate.annualTaxes;
    });

    res.json({
      entities: entitySummaries,
      grandTotal,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching net worth summary:', error);
    res.status(500).json({ message: 'Error fetching net worth summary', error: error.message });
  }
});

// Get detailed breakdown for a specific entity
router.get('/entity/:name', async (req, res) => {
  try {
    const entityName = decodeURIComponent(req.params.name);

    // Fetch equipment for this entity
    const equipment = await Equipment.find({ ownerEntity: entityName });

    // Fetch real estate for this entity
    const realEstate = await RealEstate.find({ ownerEntity: entityName });

    // Fetch entity record for additional assets/liabilities
    const entity = await Entity.findOne({ name: entityName });

    // Calculate equipment totals
    let equipmentValue = 0;
    let equipmentOwed = 0;
    equipment.forEach(item => {
      equipmentValue += item.currentValue || 0;
      equipmentOwed += item.amountOwed || 0;
    });

    // Calculate real estate totals
    let realEstateValue = 0;
    let realEstateOwed = 0;
    let totalAcres = 0;
    let annualTaxes = 0;
    realEstate.forEach(prop => {
      realEstateValue += prop.currentValue || 0;
      realEstateOwed += prop.amountOwed || 0;
      totalAcres += prop.acres || 0;
      annualTaxes += prop.annualTaxes || 0;
    });

    // Include KB Farms farmland for Kyle & Brandi McConnell
    let farmland = { count: 0, value: 0, owed: 0, acres: 0 };
    if (entityName === 'Kyle & Brandi McConnell') {
      farmland = await getKBFarmsLandSummary();
      realEstateValue += farmland.value;
      realEstateOwed += farmland.owed;
      totalAcres += farmland.acres;
    }

    // Get additional assets/liabilities
    let additionalAssetsValue = 0;
    let additionalLiabilitiesAmount = 0;

    if (entity) {
      if (entity.additionalAssets) {
        entity.additionalAssets.forEach(a => additionalAssetsValue += a.value || 0);
      }
      if (entity.additionalLiabilities) {
        entity.additionalLiabilities.forEach(l => additionalLiabilitiesAmount += l.amount || 0);
      }
    }

    const totalAssets = equipmentValue + realEstateValue + additionalAssetsValue;
    const totalLiabilities = equipmentOwed + realEstateOwed + additionalLiabilitiesAmount;

    res.json({
      name: entityName,
      equipment: {
        items: equipment,
        count: equipment.length,
        totalValue: equipmentValue,
        totalOwed: equipmentOwed,
        equity: equipmentValue - equipmentOwed
      },
      realEstate: {
        properties: realEstate,
        count: realEstate.length,
        totalValue: realEstateValue,
        totalOwed: realEstateOwed,
        equity: realEstateValue - realEstateOwed,
        totalAcres,
        annualTaxes
      },
      additionalAssets: entity?.additionalAssets || [],
      additionalLiabilities: entity?.additionalLiabilities || [],
      summary: {
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities
      }
    });
  } catch (error) {
    console.error('Error fetching entity details:', error);
    res.status(500).json({ message: 'Error fetching entity details', error: error.message });
  }
});

// Create or update entity with additional assets/liabilities
router.post('/entity', async (req, res) => {
  try {
    const { name, type, description, additionalAssets, additionalLiabilities, color } = req.body;

    let entity = await Entity.findOne({ name });

    if (entity) {
      // Update existing
      entity.type = type || entity.type;
      entity.description = description || entity.description;
      entity.additionalAssets = additionalAssets || entity.additionalAssets;
      entity.additionalLiabilities = additionalLiabilities || entity.additionalLiabilities;
      entity.color = color || entity.color;
    } else {
      // Create new
      entity = new Entity({
        name,
        type: type || 'business',
        description,
        additionalAssets: additionalAssets || [],
        additionalLiabilities: additionalLiabilities || [],
        color
      });
    }

    await entity.save();
    res.json(entity);
  } catch (error) {
    console.error('Error saving entity:', error);
    res.status(500).json({ message: 'Error saving entity', error: error.message });
  }
});

// Add additional asset to entity
router.post('/entity/:name/asset', async (req, res) => {
  try {
    const entityName = decodeURIComponent(req.params.name);
    let entity = await Entity.findOne({ name: entityName });

    if (!entity) {
      entity = new Entity({ name: entityName });
    }

    entity.additionalAssets.push(req.body);
    await entity.save();

    res.json(entity);
  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({ message: 'Error adding asset', error: error.message });
  }
});

// Add additional liability to entity
router.post('/entity/:name/liability', async (req, res) => {
  try {
    const entityName = decodeURIComponent(req.params.name);
    let entity = await Entity.findOne({ name: entityName });

    if (!entity) {
      entity = new Entity({ name: entityName });
    }

    entity.additionalLiabilities.push(req.body);
    await entity.save();

    res.json(entity);
  } catch (error) {
    console.error('Error adding liability:', error);
    res.status(500).json({ message: 'Error adding liability', error: error.message });
  }
});

// Delete additional asset
router.delete('/entity/:name/asset/:assetId', async (req, res) => {
  try {
    const entityName = decodeURIComponent(req.params.name);
    const entity = await Entity.findOne({ name: entityName });

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    entity.additionalAssets = entity.additionalAssets.filter(
      a => a._id.toString() !== req.params.assetId
    );
    await entity.save();

    res.json(entity);
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Error deleting asset', error: error.message });
  }
});

// Delete additional liability
router.delete('/entity/:name/liability/:liabilityId', async (req, res) => {
  try {
    const entityName = decodeURIComponent(req.params.name);
    const entity = await Entity.findOne({ name: entityName });

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    entity.additionalLiabilities = entity.additionalLiabilities.filter(
      l => l._id.toString() !== req.params.liabilityId
    );
    await entity.save();

    res.json(entity);
  } catch (error) {
    console.error('Error deleting liability:', error);
    res.status(500).json({ message: 'Error deleting liability', error: error.message });
  }
});

// Get upcoming payments across all entities
router.get('/payments', async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Get equipment with upcoming payments
    const equipmentPayments = await Equipment.find({
      hasLoan: true,
      nextPaymentDate: { $lte: sixMonthsFromNow }
    }).select('title ownerEntity paymentAmount nextPaymentDate lender');

    // Get real estate with upcoming payments
    const realEstatePayments = await RealEstate.find({
      hasLoan: true,
      nextPaymentDate: { $lte: sixMonthsFromNow }
    }).select('name ownerEntity paymentAmount nextPaymentDate lender');

    // Combine and sort
    const payments = [
      ...equipmentPayments.map(e => ({
        type: 'Equipment',
        name: e.title,
        entity: e.ownerEntity,
        amount: e.paymentAmount,
        dueDate: e.nextPaymentDate,
        lender: e.lender,
        isOverdue: e.nextPaymentDate < now
      })),
      ...realEstatePayments.map(r => ({
        type: 'Real Estate',
        name: r.name,
        entity: r.ownerEntity,
        amount: r.paymentAmount,
        dueDate: r.nextPaymentDate,
        lender: r.lender,
        isOverdue: r.nextPaymentDate < now
      }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

module.exports = router;
