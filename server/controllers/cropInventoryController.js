const CropInventory = require('../models/cropInventory');
const Field = require('../models/field');

// Get all inventory for a farm
exports.getAllInventory = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { year, cropType, status, storageLocation } = req.query;

    const query = { farm: farmId };
    if (year) query.year = parseInt(year);
    if (cropType) query.cropType = cropType;
    if (status) query.status = status;
    if (storageLocation) query.storageLocation = storageLocation;

    const inventories = await CropInventory.find(query)
      .populate('sourceFields.field', 'fieldName acres')
      .sort({ year: -1, cropType: 1 })
      .lean();

    res.json({
      success: true,
      count: inventories.length,
      inventories
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
};

// Get single inventory by ID
exports.getInventory = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id)
      .populate('sourceFields.field', 'fieldName acres currentCrop')
      .lean();

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
};

// Create new inventory
exports.createInventory = async (req, res) => {
  try {
    const inventoryData = {
      ...req.body,
      createdBy: req.userId
    };

    // Calculate available quantity
    inventoryData.availableQuantity = (inventoryData.currentQuantity || 0) - (inventoryData.reservedQuantity || 0);

    const inventory = new CropInventory(inventoryData);
    await inventory.save();

    res.status(201).json({
      success: true,
      message: 'Inventory created successfully',
      inventory
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory',
      error: error.message
    });
  }
};

// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    Object.assign(inventory, req.body);
    inventory.lastModifiedBy = req.userId;
    await inventory.save();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

// Delete inventory
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await CropInventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory',
      error: error.message
    });
  }
};

// Record a sale
exports.recordSale = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    await inventory.recordSale(req.body);

    res.json({
      success: true,
      message: 'Sale recorded successfully',
      inventory
    });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record sale',
      error: error.message
    });
  }
};

// Record shrinkage
exports.recordShrinkage = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    await inventory.recordShrinkage(req.body);

    res.json({
      success: true,
      message: 'Shrinkage recorded successfully',
      inventory
    });
  } catch (error) {
    console.error('Error recording shrinkage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record shrinkage',
      error: error.message
    });
  }
};

// Add contract
exports.addContract = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    await inventory.addContract(req.body);

    res.json({
      success: true,
      message: 'Contract added successfully',
      inventory
    });
  } catch (error) {
    console.error('Error adding contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contract',
      error: error.message
    });
  }
};

// Configure sliding scale
exports.configureSlidingScale = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    inventory.slidingScale = {
      ...inventory.slidingScale,
      ...req.body,
      enabled: true
    };

    // Calculate bushels to sell for each tier based on percentage
    if (inventory.slidingScale.tiers) {
      inventory.slidingScale.tiers = inventory.slidingScale.tiers.map(tier => ({
        ...tier,
        bushelsToSell: Math.round((tier.percentToSell / 100) * inventory.currentQuantity)
      }));
    }

    await inventory.save();

    res.json({
      success: true,
      message: 'Sliding scale configured successfully',
      inventory
    });
  } catch (error) {
    console.error('Error configuring sliding scale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure sliding scale',
      error: error.message
    });
  }
};

// Execute sliding scale tier
exports.executeSlidingScaleTier = async (req, res) => {
  try {
    const { tierIndex, price, bushels } = req.body;

    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    await inventory.executeSlidingScaleTier(tierIndex, { price, bushels });

    res.json({
      success: true,
      message: 'Sliding scale tier executed successfully',
      inventory
    });
  } catch (error) {
    console.error('Error executing sliding scale tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute sliding scale tier',
      error: error.message
    });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const { farmId } = req.params;
    const year = req.query.year || new Date().getFullYear();

    const summary = await CropInventory.getInventorySummary(farmId, parseInt(year));

    res.json({
      success: true,
      year,
      summary
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory summary',
      error: error.message
    });
  }
};

// Check sliding scale triggers
exports.checkSlidingScaleTriggers = async (req, res) => {
  try {
    const { farmId, cropType } = req.params;
    const { currentPrice } = req.query;

    if (!currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Current price is required'
      });
    }

    const triggers = await CropInventory.checkSlidingScaleTriggers(
      farmId,
      cropType,
      parseFloat(currentPrice)
    );

    res.json({
      success: true,
      count: triggers.length,
      triggers
    });
  } catch (error) {
    console.error('Error checking sliding scale triggers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check sliding scale triggers',
      error: error.message
    });
  }
};

// Get revenue projections
exports.getRevenueProjections = async (req, res) => {
  try {
    const { farmId } = req.params;
    const year = req.query.year || new Date().getFullYear();

    // Default price scenarios
    const priceScenarios = req.body.scenarios || [
      {
        name: 'current',
        prices: { corn: 4.50, soybeans: 11.00, wheat: 5.50, milo: 4.25, sunflower: 25.00 }
      },
      {
        name: 'optimistic',
        prices: { corn: 5.50, soybeans: 13.00, wheat: 6.50, milo: 5.25, sunflower: 28.00 }
      },
      {
        name: 'pessimistic',
        prices: { corn: 3.50, soybeans: 9.00, wheat: 4.50, milo: 3.25, sunflower: 22.00 }
      }
    ];

    const projections = await CropInventory.getRevenueProjections(
      farmId,
      parseInt(year),
      priceScenarios
    );

    res.json({
      success: true,
      year,
      projections
    });
  } catch (error) {
    console.error('Error fetching revenue projections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue projections',
      error: error.message
    });
  }
};

// Update market price
exports.updateMarketPrice = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    inventory.marketPrices.push({
      date: new Date(),
      ...req.body
    });

    // Keep only last 30 days of price history
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    inventory.marketPrices = inventory.marketPrices.filter(p => p.date >= thirtyDaysAgo);

    // Update projected revenue if current price provided
    if (req.body.cashPrice) {
      await inventory.updateProjectedRevenue(req.body.cashPrice);
    } else {
      await inventory.save();
    }

    res.json({
      success: true,
      message: 'Market price updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Error updating market price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update market price',
      error: error.message
    });
  }
};

// Add storage fee
exports.addStorageFee = async (req, res) => {
  try {
    const inventory = await CropInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    inventory.storageFees.push(req.body);
    await inventory.save();

    res.json({
      success: true,
      message: 'Storage fee added successfully',
      inventory
    });
  } catch (error) {
    console.error('Error adding storage fee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add storage fee',
      error: error.message
    });
  }
};
