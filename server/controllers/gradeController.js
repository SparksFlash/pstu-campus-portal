const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User');
const { getGradeForPercentage, calculatePercentage } = require('../utils/gradingScale');

exports.getAllGrades = async (req, res) => {
  try {
    const { student, course, semester } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (course) filter.course = course;
    if (semester) filter.semester = semester;
    const grades = await Grade.find(filter).populate('student course faculty teacher');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId }).populate('course');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addGrade = async (req, res) => {
  try {
    const { student, course, faculty, semester, obtainedMarks, totalMarks, teacher } = req.body;
    const percentage = calculatePercentage(obtainedMarks, totalMarks);
    const { grade: gradePoint, gpa } = getGradeForPercentage(percentage);

    let grade = await Grade.findOne({ student, course, semester });
    if (grade) {
      grade.obtainedMarks = obtainedMarks;
      grade.totalMarks = totalMarks;
      grade.percentage = percentage;
      grade.grade = gradePoint;
      grade.gpa = gpa;
      grade.updatedAt = Date.now();
      await grade.save();
    } else {
      grade = new Grade({ student, course, faculty, semester, obtainedMarks, totalMarks, percentage, grade: gradePoint, gpa, teacher });
      await grade.save();
    }
    res.status(201).json(grade);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const { obtainedMarks, totalMarks } = req.body;
    const percentage = calculatePercentage(obtainedMarks, totalMarks);
    const { grade: gradePoint, gpa } = getGradeForPercentage(percentage);
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { obtainedMarks, totalMarks, percentage, grade: gradePoint, gpa, updatedAt: Date.now() },
      { new: true }
    );
    res.json(grade);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Teacher: record a grade for a student in a course
exports.recordGrade = async (req, res) => {
  try {
    const { student, course, semester, obtainedMarks, totalMarks } = req.body;
    const teacher = req.user._id;

    // Validate inputs
    if (!student || !course || !obtainedMarks || totalMarks === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (obtainedMarks < 0 || obtainedMarks > totalMarks || totalMarks <= 0) {
      return res.status(400).json({ message: 'Invalid marks' });
    }

    // Get course and student info
    const courseDoc = await Course.findById(course).populate('faculty');
    const studentDoc = await User.findById(student);
    if (!courseDoc || !studentDoc) {
      return res.status(404).json({ message: 'Course or Student not found' });
    }

    // Authorization: teacher must be from same faculty
    if (req.user.faculty && courseDoc.faculty._id.toString() !== req.user.faculty.toString()) {
      return res.status(403).json({ message: 'You can only grade courses from your faculty' });
    }

    // Calculate percentage and grade using grading scale
    const percentage = calculatePercentage(obtainedMarks, totalMarks);
    const { grade, gpa } = getGradeForPercentage(percentage);

    // Check if grade exists
    let gradeDoc = await Grade.findOne({ student, course, semester });
    if (gradeDoc) {
      // Update existing
      gradeDoc.obtainedMarks = obtainedMarks;
      gradeDoc.totalMarks = totalMarks;
      gradeDoc.percentage = percentage;
      gradeDoc.grade = grade;
      gradeDoc.gpa = gpa;
      gradeDoc.teacher = teacher;
      gradeDoc.updatedAt = Date.now();
      await gradeDoc.save();
    } else {
      // Create new
      gradeDoc = new Grade({
        student,
        course,
        semester: semester || 1,
        faculty: courseDoc.faculty._id,
        obtainedMarks,
        totalMarks,
        percentage,
        grade,
        gpa,
        teacher,
      });
      await gradeDoc.save();
    }

    const result = await gradeDoc.populate('course student');
    res.json(result);
  } catch (err) {
    console.error('recordGrade error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: fetch their grades and results
exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { semester } = req.query;

    // Get all grades for this student (only published; old entries with no status also visible)
    const filter = { student: studentId, status: { $ne: 'draft' } };
    if (semester) filter.semester = semester;

    const grades = await Grade.find(filter)
      .populate('course', 'code title creditHours')
      .populate('faculty', 'name')
      .sort({ semester: 1, createdAt: 1 });

    if (!grades.length) {
      return res.json({ message: 'No grades found', results: {} });
    }

    // Group by semester and calculate SGPA
    const resultsBySemester = {};
    grades.forEach((g) => {
      const sem = g.semester || 1;
      if (!resultsBySemester[sem]) {
        resultsBySemester[sem] = { 
          grades: [], 
          semesterGPA: 0, 
          totalCredits: 0,
          totalGradePoints: 0 
        };
      }
      
      const credits = g.course?.creditHours || 1;
      resultsBySemester[sem].grades.push({
        course: g.course.code,
        title: g.course.title,
        credits,
        obtainedMarks: g.obtainedMarks,
        totalMarks: g.totalMarks,
        percentage: g.percentage,
        grade: g.grade,
        gpa: g.gpa,
      });
      
      resultsBySemester[sem].totalCredits += credits;
      resultsBySemester[sem].totalGradePoints += (g.gpa || 0) * credits;
    });

    // Calculate semester GPAs
    Object.keys(resultsBySemester).forEach((sem) => {
      const credits = resultsBySemester[sem].totalCredits || 1;
      resultsBySemester[sem].semesterGPA = (resultsBySemester[sem].totalGradePoints / credits).toFixed(2);
    });

    // Calculate CGPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    Object.keys(resultsBySemester).forEach((sem) => {
      totalGradePoints += resultsBySemester[sem].totalGradePoints;
      totalCredits += resultsBySemester[sem].totalCredits;
    });
    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.json({ resultsBySemester, cgpa });
  } catch (err) {
    console.error('getStudentResults error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Teacher: fetch students in their faculty for grading
exports.getTeacherStudents = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this' });
    }

    // Get students from teacher's faculty
    const students = await User.find({ role: 'student', faculty: req.user.faculty })
      .select('_id name email registrationNumber studentId faculty')
      .sort({ name: 1 });

    res.json(students);
  } catch (err) {
    console.error('getTeacherStudents error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};