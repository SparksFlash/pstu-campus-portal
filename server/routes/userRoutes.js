const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
const { getProfile, getAllUsers, updateProfile, changePassword, uploadProfilePhoto, getStudentsList, getUsersByRole } = require('../controllers/userController');

router.get('/me', auth, getProfile);
router.get('/profile/me', auth, getProfile);
router.put('/profile/me', auth, updateProfile);
router.put('/profile/change-password', auth, changePassword);
router.post('/profile/photo', auth, upload.single('image'), uploadProfilePhoto);
// Admin: list users (supports ?role=teacher)
router.get('/', auth, allowRoles('admin', 'superadmin'), getAllUsers);
// role-based users (teachers allowed to request students)
router.get('/role/:role', auth, allowRoles('teacher', 'admin'), getUsersByRole);
// Teachers and admins: fetch students. Teachers see students in their faculty only.
router.get('/students', auth, allowRoles('teacher', 'admin'), getStudentsList);
// Admin helper: fetch teachers and students together
router.get('/admin-lists', auth, allowRoles('admin', 'superadmin'), require('../controllers/userController').getTeachersAndStudents);

module.exports = router;
