const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { getStudentDashboardStats } = require('../controllers/studentController');

router.get('/dashboard', auth, allowRoles('student'), getStudentDashboardStats);

module.exports = router;
