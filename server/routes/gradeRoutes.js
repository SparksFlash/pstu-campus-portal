const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllGrades, getStudentGrades, addGrade, updateGrade, deleteGrade,
  recordGrade, getStudentResults, getTeacherStudents
} = require('../controllers/gradeController');

// Important: Place specific routes before generic /:id routes
router.post('/record-grade', auth, allowRoles('teacher'), recordGrade); // Teacher records student grade
router.get('/my-results', auth, allowRoles('student'), getStudentResults); // Student views their results
router.get('/my-students', auth, allowRoles('teacher'), getTeacherStudents); // Teacher views their faculty's students

// Legacy endpoints
router.get('/', auth, allowRoles('admin', 'teacher'), getAllGrades);
router.get('/student/:studentId', auth, getStudentGrades);
router.post('/', auth, allowRoles('teacher', 'admin'), requireFields('student', 'course', 'faculty', 'obtainedMarks', 'totalMarks'), addGrade);
router.put('/:id', auth, allowRoles('teacher', 'admin'), updateGrade);
router.delete('/:id', auth, allowRoles('teacher', 'admin'), deleteGrade);

module.exports = router;