const User = require('../models/user');
const Property = require('../models/property');
const Field = require('../models/field');

// Get landlord financial summary for farmer view
exports.getLandlordSummary = async (req, res) => {
  try {
    const { landlordId } = req.params;

    // Verify landlord exists
    const landlord = await User.findById(landlordId);
    if (!landlord || landlord.role !== 'landlord') {
      return res.status(404).json({
        success: false,
        message: 'Landlord not found'
      });
    }

    // Get all properties for this landlord
    const properties = await Property.find({ landlord: landlordId }).populate('fields');

    // Calculate summary
    const summary = {
      totalAcres: 0,
      totalFields: 0,
      rentOwed: 0,        // Rent owed to landlord
      expensesOwed: 0,    // Expenses landlord owes to M77 AG
      incomeOwed: 0,      // Crop income owed to landlord
      ytdIncome: 0        // Year-to-date income received
    };

    // Calculate from properties
    for (const property of properties) {
      summary.totalAcres += property.totalAcres || 0;
      if (property.fields) {
        summary.totalFields += property.fields.length;
      }

      // TODO: Calculate actual financial data from transactions and ledger entries
      // For now, these will be 0 until we implement full transaction tracking
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting landlord summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landlord summary',
      error: error.message
    });
  }
};

// Get all landlords with their properties
exports.getAllLandlords = async (req, res) => {
  try {
    // Get all landlord users
    const landlords = await User.find({ role: 'landlord' }).select('-password');

    // For each landlord, get their properties and fields
    const landlordsWithData = await Promise.all(
      landlords.map(async (landlord) => {
        const properties = await Property.find({ landlord: landlord._id }).populate('fields');
        const totalAcres = properties.reduce((sum, p) => sum + (p.totalAcres || 0), 0);
        const totalFields = properties.reduce((sum, p) => sum + (p.fields?.length || 0), 0);

        return {
          ...landlord.toObject(),
          propertiesCount: properties.length,
          totalAcres,
          totalFields
        };
      })
    );

    res.json({
      success: true,
      landlords: landlordsWithData
    });
  } catch (error) {
    console.error('Error getting landlords:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landlords',
      error: error.message
    });
  }
};

// Update field projections (farmer updates that landlords see)
exports.updateFieldProjections = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updates = req.body;

    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Update current crop projections
    if (updates.currentCrop) {
      field.currentCrop = {
        ...field.currentCrop,
        ...updates.currentCrop
      };
    }

    // Update financials
    if (updates.financials) {
      field.financials = {
        ...field.financials,
        ...updates.financials
      };
    }

    await field.save();

    res.json({
      success: true,
      message: 'Field projections updated successfully',
      field
    });
  } catch (error) {
    console.error('Error updating field projections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update field projections',
      error: error.message
    });
  }
};
