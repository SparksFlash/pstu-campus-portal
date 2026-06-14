const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const {
  getAvailableCourses,
  getEnrollments,
  enrollCourse,
  dropCourse,
} = require('../controllers/enrollmentController');

router.get('/available', auth, allowRoles('student'), getAvailableCourses);
router.get('/',          auth, allowRoles('student'), getEnrollments);
router.post('/',         auth, allowRoles('student'), enrollCourse);
router.delete('/:id',    auth, allowRoles('student'), dropCourse);

module.exports = router;
