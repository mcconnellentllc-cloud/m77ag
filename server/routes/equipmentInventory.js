const express = require('express');
const router = express.Router();
const Equipment = require('../models/equipment');

// Get all equipment (admin - includes private)
router.get('/', async (req, res) => {
  try {
    const { forSale, category } = req.query;
    const filter = {};

    if (forSale !== undefined) {
      filter.forSale = forSale === 'true';
    }
    if (category) {
      filter.category = category;
    }

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get public equipment only (for sale) - strips private financial data
router.get('/public', async (req, res) => {
  try {
    const equipment = await Equipment.find({
      forSale: true,
      saleStatus: { $in: ['available', 'pending'] }
    }).sort({ createdAt: -1 });

    // Strip private financial data for public view
    const publicEquipment = equipment.map(item => {
      const obj = item.toObject();
      // Remove private fields
      delete obj.purchasePrice;
      delete obj.amountOwed;
      delete obj.hasLoan;
      delete obj.lender;
      delete obj.loanAccountNumber;
      delete obj.interestRate;
      delete obj.paymentAmount;
      delete obj.paymentFrequency;
      delete obj.nextPaymentDate;
      delete obj.loanEndDate;
      delete obj.askingPrice; // Internal asking price
      delete obj.floorPrice;  // Floor price is private
      delete obj.notes;       // Internal notes
      delete obj.maintenanceRecords; // Service history is private
      return obj;
    });

    res.json({
      success: true,
      count: publicEquipment.length,
      equipment: publicEquipment
    });
  } catch (error) {
    console.error('Error fetching public equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get equipment summary/stats
router.get('/summary', async (req, res) => {
  try {
    const allEquipment = await Equipment.find();

    // Calculate totals
    let totalValue = 0;
    let totalOwed = 0;
    let forSaleCount = 0;
    let forSaleValue = 0;
    let upcomingPayments = [];

    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    allEquipment.forEach(item => {
      totalValue += item.currentValue || 0;
      totalOwed += item.amountOwed || 0;

      if (item.forSale) {
        forSaleCount++;
        forSaleValue += item.askingPrice || item.currentValue || 0;
      }

      // Check for upcoming payments
      if (item.hasLoan && item.nextPaymentDate) {
        const paymentDate = new Date(item.nextPaymentDate);
        if (paymentDate <= thirtyDaysOut && paymentDate >= now) {
          upcomingPayments.push({
            equipmentId: item._id,
            title: item.title,
            paymentAmount: item.paymentAmount,
            dueDate: item.nextPaymentDate,
            lender: item.lender
          });
        }
      }
    });

    // Sort upcoming payments by date
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      summary: {
        totalEquipment: allEquipment.length,
        totalValue,
        totalOwed,
        netWorth: totalValue - totalOwed,
        forSaleCount,
        forSaleValue,
        upcomingPayments
      }
    });
  } catch (error) {
    console.error('Error fetching equipment summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// Get single equipment item
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();

    res.status(201).json({
      success: true,
      equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to update equipment' });
  }
});

// Toggle for-sale status
router.patch('/:id/toggle-sale', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    equipment.forSale = !equipment.forSale;
    equipment.saleStatus = equipment.forSale ? 'available' : 'not-for-sale';
    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error toggling sale status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle sale status' });
  }
});

// Update financial info
router.patch('/:id/financial', async (req, res) => {
  try {
    const {
      currentValue,
      amountOwed,
      lender,
      paymentAmount,
      paymentFrequency,
      nextPaymentDate,
      hasLoan
    } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    if (currentValue !== undefined) equipment.currentValue = currentValue;
    if (amountOwed !== undefined) equipment.amountOwed = amountOwed;
    if (lender !== undefined) equipment.lender = lender;
    if (paymentAmount !== undefined) equipment.paymentAmount = paymentAmount;
    if (paymentFrequency !== undefined) equipment.paymentFrequency = paymentFrequency;
    if (nextPaymentDate !== undefined) equipment.nextPaymentDate = nextPaymentDate;
    if (hasLoan !== undefined) equipment.hasLoan = hasLoan;

    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating financial info:', error);
    res.status(500).json({ success: false, error: 'Failed to update financial info' });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete equipment' });
  }
});

// Bulk import equipment (for initial setup)
router.post('/bulk-import', async (req, res) => {
  try {
    const { equipment: equipmentList } = req.body;

    if (!Array.isArray(equipmentList)) {
      return res.status(400).json({ success: false, error: 'Equipment must be an array' });
    }

    const created = await Equipment.insertMany(equipmentList);

    res.status(201).json({
      success: true,
      count: created.length,
      equipment: created
    });
  } catch (error) {
    console.error('Error bulk importing equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to import equipment' });
  }
});

// ==========================================
// MAINTENANCE & HOURS TRACKING ENDPOINTS
// ==========================================

// Add maintenance record
router.post('/:id/maintenance', async (req, res) => {
  try {
    const {
      type,
      description,
      hoursAtService,
      milesAtService,
      parts,
      laborHours,
      laborCost,
      totalCost,
      performedBy,
      vendor,
      nextServiceDue,
      notes
    } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Add maintenance record
    equipment.maintenanceRecords.push({
      type: type || 'other',
      description,
      hoursAtService: hoursAtService || equipment.currentHours,
      milesAtService: milesAtService || equipment.currentMiles,
      parts: parts || [],
      laborHours,
      laborCost,
      totalCost,
      performedBy: performedBy || 'self',
      vendor,
      nextServiceDue,
      notes,
      date: new Date()
    });

    // Update current hours if provided
    if (hoursAtService && hoursAtService > equipment.currentHours) {
      equipment.currentHours = hoursAtService;
    }

    // Update current miles if provided
    if (milesAtService && milesAtService > (equipment.currentMiles || 0)) {
      equipment.currentMiles = milesAtService;
    }

    await equipment.save();

    res.json({
      success: true,
      equipment,
      message: 'Maintenance record added'
    });
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({ success: false, error: 'Failed to add maintenance record' });
  }
});

// Get maintenance records for equipment
router.get('/:id/maintenance', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Sort records by date, newest first
    const records = (equipment.maintenanceRecords || []).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      equipmentTitle: equipment.title,
      currentHours: equipment.currentHours,
      maintenanceDue: equipment.maintenanceDue,
      records
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance records' });
  }
});

// Delete a maintenance record
router.delete('/:id/maintenance/:recordId', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    equipment.maintenanceRecords = equipment.maintenanceRecords.filter(
      record => record._id.toString() !== req.params.recordId
    );

    await equipment.save();

    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete maintenance record' });
  }
});

// Update hours/miles on equipment
router.patch('/:id/hours', async (req, res) => {
  try {
    const { currentHours, currentMiles } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    if (currentHours !== undefined) {
      equipment.currentHours = currentHours;
    }
    if (currentMiles !== undefined) {
      equipment.currentMiles = currentMiles;
    }

    await equipment.save();

    res.json({
      success: true,
      equipment,
      maintenanceDue: equipment.maintenanceDue
    });
  } catch (error) {
    console.error('Error updating hours:', error);
    res.status(500).json({ success: false, error: 'Failed to update hours' });
  }
});

// Update market valuation
router.patch('/:id/market-value', async (req, res) => {
  try {
    const {
      marketValue,
      marketValueSource,
      marketTrends
    } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    if (marketValue !== undefined) {
      equipment.marketValue = marketValue;
      equipment.marketValueDate = new Date();
    }
    if (marketValueSource !== undefined) {
      equipment.marketValueSource = marketValueSource;
    }
    if (marketTrends !== undefined) {
      equipment.marketTrends = { ...equipment.marketTrends, ...marketTrends };
    }

    await equipment.save();

    res.json({
      success: true,
      equipment,
      reportingValue: equipment.reportingValue
    });
  } catch (error) {
    console.error('Error updating market value:', error);
    res.status(500).json({ success: false, error: 'Failed to update market value' });
  }
});

// Get all equipment with maintenance due
router.get('/maintenance-due', async (req, res) => {
  try {
    const allEquipment = await Equipment.find({ saleStatus: { $ne: 'sold' } });

    const maintenanceDue = [];

    allEquipment.forEach(equipment => {
      const due = equipment.maintenanceDue;
      if (due && due.length > 0) {
        maintenanceDue.push({
          equipmentId: equipment._id,
          title: equipment.title,
          category: equipment.category,
          currentHours: equipment.currentHours,
          maintenanceDue: due
        });
      }
    });

    // Sort by most overdue first
    maintenanceDue.sort((a, b) => {
      const aMax = Math.max(...a.maintenanceDue.map(d => d.hoursOverdue));
      const bMax = Math.max(...b.maintenanceDue.map(d => d.hoursOverdue));
      return bMax - aMax;
    });

    res.json({
      success: true,
      count: maintenanceDue.length,
      maintenanceDue
    });
  } catch (error) {
    console.error('Error fetching maintenance due:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance due' });
  }
});

// Get equipment report (for landlord/financial reporting)
router.get('/report', async (req, res) => {
  try {
    const allEquipment = await Equipment.find().sort({ category: 1, title: 1 });

    let totalMarketValue = 0;
    let totalReportingValue = 0;
    let totalEquity = 0;
    let totalOwed = 0;

    const report = allEquipment.map(item => {
      totalMarketValue += item.marketValue || item.currentValue || 0;
      totalReportingValue += item.reportingValue || 0;
      totalEquity += item.equity || 0;
      totalOwed += item.amountOwed || 0;

      return {
        title: item.title,
        category: item.category,
        year: item.year,
        make: item.make,
        model: item.model,
        currentHours: item.currentHours,
        marketValue: item.marketValue || item.currentValue,
        reportingValue: item.reportingValue,
        amountOwed: item.amountOwed,
        equity: item.equity,
        forSale: item.forSale,
        ownerEntity: item.ownerEntity
      };
    });

    res.json({
      success: true,
      totals: {
        totalEquipment: allEquipment.length,
        totalMarketValue,
        totalReportingValue,
        totalOwed,
        totalEquity
      },
      equipment: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

module.exports = router;
