const express = require('express');
const router = express.Router();
const RealEstate = require('../models/realEstate');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await RealEstate.find().sort({ name: 1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

// Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const properties = await RealEstate.find();

    let totalAcres = 0;
    let totalValue = 0;
    let totalOwed = 0;
    let totalTaxes = 0;
    let forSaleCount = 0;

    properties.forEach(prop => {
      totalAcres += prop.acres || 0;
      totalValue += prop.currentValue || 0;
      totalOwed += prop.amountOwed || 0;
      totalTaxes += prop.annualTaxes || 0;
      if (prop.forSale) forSaleCount++;
    });

    // Find upcoming payments
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const upcomingPayments = properties
      .filter(p => p.nextPaymentDate && new Date(p.nextPaymentDate) <= sixMonthsFromNow)
      .map(p => ({
        id: p._id,
        name: p.name,
        amount: p.paymentAmount,
        dueDate: p.nextPaymentDate,
        lender: p.lender
      }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      totalProperties: properties.length,
      totalAcres,
      totalValue,
      totalOwed,
      netWorth: totalValue - totalOwed,
      totalTaxes,
      forSaleCount,
      upcomingPayments
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const property = await RealEstate.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});

// Create new property
router.post('/', async (req, res) => {
  try {
    const property = new RealEstate(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const property = await RealEstate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Error updating property', error: error.message });
  }
});

// Toggle for sale status
router.patch('/:id/toggle-sale', async (req, res) => {
  try {
    const property = await RealEstate.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.forSale = !property.forSale;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error toggling sale status:', error);
    res.status(500).json({ message: 'Error toggling sale status', error: error.message });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const property = await RealEstate.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Error deleting property', error: error.message });
  }
});

module.exports = router;
