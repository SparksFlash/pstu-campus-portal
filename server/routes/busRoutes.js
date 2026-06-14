const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllBuses, getBusById, createBus, updateBus, deleteBus
} = require('../controllers/busController');

router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.post('/', auth, allowRoles('admin'), requireFields('busNumber', 'routeName'), createBus);
router.put('/:id', auth, allowRoles('admin'), updateBus);
router.delete('/:id', auth, allowRoles('admin'), deleteBus);

module.exports = router;