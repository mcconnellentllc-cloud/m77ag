const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const Field = require('../models/field');
const Property = require('../models/property');

// Get all fields
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    // Filter by property if provided
    if (req.query.property) {
      query.property = req.query.property;
    }

    // Filter by landlord if provided or if user is a landlord
    if (role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.query.landlord) {
      query.landlord = req.query.landlord;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const fields = await Field.find(query)
      .populate('property', 'name totalAcres')
      .populate('landlord', 'firstName lastName email username')
      .sort({ 'property': 1, 'name': 1 });

    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fields',
      error: error.message
    });
  }
});

// Get single field by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id)
      .populate('property', 'name address totalAcres')
      .populate('landlord', 'firstName lastName email username phone');

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && field.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this field'
      });
    }

    res.json({
      success: true,
      field
    });
  } catch (error) {
    console.error('Error fetching field:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field',
      error: error.message
    });
  }
});

// Create new field
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin and farmer roles can create fields
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can create fields'
      });
    }

    const field = new Field(req.body);
    await field.save();

    // Add field to property's fields array
    await Property.findByIdAndUpdate(field.property, {
      $push: { fields: field._id }
    });

    const populatedField = await Field.findById(field._id)
      .populate('property', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      field: populatedField
    });
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating field',
      error: error.message
    });
  }
});

// Update field
router.put('/:id', authenticate, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Check permissions
    if (req.user.role === 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Landlords cannot edit field details. Contact the farm manager.'
      });
    }

    Object.assign(field, req.body);
    await field.save();

    const updatedField = await Field.findById(field._id)
      .populate('property', 'name')
      .populate('landlord', 'firstName lastName email username');

    res.json({
      success: true,
      message: 'Field updated successfully',
      field: updatedField
    });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating field',
      error: error.message
    });
  }
});

// Delete field (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Remove field from property's fields array
    await Property.findByIdAndUpdate(field.property, {
      $pull: { fields: field._id }
    });

    await field.deleteOne();

    res.json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting field',
      error: error.message
    });
  }
});

// Add crop history to field
router.post('/:id/crop-history', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can add crop history
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can add crop history'
      });
    }

    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    await field.addCropHistory(req.body);

    res.json({
      success: true,
      message: 'Crop history added successfully',
      field
    });
  } catch (error) {
    console.error('Error adding crop history:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding crop history',
      error: error.message
    });
  }
});

// Get field yield history
router.get('/:id/yield-history', authenticate, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && field.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this field'
      });
    }

    const yieldHistory = field.cropHistory.map(crop => ({
      year: crop.year,
      cropType: crop.cropType,
      variety: crop.variety,
      yield: crop.yield,
      revenue: crop.totalRevenue
    }));

    res.json({
      success: true,
      fieldName: field.name,
      averageYield: field.averageYield,
      yieldHistory
    });
  } catch (error) {
    console.error('Error fetching yield history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching yield history',
      error: error.message
    });
  }
});

// Update current crop
router.patch('/:id/current-crop', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update current crop
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update current crop'
      });
    }

    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    field.currentCrop = {
      ...field.currentCrop,
      ...req.body
    };

    await field.save();

    res.json({
      success: true,
      message: 'Current crop updated successfully',
      field
    });
  } catch (error) {
    console.error('Error updating current crop:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating current crop',
      error: error.message
    });
  }
});

// Update crop plan for future years
router.post('/:id/crop-plan', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update crop plan
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update crop plans'
      });
    }

    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    const { year, cropType, variety, notes } = req.body;

    await field.updateCropPlan(year, { cropType, variety, notes });

    res.json({
      success: true,
      message: 'Crop plan updated successfully',
      field
    });
  } catch (error) {
    console.error('Error updating crop plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating crop plan',
      error: error.message
    });
  }
});

// Get fields by property
router.get('/property/:propertyId', authenticate, async (req, res) => {
  try {
    const fields = await Field.find({ property: req.params.propertyId })
      .populate('landlord', 'firstName lastName email username')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Error fetching property fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fields',
      error: error.message
    });
  }
});

module.exports = router;
