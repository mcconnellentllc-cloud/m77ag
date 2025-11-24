const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const HarvestData = require('../models/harvestData');
const Field = require('../models/field');
const Property = require('../models/property');
const Transaction = require('../models/transaction');

// Get all harvest data
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    // Landlords can only see their own harvest data
    if (role === 'landlord') {
      query.landlord = req.user._id;
    }

    // Apply filters
    if (req.query.landlord && role !== 'landlord') query.landlord = req.query.landlord;
    if (req.query.property) query.property = req.query.property;
    if (req.query.field) query.field = req.query.field;
    if (req.query.cropYear) query.cropYear = req.query.cropYear;
    if (req.query.cropType) query.cropType = req.query.cropType;
    if (req.query.verified !== undefined) query.verified = req.query.verified === 'true';

    const harvestRecords = await HarvestData.find(query)
      .populate('field', 'name fieldNumber acres')
      .populate('property', 'name')
      .populate('landlord', 'firstName lastName email username')
      .populate('importedBy', 'firstName lastName username')
      .sort({ harvestStartDate: -1 });

    res.json({
      success: true,
      count: harvestRecords.length,
      harvestRecords
    });
  } catch (error) {
    console.error('Error fetching harvest data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching harvest data',
      error: error.message
    });
  }
});

// Get single harvest record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const harvestRecord = await HarvestData.findById(req.params.id)
      .populate('field', 'name fieldNumber acres soilType')
      .populate('property', 'name address')
      .populate('landlord', 'firstName lastName email username phone')
      .populate('importedBy', 'firstName lastName username')
      .populate('verifiedBy', 'firstName lastName username');

    if (!harvestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && harvestRecord.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this harvest record'
      });
    }

    res.json({
      success: true,
      harvestRecord
    });
  } catch (error) {
    console.error('Error fetching harvest record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching harvest record',
      error: error.message
    });
  }
});

// Create new harvest record
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can create harvest records
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can create harvest records'
      });
    }

    const harvestData = {
      ...req.body,
      importedBy: req.user._id,
      importSource: req.body.importSource || 'manual'
    };

    const harvestRecord = new HarvestData(harvestData);
    await harvestRecord.save();

    // Update field's crop history with this harvest
    const field = await Field.findById(harvestRecord.field);
    if (field) {
      await field.addCropHistory({
        year: harvestRecord.cropYear,
        cropType: harvestRecord.cropType,
        variety: harvestRecord.variety,
        harvestDate: harvestRecord.harvestEndDate || harvestRecord.harvestStartDate,
        yield: harvestRecord.yieldPerAcre,
        pricePerBushel: harvestRecord.saleDetails?.pricePerBushel,
        totalRevenue: harvestRecord.calculations?.grossRevenue,
        notes: harvestRecord.notes
      });

      // Update current crop actual yield
      if (field.currentCrop && field.currentCrop.year === harvestRecord.cropYear) {
        field.currentCrop.actualYield = harvestRecord.yieldPerAcre;
        await field.save();
      }
    }

    const populatedRecord = await HarvestData.findById(harvestRecord._id)
      .populate('field', 'name')
      .populate('property', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.status(201).json({
      success: true,
      message: 'Harvest record created successfully',
      harvestRecord: populatedRecord
    });
  } catch (error) {
    console.error('Error creating harvest record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating harvest record',
      error: error.message
    });
  }
});

// Bulk import harvest data
router.post('/bulk-import', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can bulk import
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can bulk import harvest data'
      });
    }

    const { harvestRecords, importSource, originalFileName } = req.body;

    if (!Array.isArray(harvestRecords)) {
      return res.status(400).json({
        success: false,
        message: 'Harvest records must be an array'
      });
    }

    // Add metadata to each record
    const recordsWithMetadata = harvestRecords.map(record => ({
      ...record,
      importedBy: req.user._id,
      importSource: importSource || 'csv',
      originalFileName: originalFileName || 'bulk_import.csv',
      verified: false
    }));

    const created = await HarvestData.insertMany(recordsWithMetadata);

    // Update fields with crop history
    for (const record of created) {
      const field = await Field.findById(record.field);
      if (field) {
        await field.addCropHistory({
          year: record.cropYear,
          cropType: record.cropType,
          variety: record.variety,
          harvestDate: record.harvestEndDate || record.harvestStartDate,
          yield: record.yieldPerAcre,
          pricePerBushel: record.saleDetails?.pricePerBushel,
          totalRevenue: record.calculations?.grossRevenue
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${created.length} harvest records imported successfully`,
      count: created.length,
      harvestRecords: created
    });
  } catch (error) {
    console.error('Error bulk importing harvest data:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk importing harvest data',
      error: error.message
    });
  }
});

// Update harvest record
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update harvest records
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update harvest records'
      });
    }

    const harvestRecord = await HarvestData.findById(req.params.id);

    if (!harvestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    Object.assign(harvestRecord, req.body);
    await harvestRecord.save();

    const updatedRecord = await HarvestData.findById(harvestRecord._id)
      .populate('field', 'name')
      .populate('property', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.json({
      success: true,
      message: 'Harvest record updated successfully',
      harvestRecord: updatedRecord
    });
  } catch (error) {
    console.error('Error updating harvest record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating harvest record',
      error: error.message
    });
  }
});

// Verify harvest record
router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can verify
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can verify harvest records'
      });
    }

    const harvestRecord = await HarvestData.findById(req.params.id);

    if (!harvestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    await harvestRecord.markAsVerified(req.user._id);

    const updatedRecord = await HarvestData.findById(harvestRecord._id)
      .populate('verifiedBy', 'firstName lastName username');

    res.json({
      success: true,
      message: 'Harvest record verified successfully',
      harvestRecord: updatedRecord
    });
  } catch (error) {
    console.error('Error verifying harvest record:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying harvest record',
      error: error.message
    });
  }
});

// Add delivery ticket
router.post('/:id/delivery-ticket', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can add delivery tickets
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can add delivery tickets'
      });
    }

    const harvestRecord = await HarvestData.findById(req.params.id);

    if (!harvestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    await harvestRecord.addDeliveryTicket(req.body);

    res.json({
      success: true,
      message: 'Delivery ticket added successfully',
      harvestRecord
    });
  } catch (error) {
    console.error('Error adding delivery ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding delivery ticket',
      error: error.message
    });
  }
});

// Get field year summary
router.get('/summary/field/:fieldId/year/:year', authenticate, async (req, res) => {
  try {
    const { fieldId, year } = req.params;

    // Check access permissions
    if (req.user.role === 'landlord') {
      const field = await Field.findById(fieldId);
      if (!field || field.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this field'
        });
      }
    }

    const summary = await HarvestData.getFieldYearSummary(fieldId, parseInt(year));

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'No harvest data found for this field and year'
      });
    }

    res.json({
      success: true,
      fieldId,
      year: parseInt(year),
      summary
    });
  } catch (error) {
    console.error('Error fetching field summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field summary',
      error: error.message
    });
  }
});

// Get property year summary
router.get('/summary/property/:propertyId/year/:year', authenticate, async (req, res) => {
  try {
    const { propertyId, year } = req.params;

    // Check access permissions
    if (req.user.role === 'landlord') {
      const property = await Property.findById(propertyId);
      if (!property || property.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this property'
        });
      }
    }

    const summary = await HarvestData.getPropertyYearSummary(propertyId, parseInt(year));

    res.json({
      success: true,
      propertyId,
      year: parseInt(year),
      summary
    });
  } catch (error) {
    console.error('Error fetching property summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property summary',
      error: error.message
    });
  }
});

// Delete harvest record (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const harvestRecord = await HarvestData.findById(req.params.id);

    if (!harvestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    await harvestRecord.deleteOne();

    res.json({
      success: true,
      message: 'Harvest record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting harvest record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting harvest record',
      error: error.message
    });
  }
});

module.exports = router;
