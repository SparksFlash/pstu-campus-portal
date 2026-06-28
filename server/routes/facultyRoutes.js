const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllFaculties, getFacultyById, createFaculty, updateFaculty, deleteFaculty
} = require('../controllers/facultyController');

router.get('/', getAllFaculties);
router.get('/:id', getFacultyById);
router.post('/', auth, allowRoles('admin', 'superadmin'), requireFields('name', 'code'), createFaculty);
router.put('/:id', auth, allowRoles('admin', 'superadmin'), updateFaculty);
router.delete('/:id', auth, allowRoles('admin', 'superadmin'), deleteFaculty);

module.exports = router;