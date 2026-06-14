const Enrollment = require('../models/Enrollment');
const Course    = require('../models/Course');
const Grade     = require('../models/Grade');

// GET /api/v1/enrollments/available
exports.getAvailableCourses = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (req.user.faculty) filter.faculty = req.user.faculty;
    if (semester)         filter.semester = parseInt(semester);

    const [courses, myEnrollments] = await Promise.all([
      Course.find(filter)
        .populate('faculty', 'name')
        .populate('teacher', 'name')
        .sort({ semester: 1, code: 1 }),
      Enrollment.find({ student: req.user._id, status: 'enrolled' }).select('course'),
    ]);

    const enrolledIds = new Set(myEnrollments.map(e => e.course.toString()));
    const result = courses.map(c => ({ ...c.toObject(), isEnrolled: enrolledIds.has(c._id.toString()) }));
    res.json(result);
  } catch (err) {
    console.error('getAvailableCourses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/v1/enrollments
exports.getEnrollments = async (req, res) => {
  try {
    const { semester, status } = req.query;
    const filter = { student: req.user._id };
    if (status)   filter.status   = status;
    if (semester) filter.semester = parseInt(semester);

    const enrollments = await Enrollment.find(filter)
      .populate('course', 'code title creditHours semester faculty description')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/v1/enrollments
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId, academicYear } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.faculty && course.faculty.toString() !== req.user.faculty.toString()) {
      return res.status(403).json({ message: 'You can only enroll in courses from your faculty' });
    }

    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      if (existing.status === 'enrolled') {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }
      existing.status     = 'enrolled';
      existing.enrolledAt = Date.now();
      if (academicYear) existing.academicYear = academicYear;
      await existing.save();
      const populated = await existing.populate('course', 'code title creditHours semester');
      return res.json(populated);
    }

    const enrollment = new Enrollment({
      student:      req.user._id,
      course:       courseId,
      semester:     course.semester,
      academicYear: academicYear || String(new Date().getFullYear()),
    });
    await enrollment.save();
    const populated = await enrollment.populate('course', 'code title creditHours semester');
    res.status(201).json(populated);
  } catch (err) {
    console.error('enrollCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/v1/enrollments/:id
exports.dropCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.user._id });
    if (!enrollment)                    return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status === 'dropped') return res.status(400).json({ message: 'Already dropped' });

    enrollment.status = 'dropped';
    await enrollment.save();
    res.json({ message: 'Course dropped successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
