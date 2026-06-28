const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { register, getAll, updateStatus } = require('../controllers/institutionController');

router.post('/', register);
router.get('/', auth, allowRoles('superadmin'), getAll);
router.patch('/:id/status', auth, allowRoles('superadmin'), updateStatus);

module.exports = router;
