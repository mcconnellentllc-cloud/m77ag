const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isFarmer, isLandlord } = require('../middleware/auth');
const Property = require('../models/property');
const Field = require('../models/field');
const { User } = require('../models/user');

// Get all properties (admin/farmer only)
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;

    let query = {};

    // Landlords can only see their own properties
    if (role === 'landlord') {
      query.landlord = req.user._id;
    }

    const properties = await Property.find(query)
      .populate('landlord', 'firstName lastName email username')
      .populate({
        path: 'fields',
        select: 'name acres currentCrop status'
      })
      .sort({ name: 1 });

    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
});

// Get single property by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'firstName lastName email username phone address')
      .populate({
        path: 'fields',
        select: 'name fieldNumber acres soilType currentCrop status cropHistory'
      });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'landlord' && property.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this property'
      });
    }

    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    });
  }
});

// Create new property (admin/farmer only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin and farmer roles can create properties
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can create properties'
      });
    }

    const property = new Property(req.body);
    await property.save();

    // Add property to landlord's properties array
    await User.findByIdAndUpdate(property.landlord, {
      $push: { properties: property._id }
    });

    const populatedProperty = await Property.findById(property._id)
      .populate('landlord', 'firstName lastName email username');

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property: populatedProperty
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating property',
      error: error.message
    });
  }
});

// Update property
router.put('/:id', authenticate, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check permissions (landlords can't edit their own property details)
    if (req.user.role === 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Landlords cannot edit property details. Contact the farm manager.'
      });
    }

    Object.assign(property, req.body);
    await property.save();

    const updatedProperty = await Property.findById(property._id)
      .populate('landlord', 'firstName lastName email username');

    res.json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    });
  }
});

// Delete property (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Remove property from landlord's properties array
    await User.findByIdAndUpdate(property.landlord, {
      $pull: { properties: property._id }
    });

    // Delete all fields associated with this property
    await Field.deleteMany({ property: property._id });

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property and associated fields deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
});

// Get properties by landlord
router.get('/landlord/:landlordId', authenticate, async (req, res) => {
  try {
    // Users can only see their own properties unless admin/farmer
    if (req.user.role === 'landlord' && req.user._id.toString() !== req.params.landlordId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own properties'
      });
    }

    const properties = await Property.find({ landlord: req.params.landlordId })
      .populate('landlord', 'firstName lastName email username')
      .populate({
        path: 'fields',
        select: 'name acres currentCrop status'
      })
      .sort({ name: 1 });

    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error fetching landlord properties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
});

// Update market value
router.patch('/:id/market-value', authenticate, async (req, res) => {
  try {
    // Only admin and farmer can update market values
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers and admins can update market values'
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    property.marketValue = {
      ...property.marketValue,
      ...req.body,
      lastUpdated: new Date()
    };

    await property.save();

    res.json({
      success: true,
      message: 'Market value updated successfully',
      property
    });
  } catch (error) {
    console.error('Error updating market value:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating market value',
      error: error.message
    });
  }
});

module.exports = router;
