const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const {
  getDashboardStats,
  getAuditLogs,
  toggleUserActive,
  getAllUsers,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(auth, allowRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);

module.exports = router;
