const express = require('express');
const router = express.Router();
const c = require('../controllers/enterpriseBooksController');

// Books for stand-alone enterprises (Lueking): admin only.
router.use(require('../middleware/auth').adminOnly);

router.get('/:enterprise', c.list);
router.post('/:enterprise', c.create);
router.put('/:enterprise/:id', c.update);
router.delete('/:enterprise/:id', c.remove);

module.exports = router;
