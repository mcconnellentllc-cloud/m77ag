const CropInsurance = require('../models/cropInsurance');
const Field = require('../models/field');

// Get all insurance policies for a farm
exports.getAllPolicies = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { year, status } = req.query;

    const query = { farm: farmId };
    if (year) query.policyYear = parseInt(year);
    if (status) query.status = status;

    const policies = await CropInsurance.find(query)
      .populate('coveredFields.field', 'fieldName acres')
      .sort({ policyYear: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: policies.length,
      policies
    });
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policies',
      error: error.message
    });
  }
};

// Get single policy by ID
exports.getPolicy = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id)
      .populate('coveredFields.field', 'fieldName acres currentCrop')
      .lean();

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    res.json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Error fetching insurance policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policy',
      error: error.message
    });
  }
};

// Create new policy
exports.createPolicy = async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      createdBy: req.userId
    };

    const policy = new CropInsurance(policyData);
    await policy.save();

    res.status(201).json({
      success: true,
      message: 'Insurance policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Error creating insurance policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create insurance policy',
      error: error.message
    });
  }
};

// Update policy
exports.updatePolicy = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    Object.assign(policy, req.body);
    policy.lastModifiedBy = req.userId;
    await policy.save();

    res.json({
      success: true,
      message: 'Insurance policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Error updating insurance policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update insurance policy',
      error: error.message
    });
  }
};

// Delete policy
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await CropInsurance.findByIdAndDelete(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    res.json({
      success: true,
      message: 'Insurance policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting insurance policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete insurance policy',
      error: error.message
    });
  }
};

// Calculate coverage for policy
exports.calculateCoverage = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    await policy.calculateTotalCoverage();

    res.json({
      success: true,
      message: 'Coverage calculated successfully',
      policy
    });
  } catch (error) {
    console.error('Error calculating coverage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate coverage',
      error: error.message
    });
  }
};

// File a claim
exports.fileClaim = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    await policy.fileClaim(req.body);

    res.json({
      success: true,
      message: 'Claim filed successfully',
      policy
    });
  } catch (error) {
    console.error('Error filing claim:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to file claim',
      error: error.message
    });
  }
};

// Update claim status
exports.updateClaimStatus = async (req, res) => {
  try {
    const { claimNumber, status, paymentAmount, paymentDate } = req.body;

    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    await policy.updateClaimStatus(claimNumber, status, paymentAmount, paymentDate);

    res.json({
      success: true,
      message: 'Claim status updated successfully',
      policy
    });
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update claim status',
      error: error.message
    });
  }
};

// Get insurance summary for farm
exports.getInsuranceSummary = async (req, res) => {
  try {
    const { farmId } = req.params;
    const year = req.query.year || new Date().getFullYear();

    const summary = await CropInsurance.getInsuranceSummary(farmId, parseInt(year));

    res.json({
      success: true,
      year,
      summary
    });
  } catch (error) {
    console.error('Error fetching insurance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance summary',
      error: error.message
    });
  }
};

// Get policies needing attention
exports.getPoliciesNeedingAttention = async (req, res) => {
  try {
    const { farmId } = req.params;

    const policies = await CropInsurance.getPoliciesNeedingAttention(farmId);

    res.json({
      success: true,
      count: policies.length,
      policies
    });
  } catch (error) {
    console.error('Error fetching policies needing attention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies needing attention',
      error: error.message
    });
  }
};

// Add APH history entry
exports.addAPHHistory = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    policy.aphHistory.push(req.body);
    policy.aphHistory.sort((a, b) => b.year - a.year);
    await policy.save();

    res.json({
      success: true,
      message: 'APH history added successfully',
      policy
    });
  } catch (error) {
    console.error('Error adding APH history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add APH history',
      error: error.message
    });
  }
};

// Add covered field to policy
exports.addCoveredField = async (req, res) => {
  try {
    const policy = await CropInsurance.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    const field = await Field.findById(req.body.fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    policy.coveredFields.push({
      field: field._id,
      fieldName: field.fieldName,
      acres: req.body.acres || field.acres,
      cropType: req.body.cropType || field.currentCrop?.cropType,
      approvedYield: req.body.approvedYield,
      projectedPrice: req.body.projectedPrice
    });

    await policy.save();

    res.json({
      success: true,
      message: 'Field added to policy successfully',
      policy
    });
  } catch (error) {
    console.error('Error adding covered field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add covered field',
      error: error.message
    });
  }
};
