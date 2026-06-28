const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, addStudentToCourse, getTeacherCourses, getCourseStudents
} = require('../controllers/courseController');

// Important: Place specific routes before generic /:id routes
router.get('/my-courses', auth, allowRoles('teacher'), getTeacherCourses); // Teacher gets their faculty's courses

// Generic routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.get('/:id/students', auth, getCourseStudents); // Get students in a course
router.post('/', auth, allowRoles('admin', 'superadmin', 'teacher'), requireFields('code', 'title', 'faculty', 'semester'), createCourse);
router.put('/:id', auth, allowRoles('admin', 'superadmin', 'teacher'), updateCourse);
router.delete('/:id', auth, allowRoles('admin', 'superadmin'), deleteCourse);
router.post('/:id/enroll', auth, allowRoles('teacher', 'admin', 'superadmin'), addStudentToCourse);

module.exports = router;