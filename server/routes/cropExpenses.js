const express = require('express');
const router = express.Router();
const CropExpense = require('../models/cropExpense');
const CroppingField = require('../models/croppingField');

// Get all expenses (with filters)
router.get('/', async (req, res) => {
  try {
    const { cropCode, year, category, status, fieldId } = req.query;
    const filter = {};

    if (cropCode) filter.cropCode = cropCode;
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (fieldId) filter['fields.fieldId'] = fieldId;

    const expenses = await CropExpense.find(filter).sort({ date: -1 });

    res.json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
});

// Get expense summary by crop code (totals per category)
router.get('/summary', async (req, res) => {
  try {
    const { year } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);

    const expenses = await CropExpense.find(filter);

    // Group by cropCode
    const byCropCode = {};
    expenses.forEach(exp => {
      if (!byCropCode[exp.cropCode]) {
        byCropCode[exp.cropCode] = {
          cropCode: exp.cropCode,
          crop: exp.crop,
          year: exp.year,
          totalCost: 0,
          categories: {},
          expenseCount: 0
        };
      }
      const entry = byCropCode[exp.cropCode];
      const totalAcres = (exp.fields || []).reduce((sum, f) => sum + (f.acres || 0), 0);
      const expTotal = exp.costPerAcre * totalAcres;
      entry.totalCost += expTotal;
      entry.categories[exp.category] = (entry.categories[exp.category] || 0) + exp.costPerAcre;
      entry.expenseCount++;
    });

    res.json({ success: true, summary: Object.values(byCropCode) });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expense summary' });
  }
});

// Get expenses for a specific field
router.get('/field/:fieldId', async (req, res) => {
  try {
    const expenses = await CropExpense.find({
      'fields.fieldId': req.params.fieldId
    }).sort({ date: -1 });

    // Calculate totals by category
    const categoryTotals = {};
    let grandTotal = 0;
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.costPerAcre;
      grandTotal += exp.costPerAcre;
    });

    res.json({
      success: true,
      fieldId: req.params.fieldId,
      expenseCount: expenses.length,
      totalCostPerAcre: grandTotal,
      categoryTotals,
      expenses
    });
  } catch (error) {
    console.error('Error fetching field expenses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch field expenses' });
  }
});

// Create a new expense (applied to multiple fields)
router.post('/', async (req, res) => {
  try {
    const { cropCode, date, description, category, costPerAcre,
            fieldIds, paidBy, vendor, invoiceNumber, status, notes } = req.body;

    if (!cropCode || !date || !description || !category || costPerAcre === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Required: cropCode, date, description, category, costPerAcre'
      });
    }

    // Look up the fields
    let fields = [];
    if (fieldIds && fieldIds.length > 0) {
      // Specific fields selected
      const fieldDocs = await CroppingField.find({ _id: { $in: fieldIds } });
      fields = fieldDocs.map(f => ({
        fieldId: f._id,
        farm: f.farm,
        field: f.field,
        acres: f.acres || 0
      }));
    } else {
      // All fields matching the crop code's crop + year
      const parts = cropCode.match(/^(.+?)(\d{2})$/);
      if (!parts) {
        return res.status(400).json({ success: false, error: 'Invalid crop code format' });
      }
      const cropName = parts[1].replace(/-/g, ' ');
      const yearSuffix = parts[2];
      const fullYear = 2000 + parseInt(yearSuffix);
      const cropField = `crop${fullYear}`;

      const fieldDocs = await CroppingField.find({
        [cropField]: { $regex: new RegExp('^' + cropName + '$', 'i') }
      });

      fields = fieldDocs.map(f => ({
        fieldId: f._id,
        farm: f.farm,
        field: f.field,
        acres: f.acres || 0
      }));
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields found for this crop code'
      });
    }

    // Parse crop and year from cropCode
    const codeParts = cropCode.match(/^(.+?)(\d{2})$/);
    const crop = codeParts ? codeParts[1].replace(/-/g, ' ') : '';
    const year = codeParts ? 2000 + parseInt(codeParts[2]) : new Date().getFullYear();

    const expense = new CropExpense({
      cropCode,
      crop,
      year,
      date: new Date(date),
      description,
      category,
      costPerAcre: parseFloat(costPerAcre),
      fields,
      paidBy: paidBy || 'split-by-lease',
      vendor: vendor || '',
      invoiceNumber: invoiceNumber || '',
      status: status || 'projected',
      notes: notes || ''
    });

    await expense.save();

    // Also update the field-level costs (aggregate)
    await updateFieldCosts(fields.map(f => f.fieldId), year);

    res.status(201).json({
      success: true,
      expense,
      message: `Expense "${description}" added to ${fields.length} fields at $${costPerAcre}/ac`
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, error: 'Failed to create expense: ' + error.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await CropExpense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    // Re-aggregate field costs
    const fieldIds = expense.fields.map(f => f.fieldId);
    await updateFieldCosts(fieldIds, expense.year);

    res.json({ success: true, expense });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await CropExpense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const fieldIds = expense.fields.map(f => f.fieldId);
    const year = expense.year;

    await CropExpense.findByIdAndDelete(req.params.id);

    // Re-aggregate field costs
    await updateFieldCosts(fieldIds, year);

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
});

// Helper: re-aggregate all expenses for given fields into their costs object
async function updateFieldCosts(fieldIds, year) {
  const cropField = `crop${year}`;

  for (const fieldId of fieldIds) {
    const expenses = await CropExpense.find({ 'fields.fieldId': fieldId, year });

    // Sum by category
    const totals = {
      seed: 0, fertilizer: 0, chemicals: 0, cropInsurance: 0,
      fuelOil: 0, repairs: 0, customHire: 0, landRent: 0,
      dryingHauling: 0, taxes: 0, misc: 0
    };

    expenses.forEach(exp => {
      if (totals.hasOwnProperty(exp.category)) {
        totals[exp.category] += exp.costPerAcre;
      }
    });

    // Update the field's costs object
    await CroppingField.findByIdAndUpdate(fieldId, { costs: totals });
  }
}

module.exports = router;
