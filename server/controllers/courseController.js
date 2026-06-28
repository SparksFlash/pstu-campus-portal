const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const { getEmbedding } = require('../utils/embeddings');

const embedCourse = (course) => {
  if (!process.env.GEMINI_API_KEY) return;
  const text = `Course: ${course.code} - ${course.title}. Semester: ${course.semester}. ${course.description || ''}`;
  getEmbedding(text)
    .then(vec => Course.findByIdAndUpdate(course._id, { embedding: vec }))
    .catch(() => {});
};

exports.getAllCourses = async (req, res) => {
  try {
    const { faculty, semester } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (semester) filter.semester = semester;
    const courses = await Course.find(filter).populate('faculty teacher students');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('faculty teacher students');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, title, faculty, semester, creditHours, teacher } = req.body;
    const course = new Course({ code, title, faculty, semester, creditHours, teacher });
    await course.save();
    embedCourse(course);
    AuditLog.create({
      actor: req.user._id, actorRole: req.user.role,
      action: 'CREATE_COURSE', resource: 'Course', resourceId: course._id,
      after: { code, title, semester, creditHours },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    }).catch(() => {});
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('faculty teacher students');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    embedCourse(course);
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    AuditLog.create({
      actor: req.user._id, actorRole: req.user.role,
      action: 'DELETE_COURSE', resource: 'Course', resourceId: req.params.id,
      before: { code: course.code, title: course.title },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    }).catch(() => {});
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addStudentToCourse = async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { $addToSet: { students: studentId } }, { new: true }).populate('students');
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get teacher's courses (faculty-restricted)
exports.getTeacherCourses = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this' });
    }

    const courses = await Course.find({ faculty: req.user.faculty })
      .populate('faculty teacher students')
      .sort({ semester: 1, code: 1 });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get students enrolled in a specific course
exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('students')
      .populate('faculty');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If teacher, only allow if course is from their faculty
    if (req.user?.role === 'teacher' && course.faculty?._id?.toString() !== req.user.faculty?.toString()) {
      return res.status(403).json({ message: 'You can only view students from your faculty courses' });
    }

    res.json(course.students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};