const Grade      = require('../models/Grade');
const Enrollment = require('../models/Enrollment');

// GET /api/v1/student/dashboard
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    const [enrolledCount, gradeCount, grades] = await Promise.all([
      Enrollment.countDocuments({ student: studentId, status: 'enrolled' }),
      Grade.countDocuments({ student: studentId, status: { $ne: 'draft' } }),
      Grade.find({ student: studentId, status: { $ne: 'draft' } })
        .select('gpa semester course')
        .populate('course', 'creditHours'),
    ]);

    // Credit-weighted CGPA
    let totalGradePoints = 0;
    let totalCredits     = 0;
    const semesterSet    = new Set();

    grades.forEach((g) => {
      const credits = g.course?.creditHours || 1;
      totalGradePoints += (g.gpa || 0) * credits;
      totalCredits     += credits;
      if (g.semester) semesterSet.add(g.semester);
    });

    const cgpa = totalCredits > 0
      ? (totalGradePoints / totalCredits).toFixed(2)
      : '0.00';

    res.json({
      cgpa,
      enrolledCourses:    enrolledCount,
      gradedCourses:      gradeCount,
      completedSemesters: semesterSet.size,
      currentSemester:    req.user.semester || null,
    });
  } catch (err) {
    console.error('getStudentDashboardStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
