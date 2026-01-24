const express = require('express');
const router = express.Router();
const Cattle = require('../models/cattle');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/cattle
 * Get all cattle with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      status = 'active',
      type,
      pasture,
      search,
      limit = 100,
      skip = 0,
      sortBy = 'tagNumber',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (pasture) query.currentPasture = pasture;
    if (search) {
      query.$or = [
        { tagNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cattle = await Cattle.find(query)
      .sort(sortOptions)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('createdBy', 'name')
      .populate('lastModifiedBy', 'name');

    const total = await Cattle.countDocuments(query);

    res.json({
      success: true,
      data: cattle,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching cattle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/summary
 * Get herd summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await Cattle.getHerdSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching herd summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/attention
 * Get cattle needing attention (calving due, in withdrawal, etc.)
 */
router.get('/attention', async (req, res) => {
  try {
    const attention = await Cattle.getNeedingAttention();
    res.json({ success: true, data: attention });
  } catch (error) {
    console.error('Error fetching attention items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/:id
 * Get single cattle record
 */
router.get('/:id', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id)
      .populate('dam.cattleId', 'tagNumber name')
      .populate('sire.cattleId', 'tagNumber name')
      .populate('weightRecords.recordedBy', 'name')
      .populate('healthRecords.recordedBy', 'name');

    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    res.json({ success: true, data: cattle });
  } catch (error) {
    console.error('Error fetching cattle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle
 * Create new cattle record
 */
router.post('/', async (req, res) => {
  try {
    const cattleData = {
      ...req.body,
      createdBy: req.userId,
      lastModifiedBy: req.userId
    };

    const cattle = new Cattle(cattleData);
    await cattle.save();

    res.status(201).json({ success: true, data: cattle });
  } catch (error) {
    console.error('Error creating cattle:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tag number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/cattle/:id
 * Update cattle record
 */
router.put('/:id', async (req, res) => {
  try {
    const cattle = await Cattle.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastModifiedBy: req.userId
      },
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    res.json({ success: true, data: cattle });
  } catch (error) {
    console.error('Error updating cattle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/cattle/:id
 * Delete cattle record (admin only)
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const cattle = await Cattle.findByIdAndDelete(req.params.id);

    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    res.json({ success: true, message: 'Cattle deleted successfully' });
  } catch (error) {
    console.error('Error deleting cattle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/weight
 * Add weight record (employee-friendly)
 */
router.post('/:id/weight', async (req, res) => {
  try {
    const { weight, condition, notes, date } = req.body;

    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    cattle.weightRecords.push({
      date: date || new Date(),
      weight,
      condition,
      notes,
      recordedBy: req.userId
    });
    cattle.lastModifiedBy = req.userId;

    await cattle.save();

    res.json({ success: true, data: cattle, message: 'Weight record added' });
  } catch (error) {
    console.error('Error adding weight record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/health
 * Add health record (employee-friendly)
 */
router.post('/:id/health', async (req, res) => {
  try {
    const healthRecord = {
      ...req.body,
      date: req.body.date || new Date(),
      recordedBy: req.userId
    };

    // Calculate withdrawal date if withdrawalDays provided
    if (healthRecord.withdrawalDays) {
      const date = new Date(healthRecord.date);
      date.setDate(date.getDate() + healthRecord.withdrawalDays);
      healthRecord.withdrawalDate = date;
    }

    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    cattle.healthRecords.push(healthRecord);
    cattle.lastModifiedBy = req.userId;

    await cattle.save();

    res.json({ success: true, data: cattle, message: 'Health record added' });
  } catch (error) {
    console.error('Error adding health record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/breeding
 * Add breeding record
 */
router.post('/:id/breeding', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    cattle.breedingRecords.push({
      ...req.body,
      date: req.body.date || new Date(),
      recordedBy: req.userId
    });
    cattle.lastModifiedBy = req.userId;

    await cattle.save();

    res.json({ success: true, data: cattle, message: 'Breeding record added' });
  } catch (error) {
    console.error('Error adding breeding record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/calving
 * Record calving event - creates new calf record and updates dam
 */
router.post('/:id/calving', async (req, res) => {
  try {
    const dam = await Cattle.findById(req.params.id);
    if (!dam) {
      return res.status(404).json({ success: false, message: 'Dam not found' });
    }

    const { calfTag, calfSex, birthWeight, birthEase, sireTag, notes, date } = req.body;

    // Create new calf record
    const calf = new Cattle({
      tagNumber: calfTag,
      type: calfSex === 'heifer' ? 'heifer' : 'calf',
      birthDate: date || new Date(),
      birthWeight,
      birthEase,
      birthType: 'single',
      dam: {
        tagNumber: dam.tagNumber,
        cattleId: dam._id
      },
      sire: {
        tagNumber: sireTag
      },
      status: 'active',
      createdBy: req.userId,
      lastModifiedBy: req.userId
    });

    await calf.save();

    // Update dam's calving history
    dam.calvingHistory.push({
      date: date || new Date(),
      calfTag,
      calfSex,
      birthWeight,
      birthEase,
      notes,
      calfId: calf._id
    });
    dam.lastModifiedBy = req.userId;

    await dam.save();

    res.status(201).json({
      success: true,
      data: { calf, dam },
      message: 'Calving recorded successfully'
    });
  } catch (error) {
    console.error('Error recording calving:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Calf tag number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/:id/offspring
 * Get all offspring of a cow or bull
 */
router.get('/:id/offspring', async (req, res) => {
  try {
    const offspring = await Cattle.getOffspring(req.params.id);
    res.json({ success: true, data: offspring });
  } catch (error) {
    console.error('Error fetching offspring:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/:id/production
 * Get production report for a cow
 */
router.get('/:id/production', async (req, res) => {
  try {
    const report = await Cattle.getProductionReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching production report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/:id/progeny
 * Get progeny report for a bull
 */
router.get('/:id/progeny', async (req, res) => {
  try {
    const report = await Cattle.getBullProgenyReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Bull not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching progeny report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/cattle/genetics/summary
 * Get genetics summary for the herd
 */
router.get('/genetics/summary', async (req, res) => {
  try {
    const summary = await Cattle.getGeneticsSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching genetics summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/genetics
 * Add or update genetic test results
 */
router.post('/:id/genetics', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    // Update genetics object
    cattle.genetics = {
      ...cattle.genetics,
      ...req.body,
      tested: true
    };
    cattle.lastModifiedBy = req.userId;

    await cattle.save();

    res.json({ success: true, data: cattle, message: 'Genetic data updated' });
  } catch (error) {
    console.error('Error updating genetics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/annual-calving
 * Add annual calving record with weaning info
 */
router.post('/:id/annual-calving', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) {
      return res.status(404).json({ success: false, message: 'Cattle not found' });
    }

    const { year, hadCalf, calfSurvived, calfTag, calfSex, weaningWeight, weaningDate, sireTag, notes } = req.body;

    // Check if year record already exists
    const existingIndex = cattle.annualCalvingRecords.findIndex(r => r.year === year);

    const record = {
      year,
      hadCalf: hadCalf !== false,
      calfSurvived: calfSurvived !== false,
      calfTag,
      calfSex,
      weaningWeight: weaningWeight ? parseInt(weaningWeight) : undefined,
      weaningDate: weaningDate ? new Date(weaningDate) : undefined,
      sireTag,
      notes
    };

    if (existingIndex >= 0) {
      // Update existing
      cattle.annualCalvingRecords[existingIndex] = record;
    } else {
      // Add new
      cattle.annualCalvingRecords.push(record);
    }

    cattle.lastModifiedBy = req.userId;
    await cattle.save();

    res.json({ success: true, data: cattle, message: 'Calving record updated' });
  } catch (error) {
    console.error('Error updating calving record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/:id/link-offspring
 * Link an offspring to this parent (updates offspringIds array)
 */
router.post('/:id/link-offspring', async (req, res) => {
  try {
    const { offspringId } = req.body;

    const parent = await Cattle.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    const offspring = await Cattle.findById(offspringId);
    if (!offspring) {
      return res.status(404).json({ success: false, message: 'Offspring not found' });
    }

    // Add to parent's offspring array if not already there
    if (!parent.offspringIds.includes(offspringId)) {
      parent.offspringIds.push(offspringId);
      parent.lastModifiedBy = req.userId;
      await parent.save();
    }

    res.json({ success: true, data: parent, message: 'Offspring linked' });
  } catch (error) {
    console.error('Error linking offspring:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
