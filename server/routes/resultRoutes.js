const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const {
  getAllResults, getStudentResults, generateResult, updateResult, deleteResult
} = require('../controllers/resultController');

router.get('/', auth, allowRoles('admin', 'teacher'), getAllResults);
router.get('/student/:studentId', auth, getStudentResults);
router.post('/generate', auth, allowRoles('teacher', 'admin'), generateResult);
router.put('/:id', auth, allowRoles('admin', 'teacher'), updateResult);
router.delete('/:id', auth, allowRoles('admin', 'superadmin'), deleteResult);

module.exports = router;