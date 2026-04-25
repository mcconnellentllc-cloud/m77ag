const M77Field = require('../models/m77Field');

const ALLOWED_FILTERS = ['county', 'irrigation', 'rotationGroup', 'owner', 'status', 'crop2026'];

function buildQuery(reqQuery) {
  const query = {};
  for (const key of ALLOWED_FILTERS) {
    if (reqQuery[key] !== undefined && reqQuery[key] !== '') {
      query[key] = reqQuery[key];
    }
  }
  if (reqQuery.search) {
    const rx = new RegExp(reqQuery.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: rx },
      { landlordName: rx },
      { rotationGroup: rx }
    ];
  }
  return query;
}

exports.listFields = async (req, res) => {
  try {
    const query = buildQuery(req.query);
    const fields = await M77Field.find(query).sort({ name: 1 });
    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Error listing M77 fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing fields',
      error: error.message
    });
  }
};

exports.getField = async (req, res) => {
  try {
    const field = await M77Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error fetching M77 field:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field',
      error: error.message
    });
  }
};

exports.createField = async (req, res) => {
  try {
    const field = new M77Field(req.body);
    await field.save();
    res.status(201).json({
      success: true,
      message: 'Field created',
      field
    });
  } catch (error) {
    console.error('Error creating M77 field:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating field',
      error: error.message
    });
  }
};

exports.updateField = async (req, res) => {
  try {
    // jd_field_id is reserved for Phase 2 sync; do not allow manual edits via update.
    const update = { ...req.body };
    delete update.jd_field_id;

    const field = await M77Field.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }
    res.json({ success: true, message: 'Field updated', field });
  } catch (error) {
    console.error('Error updating M77 field:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating field',
      error: error.message
    });
  }
};

exports.deleteField = async (req, res) => {
  try {
    const field = await M77Field.findByIdAndDelete(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }
    res.json({ success: true, message: 'Field deleted' });
  } catch (error) {
    console.error('Error deleting M77 field:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting field',
      error: error.message
    });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    const [counties, rotationGroups, crops] = await Promise.all([
      M77Field.distinct('county'),
      M77Field.distinct('rotationGroup'),
      M77Field.distinct('crop2026')
    ]);
    res.json({
      success: true,
      counties: counties.filter(Boolean).sort(),
      rotationGroups: rotationGroups.filter(Boolean).sort(),
      crops: crops.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};
