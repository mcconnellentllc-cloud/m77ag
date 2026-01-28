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

    const {
      year, hadCalf, calfSurvived, calfTag, calfSex, calfBirthDate, birthWeight,
      weaningWeight, weaningDate, sireTag, calvingEase, calfVigor, cowBCS,
      maternalScore, comments, notes
    } = req.body;

    // Check if year record already exists
    const existingIndex = cattle.annualCalvingRecords.findIndex(r => r.year === year);

    const record = {
      year,
      hadCalf: hadCalf !== false,
      calfSurvived: calfSurvived !== false,
      calfTag,
      calfSex,
      calfBirthDate: calfBirthDate ? new Date(calfBirthDate) : undefined,
      birthWeight: birthWeight ? parseInt(birthWeight) : undefined,
      weaningWeight: weaningWeight ? parseInt(weaningWeight) : undefined,
      weaningDate: weaningDate ? new Date(weaningDate) : undefined,
      sireTag,
      calvingEase: calvingEase ? parseInt(calvingEase) : undefined,
      calfVigor: calfVigor ? parseInt(calfVigor) : undefined,
      cowBCS: cowBCS ? parseInt(cowBCS) : undefined,
      maternalScore: maternalScore ? parseInt(maternalScore) : undefined,
      comments,
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

/**
 * POST /api/cattle/import/csv
 * Import cattle from the CSV file in /data/imports/cattle.csv
 */
router.post('/import/csv', isAdmin, async (req, res) => {
  const fs = require('fs');
  const path = require('path');

  try {
    const csvPath = path.join(__dirname, '../../data/imports/cattle.csv');

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, message: 'CSV file not found at /data/imports/cattle.csv' });
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      records.push(record);
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const row of records) {
      const tagNumber = row.tag_number;

      if (!tagNumber) {
        errors++;
        continue;
      }

      // Check if already exists
      const exists = await Cattle.findOne({ tagNumber: String(tagNumber) });
      if (exists) {
        skipped++;
        continue;
      }

      // Build calving records
      const annualCalvingRecords = [];

      // 2024 calving - "31" means had calf that survived to weaning
      if (row.calf_wt_2024 === '31') {
        annualCalvingRecords.push({
          year: 2024,
          hadCalf: true,
          calfSurvived: true,
          notes: 'Calf survived to weaning'
        });
      }

      // 2023 weaning weight
      const ww2023 = parseInt(row.ww_2023);
      if (ww2023 > 0) {
        annualCalvingRecords.push({
          year: 2023,
          hadCalf: true,
          calfSurvived: true,
          weaningWeight: ww2023
        });
      }

      // Calculate birth date from birth_year
      let birthDate = null;
      const birthYear = parseInt(row.birth_year);
      if (birthYear > 0) {
        birthDate = new Date(`${birthYear}-03-01`);
      } else {
        const tag = parseInt(tagNumber);
        if (tag >= 6000 && tag < 7000) {
          birthDate = new Date('2016-03-01');
        } else if (tag >= 2316 && tag <= 2325) {
          birthDate = new Date('2023-03-01');
        } else if (tag >= 2426 && tag <= 2432) {
          birthDate = new Date('2024-03-01');
        } else if (tag >= 2201 && tag <= 2215) {
          birthDate = new Date('2022-03-01');
        } else {
          birthDate = new Date('2018-03-01');
        }
      }

      // Map tag color
      const colorMap = {
        'Yellow': 'Yellow', 'Blue': 'Blue', 'Green': 'Green',
        'White': 'White', 'Purple': 'Purple', 'Orange': 'Orange',
        'Red': 'Red', 'Pink': 'Pink', 'Black': 'Black'
      };

      const cattleData = {
        tagNumber: String(tagNumber),
        type: 'cow',
        breed: 'Angus',
        owner: row.owner || 'M77',
        tagColor: colorMap[row.tag_color] || 'Other',
        calvingGroup: row.group_name === 'SPRING' ? 'SPRING' : 'FALL',
        birthDate: birthDate,
        status: 'active',
        annualCalvingRecords: annualCalvingRecords.length > 0 ? annualCalvingRecords : undefined
      };

      // Add dam info if available
      if (row.dam_tag && row.dam_tag !== 'NT' && row.dam_tag !== '') {
        cattleData.dam = { tagNumber: String(row.dam_tag) };
      }

      // Add sire info if available (sire column contains tag number, not color)
      if (row.sire && row.sire !== '' && row.sire !== 'NT') {
        cattleData.sire = { tagNumber: String(row.sire) };
      }

      // Add yearling weight if available
      const yw = parseInt(row.yearling_weight);
      if (yw > 0) {
        cattleData.weightRecords = [{
          date: new Date(`${birthYear + 1}-10-01`),
          weight: yw,
          notes: 'Yearling weight'
        }];
      }

      try {
        const cattle = new Cattle(cattleData);
        await cattle.save();
        imported++;
      } catch (err) {
        errors++;
        errorDetails.push({ tag: tagNumber, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`,
      data: { imported, skipped, errors, errorDetails }
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cattle/seed/calves-2026
 * Seed 2026 calving records for cows 2318 and 2206
 */
router.post('/seed/calves-2026', isAdmin, async (req, res) => {
  try {
    const { force } = req.body;

    // 2026 calving records - cows that calved in 2026
    const calvingRecords2026 = [
      {
        tagNumber: '2318',
        record: {
          year: 2026,
          hadCalf: true,
          calfSurvived: true,
          calfTag: '2318-C26',
          calfSex: 'heifer',
          calfBirthDate: new Date('2026-03-15'),
          notes: '2026 spring calf'
        }
      },
      {
        tagNumber: '2206',
        record: {
          year: 2026,
          hadCalf: true,
          calfSurvived: true,
          calfTag: '2206-C26',
          calfSex: 'heifer',
          calfBirthDate: new Date('2026-03-10'),
          notes: '2026 spring calf'
        }
      }
    ];

    let updated = 0;
    let notFound = 0;
    const results = [];

    for (const item of calvingRecords2026) {
      const cattle = await Cattle.findOne({ tagNumber: item.tagNumber });

      if (!cattle) {
        notFound++;
        results.push({ tag: item.tagNumber, status: 'not found' });
        continue;
      }

      // Initialize annualCalvingRecords if it doesn't exist
      if (!cattle.annualCalvingRecords) {
        cattle.annualCalvingRecords = [];
      }

      // Check if 2026 record already exists
      const existingIndex = cattle.annualCalvingRecords.findIndex(r => r.year === 2026);

      if (existingIndex >= 0) {
        if (force) {
          cattle.annualCalvingRecords[existingIndex] = item.record;
          await cattle.save();
          results.push({ tag: item.tagNumber, status: 'updated' });
          updated++;
        } else {
          results.push({ tag: item.tagNumber, status: 'exists (use force=true to update)' });
        }
      } else {
        cattle.annualCalvingRecords.push(item.record);
        await cattle.save();
        results.push({ tag: item.tagNumber, status: 'added' });
        updated++;
      }
    }

    res.json({
      success: true,
      message: `2026 calving records: ${updated} updated, ${notFound} not found`,
      data: { updated, notFound, results }
    });

  } catch (error) {
    console.error('Error seeding 2026 calves:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
