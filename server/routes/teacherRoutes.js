const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const {
  debugCheck,
  runDiagnostics,
  getStudentsBySemester,
  getStudentDetails,
  enterMarks,
  bulkEnterMarks,
  generateMarksheet,
  generateStudentResult,
  getTeacherStats,
  getSemesterPublishStatus,
  publishSemesterResults,
  unpublishSemesterResults,
  bulkCSVImport,
} = require('../controllers/teacherController');

/**
 * Teacher Workflow Routes
 * All routes require teacher role authentication
 */

// Debug endpoints
router.get(
  '/debug',
  auth,
  allowRoles('teacher'),
  debugCheck
);

router.get(
  '/diagnostics',
  auth,
  allowRoles('teacher'),
  runDiagnostics
);

// Student Management
router.get(
  '/students/semester/:semester',
  auth,
  allowRoles('teacher'),
  getStudentsBySemester
);

router.get(
  '/student/:studentId/semester/:semester',
  auth,
  allowRoles('teacher'),
  getStudentDetails
);

// Marks Entry
router.post(
  '/marks/enter',
  auth,
  allowRoles('teacher'),
  enterMarks
);

router.post(
  '/marks/bulk-enter',
  auth,
  allowRoles('teacher'),
  bulkEnterMarks
);

// Marksheet & Result Generation
router.get(
  '/marksheet/:studentId/semester/:semester',
  auth,
  allowRoles('teacher'),
  generateMarksheet
);

router.get(
  '/result/:studentId',
  auth,
  allowRoles('teacher'),
  generateStudentResult
);

// Stats
router.get('/stats', auth, allowRoles('teacher'), getTeacherStats);

// Publish / Unpublish
router.get('/publish/:semester', auth, allowRoles('teacher'), getSemesterPublishStatus);
router.post('/publish/:semester', auth, allowRoles('teacher'), publishSemesterResults);
router.post('/unpublish/:semester', auth, allowRoles('teacher'), unpublishSemesterResults);

// Bulk CSV import
router.post('/marks/bulk-csv', auth, allowRoles('teacher'), bulkCSVImport);

module.exports = router;
