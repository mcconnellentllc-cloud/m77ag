const User = require('../models/user');

// Get landlord preferences
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      preferences: user.landlordPreferences || {}
    });
  } catch (error) {
    console.error('Error getting landlord preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message
    });
  }
};

// Update landlord preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Merge existing preferences with new ones
    user.landlordPreferences = {
      ...user.landlordPreferences,
      ...req.body
    };

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.landlordPreferences
    });
  } catch (error) {
    console.error('Error updating landlord preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

// Get financial summary (running bill)
exports.getFinancialSummary = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('properties');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Calculate from actual data in database
    // For now, return mock data structure
    const summary = {
      totalAcres: 0,
      totalFields: 0,
      rentOwed: 0,        // Rent owed to landlord
      expensesOwed: 0,    // Expenses landlord owes to M77 AG
      incomeOwed: 0,      // Crop income owed to landlord
      ytdIncome: 0        // Year-to-date income received
    };

    // Calculate from properties if they exist
    if (user.properties && user.properties.length > 0) {
      for (const property of user.properties) {
        summary.totalAcres += property.totalAcres || 0;
        // TODO: Add field counting when Property model includes fields
      }
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial summary',
      error: error.message
    });
  }
};

// Get landlord's properties and fields
exports.getProperties = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'properties',
      populate: {
        path: 'fields'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Enhance properties with financial data
    const propertiesWithFinancials = user.properties.map(property => {
      const propObj = property.toObject();

      // Add financial calculations for each field
      if (propObj.fields) {
        propObj.fields = propObj.fields.map(field => {
          // TODO: Calculate actual financials from transactions
          const financials = {
            breakEvenPerAcre: 0,
            profitPerAcre: 0,
            totalExpenses: 0,
            projectedRevenue: 0
          };

          return {
            ...field,
            financials
          };
        });
      }

      return propObj;
    });

    res.json({
      success: true,
      properties: propertiesWithFinancials
    });
  } catch (error) {
    console.error('Error getting landlord properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties',
      error: error.message
    });
  }
};

// Get landlord's transactions
exports.getTransactions = async (req, res) => {
  try {
    // TODO: Query actual transactions from database
    // For now, return empty array
    const transactions = [];

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error getting landlord transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
};

// Setup ACH payment (Stripe integration)
exports.setupACH = async (req, res) => {
  try {
    const { bankToken } = req.body;

    if (!bankToken) {
      return res.status(400).json({
        success: false,
        message: 'Bank token is required'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Implement Stripe customer and bank account creation
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    //
    // let customer;
    // if (user.landlordPreferences.stripeCustomerId) {
    //   customer = await stripe.customers.retrieve(user.landlordPreferences.stripeCustomerId);
    // } else {
    //   customer = await stripe.customers.create({
    //     email: user.email,
    //     name: user.name,
    //     metadata: {
    //       userId: user._id.toString()
    //     }
    //   });
    // }
    //
    // const bankAccount = await stripe.customers.createSource(customer.id, {
    //   source: bankToken
    // });
    //
    // user.landlordPreferences.stripeCustomerId = customer.id;
    // user.landlordPreferences.stripeBankAccountId = bankAccount.id;

    await user.save();

    res.json({
      success: true,
      message: 'Bank account connected successfully'
    });
  } catch (error) {
    console.error('Error setting up ACH:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup ACH',
      error: error.message
    });
  }
};

// Disconnect ACH
exports.disconnectACH = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Remove from Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // if (user.landlordPreferences.stripeBankAccountId) {
    //   await stripe.customers.deleteSource(
    //     user.landlordPreferences.stripeCustomerId,
    //     user.landlordPreferences.stripeBankAccountId
    //   );
    // }

    user.landlordPreferences.stripeBankAccountId = null;
    await user.save();

    res.json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting ACH:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect ACH',
      error: error.message
    });
  }
};
