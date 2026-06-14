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
router.post('/', auth, allowRoles('admin'), requireFields('name', 'code'), createFaculty);
router.put('/:id', auth, allowRoles('admin'), updateFaculty);
router.delete('/:id', auth, allowRoles('admin'), deleteFaculty);

module.exports = router;