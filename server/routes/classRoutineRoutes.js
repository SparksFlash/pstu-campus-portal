const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { getRoutine, updateEntry, clearEntry } = require('../controllers/classRoutineController');

router.get('/',        auth, getRoutine);
router.patch('/entry', auth, allowRoles('admin'), updateEntry);
router.delete('/entry', auth, allowRoles('admin'), clearEntry);

module.exports = router;
