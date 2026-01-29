const SeedOrder = require('../models/seedOrder');
const Field = require('../models/field');

// Get all seed orders for a farm
exports.getAllOrders = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { year, status } = req.query;

    const query = { farm: farmId };
    if (year) query.orderYear = parseInt(year);
    if (status) query.status = status;

    const orders = await SeedOrder.find(query)
      .sort({ orderYear: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching seed orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seed orders',
      error: error.message
    });
  }
};

// Get single order by ID
exports.getOrder = async (req, res) => {
  try {
    const order = await SeedOrder.findById(req.params.id)
      .populate('cornSeeds.fieldAssignments.field', 'fieldName acres')
      .populate('sorghumSeeds.fieldAssignments.field', 'fieldName acres')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Seed order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching seed order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seed order',
      error: error.message
    });
  }
};

// Create new seed order
exports.createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      createdBy: req.userId
    };

    const order = new SeedOrder(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Seed order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating seed order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create seed order',
      error: error.message
    });
  }
};

// Update seed order
exports.updateOrder = async (req, res) => {
  try {
    const order = await SeedOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Seed order not found'
      });
    }

    Object.assign(order, req.body);
    order.lastModifiedBy = req.userId;
    await order.save();

    res.json({
      success: true,
      message: 'Seed order updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating seed order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seed order',
      error: error.message
    });
  }
};

// Delete seed order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await SeedOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Seed order not found'
      });
    }

    res.json({
      success: true,
      message: 'Seed order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seed order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seed order',
      error: error.message
    });
  }
};

// Assign hybrid to field
exports.assignToField = async (req, res) => {
  try {
    const { seedType, hybridIndex } = req.params;
    const assignmentData = req.body;

    const order = await SeedOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Seed order not found'
      });
    }

    // Validate field exists
    if (assignmentData.fieldId) {
      const field = await Field.findById(assignmentData.fieldId);
      if (field) {
        assignmentData.field = field._id;
        assignmentData.fieldName = field.fieldName;
      }
    }

    await order.assignHybridToField(seedType, parseInt(hybridIndex), assignmentData);

    res.json({
      success: true,
      message: 'Hybrid assigned to field successfully',
      order
    });
  } catch (error) {
    console.error('Error assigning hybrid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign hybrid to field',
      error: error.message
    });
  }
};

// Get available hybrids
exports.getAvailableHybrids = async (req, res) => {
  try {
    const hybrids = SeedOrder.getAvailableHybrids();

    res.json({
      success: true,
      hybrids
    });
  } catch (error) {
    console.error('Error getting hybrids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available hybrids',
      error: error.message
    });
  }
};

// Get order summary by year
exports.getOrderSummary = async (req, res) => {
  try {
    const { farmId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const orders = await SeedOrder.find({
      farm: farmId,
      orderYear: year
    }).lean();

    const summary = {
      year,
      totalOrders: orders.length,
      corn: {
        totalUnits: 0,
        totalValue: 0,
        hybrids: []
      },
      sorghum: {
        totalUnits: 0,
        totalValue: 0,
        hybrids: []
      },
      wheat: {
        totalUnits: 0,
        totalValue: 0,
        varieties: []
      },
      totalPaid: 0,
      balanceDue: 0
    };

    orders.forEach(order => {
      // Corn
      order.cornSeeds?.forEach(seed => {
        summary.corn.totalUnits += seed.unitsOrdered || 0;
        summary.corn.totalValue += seed.totalGrossValue || 0;
        summary.corn.hybrids.push({
          hybrid: seed.hybrid,
          units: seed.unitsOrdered,
          assigned: seed.fieldAssignments?.length || 0
        });
      });

      // Sorghum
      order.sorghumSeeds?.forEach(seed => {
        summary.sorghum.totalUnits += seed.unitsOrdered || 0;
        summary.sorghum.totalValue += seed.totalGrossValue || 0;
        summary.sorghum.hybrids.push({
          hybrid: seed.hybrid,
          units: seed.unitsOrdered,
          assigned: seed.fieldAssignments?.length || 0
        });
      });

      // Wheat
      order.wheatSeeds?.forEach(seed => {
        summary.wheat.totalUnits += seed.unitsOrdered || 0;
        summary.wheat.totalValue += seed.totalGrossValue || 0;
      });

      summary.totalPaid += order.totalPaid || 0;
      summary.balanceDue += order.balanceDue || 0;
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting order summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order summary',
      error: error.message
    });
  }
};

// Record payment
exports.recordPayment = async (req, res) => {
  try {
    const order = await SeedOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Seed order not found'
      });
    }

    order.payments.push({
      date: new Date(),
      ...req.body
    });

    order.totalPaid = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    order.balanceDue = (order.financials?.netOrderAmount || 0) - order.totalPaid;

    await order.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      order
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};
