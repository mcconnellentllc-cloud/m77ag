const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const m77FieldController = require('../controllers/m77FieldController');

// All routes require authentication.
// Reads: any authenticated user.
// Writes: admin or employee (isStaff).

router.get('/', authenticate, m77FieldController.listFields);
router.get('/filter-options', authenticate, m77FieldController.getFilterOptions);
router.get('/:id', authenticate, m77FieldController.getField);

router.post('/', authenticate, isStaff, m77FieldController.createField);
router.put('/:id', authenticate, isStaff, m77FieldController.updateField);
router.delete('/:id', authenticate, isStaff, m77FieldController.deleteField);

module.exports = router;
