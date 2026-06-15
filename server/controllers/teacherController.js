/**
 * Teacher Workflow Controller
 * Handles all teacher-related operations:
 * - Student management (semester-wise, faculty-wise)
 * - Marks entry and management
 * - Marksheet generation
 * - Result generation
 */

const User = require('../models/User');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Faculty = require('../models/Faculty');
const { getGradeForPercentage } = require('../utils/gradingScale');
const { notifyMany } = require('../utils/notify');

/**
 * Debug endpoint to check teacher access
 */
exports.debugCheck = async (req, res) => {
  try {
    const teacher = req.user;

    console.log('[DEBUG] Full teacher object:', {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      faculty: teacher.faculty,
      facultyType: typeof teacher.faculty,
      isActive: teacher.isActive
    });

    if (!teacher.faculty) {
      return res.status(400).json({
        error: 'NO_FACULTY',
        message: 'Teacher must have a faculty assigned',
        teacher: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          faculty: teacher.faculty
        }
      });
    }

    res.json({
      status: 'ok',
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        faculty: teacher.faculty
      }
    });
  } catch (err) {
    console.error('[DEBUG] error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========== STUDENT MANAGEMENT ==========

/**
 * Get all students in teacher's faculty for a specific semester
 */
exports.getStudentsBySemester = async (req, res) => {
  try {
    const teacher = req.user;
    const { semester } = req.params;

    console.log('[Teacher API] getStudentsBySemester called:', {
      teacherId: teacher._id,
      teacherName: teacher.name,
      teacherFaculty: teacher.faculty,
      semester
    });

    if (!teacher.faculty) {
      console.log('[Teacher API] Teacher has no faculty:', teacher._id);
      return res.status(400).json({ message: 'Teacher must have a faculty assigned' });
    }

    // Get students in teacher's faculty for the requested semester
    const students = await User.find({
      role: 'student',
      faculty: teacher.faculty,
      semester: parseInt(semester),
      isActive: true
    })
      .select('_id name email registrationNumber studentId faculty profilePicture semester')
      .sort({ name: 1 });

    console.log('[Teacher API] Found students:', students.length);

    if (!students.length) {
      return res.json({
        semester,
        students: [],
        count: 0,
        message: 'No students found in your faculty'
      });
    }

    // Get their grades for this semester
    const studentIds = students.map(s => s._id);
    const grades = await Grade.find({
      student: { $in: studentIds },
      semester: parseInt(semester)
    });

    console.log('[Teacher API] Found grades:', grades.length);

    // Map grades to students
    const studentsWithGrades = students.map(student => ({
      ...student.toObject(),
      gradesCount: grades.filter(g => g.student.toString() === student._id.toString()).length
    }));

    res.json({
      semester: parseInt(semester),
      students: studentsWithGrades,
      count: students.length,
      totalGrades: grades.length
    });
  } catch (err) {
    console.error('[Teacher API] getStudentsBySemester error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get student details with their course list for a semester
 */
exports.getStudentDetails = async (req, res) => {
  try {
    const teacher = req.user;
    const { studentId, semester } = req.params;

    console.log('[getStudentDetails] Request:', { teacherId: teacher._id, studentId, semester, teacherFaculty: teacher.faculty });

    // Verify student exists and belongs to teacher's faculty
    const student = await User.findById(studentId).populate('faculty');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.faculty._id.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'You can only manage students from your faculty' });
    }

    // Get courses for this semester
    const courses = await Course.find({
      faculty: teacher.faculty,
      semester: parseInt(semester)
    })
      .select('_id code title creditHours totalMarks')
      .sort({ code: 1 });

    console.log('[getStudentDetails] Found courses:', { count: courses.length, semester: parseInt(semester), faculty: teacher.faculty });

    // Get existing grades for this student
    const grades = await Grade.find({
      student: studentId,
      semester: parseInt(semester)
    });

    // Create marks map
    const marksMap = {};
    grades.forEach(g => {
      marksMap[g.course.toString()] = {
        _id: g._id,
        obtainedMarks: g.obtainedMarks,
        totalMarks: g.totalMarks,
        percentage: g.percentage,
        grade: g.grade,
        gpa: g.gpa
      };
    });

    // Merge courses with existing grades
    const coursesWithMarks = courses.map(course => ({
      ...course.toObject(),
      marks: marksMap[course._id.toString()] || null
    }));

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        registrationNumber: student.registrationNumber,
        studentId: student.studentId,
        faculty: student.faculty.name,
        profilePicture: student.profilePicture
      },
      semester: parseInt(semester),
      courses: coursesWithMarks,
      courseCount: courses.length,
      gradedCourseCount: grades.length
    });
  } catch (err) {
    console.error('getStudentDetails error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ========== MARKS MANAGEMENT ==========

/**
 * Input/Update marks for a student in a course
 */
exports.enterMarks = async (req, res) => {
  try {
    const teacher = req.user;
    const { studentId, courseId, semester, obtainedMarks, totalMarks } = req.body;

    // Validation
    if (!studentId || !courseId || !semester || obtainedMarks === undefined || !totalMarks) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (obtainedMarks < 0 || obtainedMarks > totalMarks || totalMarks <= 0) {
      return res.status(400).json({ message: 'Invalid marks' });
    }

    // Verify student belongs to teacher's faculty
    const student = await User.findById(studentId);
    if (!student || student.faculty.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'You can only enter marks for students in your faculty' });
    }

    // Verify course belongs to teacher's faculty
    const course = await Course.findById(courseId);
    if (!course || course.faculty.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'You can only enter marks for courses in your faculty' });
    }

    // Calculate percentage and grade
    const percentage = (obtainedMarks / totalMarks) * 100;
    const { grade, gpa } = getGradeForPercentage(percentage);

    // Find or create grade record
    let gradeRecord = await Grade.findOne({
      student: studentId,
      course: courseId,
      semester: parseInt(semester)
    });

    if (gradeRecord) {
      // Update existing
      gradeRecord.obtainedMarks = obtainedMarks;
      gradeRecord.totalMarks = totalMarks;
      gradeRecord.percentage = parseFloat(percentage.toFixed(2));
      gradeRecord.grade = grade;
      gradeRecord.gpa = gpa;
      gradeRecord.teacher = teacher._id;
      gradeRecord.updatedAt = Date.now();
    } else {
      // Create new
      gradeRecord = new Grade({
        student: studentId,
        course: courseId,
        semester: parseInt(semester),
        faculty: teacher.faculty,
        obtainedMarks,
        totalMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        grade,
        gpa,
        teacher: teacher._id
      });
    }

    await gradeRecord.save();
    await gradeRecord.populate('course', 'code title');

    res.json({
      message: 'Marks saved successfully',
      grade: {
        _id: gradeRecord._id,
        course: gradeRecord.course,
        obtainedMarks: gradeRecord.obtainedMarks,
        totalMarks: gradeRecord.totalMarks,
        percentage: gradeRecord.percentage,
        grade: gradeRecord.grade,
        gpa: gradeRecord.gpa
      }
    });
  } catch (err) {
    console.error('enterMarks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Bulk enter marks for multiple courses
 */
exports.bulkEnterMarks = async (req, res) => {
  try {
    const teacher = req.user;
    const { studentId, semester, marksData } = req.body;

    if (!studentId || !semester || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Verify student
    const student = await User.findById(studentId);
    if (!student || student.faculty.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const results = [];
    const errors = [];

    for (const marks of marksData) {
      try {
        const { courseId, obtainedMarks, totalMarks } = marks;

        if (obtainedMarks < 0 || obtainedMarks > totalMarks) {
          errors.push({ courseId, message: 'Invalid marks range' });
          continue;
        }

        const course = await Course.findById(courseId);
        if (!course) {
          errors.push({ courseId, message: 'Course not found' });
          continue;
        }

        const percentage = (obtainedMarks / totalMarks) * 100;
        const { grade, gpa } = getGradeForPercentage(percentage);

        let gradeRecord = await Grade.findOne({
          student: studentId,
          course: courseId,
          semester: parseInt(semester)
        });

        if (gradeRecord) {
          gradeRecord.obtainedMarks = obtainedMarks;
          gradeRecord.totalMarks = totalMarks;
          gradeRecord.percentage = parseFloat(percentage.toFixed(2));
          gradeRecord.grade = grade;
          gradeRecord.gpa = gpa;
          gradeRecord.updatedAt = Date.now();
        } else {
          gradeRecord = new Grade({
            student: studentId,
            course: courseId,
            semester: parseInt(semester),
            faculty: teacher.faculty,
            obtainedMarks,
            totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            grade,
            gpa,
            teacher: teacher._id
          });
        }

        await gradeRecord.save();
        results.push({
          courseId,
          obtainedMarks,
          percentage: gradeRecord.percentage,
          grade: gradeRecord.grade,
          gpa: gradeRecord.gpa
        });
      } catch (err) {
        errors.push({ courseId: marks.courseId, message: err.message });
      }
    }

    res.json({
      message: `Successfully saved ${results.length} marks`,
      saved: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('bulkEnterMarks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ========== MARKSHEET GENERATION ==========

/**
 * Generate individual student marksheet for a semester
 */
exports.generateMarksheet = async (req, res) => {
  try {
    const teacher = req.user;
    const { studentId, semester } = req.params;

    // Verify student belongs to teacher's faculty
    const student = await User.findById(studentId).populate('faculty');
    if (!student || student.faculty._id.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all grades for this student in this semester
    const grades = await Grade.find({
      student: studentId,
      semester: parseInt(semester)
    })
      .populate('course', 'code title creditHours')
      .sort({ 'course.code': 1 });

    if (!grades.length) {
      return res.json({
        student: {
          name: student.name,
          studentId: student.studentId,
          registrationNumber: student.registrationNumber,
          faculty: student.faculty.name
        },
        semester: parseInt(semester),
        courses: [],
        statistics: {
          totalCourses: 0,
          totalCredits: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          sgpa: '-',
          message: 'No grades found'
        }
      });
    }

    // Calculate statistics
    let totalCredits = 0;
    let totalGradePoints = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;

    const courseDetails = grades.map(g => {
      const credits = g.course.creditHours || 1;
      totalCredits += credits;
      totalGradePoints += (g.gpa || 0) * credits;
      totalMarks += g.totalMarks;
      obtainedMarks += g.obtainedMarks;

      return {
        code: g.course.code,
        title: g.course.title,
        credits: credits,
        obtainedMarks: g.obtainedMarks,
        totalMarks: g.totalMarks,
        percentage: g.percentage,
        grade: g.grade,
        gpa: g.gpa
      };
    });

    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        registrationNumber: student.registrationNumber,
        email: student.email,
        faculty: student.faculty.name,
        profilePicture: student.profilePicture
      },
      semester: parseInt(semester),
      courses: courseDetails,
      statistics: {
        totalCourses: grades.length,
        totalCredits: totalCredits,
        totalMarks: totalMarks,
        obtainedMarks: obtainedMarks,
        percentage: totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0,
        sgpa: sgpa,
        gradeDistribution: calculateGradeDistribution(courseDetails)
      },
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('generateMarksheet error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Generate comprehensive result with all semesters
 */
exports.generateStudentResult = async (req, res) => {
  try {
    const teacher = req.user;
    const { studentId } = req.params;

    // Verify student belongs to teacher's faculty
    const student = await User.findById(studentId).populate('faculty');
    if (!student || student.faculty._id.toString() !== teacher.faculty.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all grades for this student across all semesters
    const grades = await Grade.find({ student: studentId })
      .populate('course', 'code title creditHours')
      .sort({ semester: 1, 'course.code': 1 });

    if (!grades.length) {
      return res.json({
        student: {
          name: student.name,
          studentId: student.studentId,
          registrationNumber: student.registrationNumber,
          faculty: student.faculty.name
        },
        semesters: {},
        cgpa: '-'
      });
    }

    // Group by semester
    const resultsBySemester = {};
    let totalCredits = 0;
    let totalGradePoints = 0;

    grades.forEach(g => {
      const sem = g.semester || 1;

      if (!resultsBySemester[sem]) {
        resultsBySemester[sem] = {
          courses: [],
          totalCredits: 0,
          totalGradePoints: 0,
          sgpa: 0
        };
      }

      const credits = g.course.creditHours || 1;
      resultsBySemester[sem].courses.push({
        code: g.course.code,
        title: g.course.title,
        credits: credits,
        marks: g.obtainedMarks,
        totalMarks: g.totalMarks,
        percentage: g.percentage,
        grade: g.grade,
        gpa: g.gpa
      });

      resultsBySemester[sem].totalCredits += credits;
      resultsBySemester[sem].totalGradePoints += (g.gpa || 0) * credits;
      totalCredits += credits;
      totalGradePoints += (g.gpa || 0) * credits;
    });

    // Calculate SGPAs and CGPA
    Object.keys(resultsBySemester).forEach(sem => {
      const data = resultsBySemester[sem];
      data.sgpa = data.totalCredits > 0 ? (data.totalGradePoints / data.totalCredits).toFixed(2) : 0;
    });

    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        registrationNumber: student.registrationNumber,
        email: student.email,
        faculty: student.faculty.name,
        profilePicture: student.profilePicture
      },
      results: resultsBySemester,
      cgpa: cgpa,
      totalSemesters: Object.keys(resultsBySemester).length,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('generateStudentResult error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Comprehensive diagnostics endpoint for troubleshooting
 * Helps identify why courses/marks entry isn't working
 */
exports.runDiagnostics = async (req, res) => {
  try {
    const teacher = req.user;
    const { semester } = req.query;
    const sem = semester ? parseInt(semester) : 1;

    // Collect diagnostic data
    const diagnostics = {
      timestamp: new Date().toISOString(),
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        hasFactory: !!teacher.faculty,
        facultyId: teacher.faculty || 'NOT_ASSIGNED',
        isActive: teacher.isActive,
        role: teacher.role
      },
      checks: {}
    };

    // Check 1: Teacher validation
    diagnostics.checks.teacherValid = {
      passed: !!(teacher && teacher.faculty && teacher.isActive && teacher.role === 'teacher'),
      details: {
        hasRecord: !!teacher,
        hasFaculty: !!teacher.faculty,
        isActive: teacher.isActive,
        roleIsTeacher: teacher.role === 'teacher'
      }
    };

    if (!teacher.faculty) {
      diagnostics.checks.teacherValid.warning = 'Teacher has no faculty assigned! This is the main issue.';
    }

    // Check 2: Faculty exists
    let faculty = null;
    if (teacher.faculty) {
      faculty = await Faculty.findById(teacher.faculty);
      diagnostics.checks.facultyExists = {
        passed: !!faculty,
        details: {
          facultyId: teacher.faculty,
          facultyName: faculty?.name || 'NOT_FOUND',
          found: !!faculty
        }
      };
    }

    // Check 3: Courses for teacher's faculty and semester
    let courses = [];
    if (teacher.faculty) {
      courses = await Course.find({
        faculty: teacher.faculty,
        semester: sem
      }).select('_id code title creditHours semester faculty');

      diagnostics.checks.coursesExist = {
        passed: courses.length > 0,
        details: {
          semester: sem,
          count: courses.length,
          courses: courses.map(c => ({
            _id: c._id,
            code: c.code,
            title: c.title,
            creditHours: c.creditHours
          }))
        }
      };
    }

    // Check 4: Students in teacher's faculty
    let students = [];
    if (teacher.faculty) {
      students = await User.find({
        role: 'student',
        faculty: teacher.faculty,
        isActive: true
      }).select('_id name email registrationNumber studentId faculty');

      diagnostics.checks.studentsExist = {
        passed: students.length > 0,
        details: {
          count: students.length,
          students: students.slice(0, 5).map(s => ({
            _id: s._id,
            name: s.name,
            registrationNumber: s.registrationNumber
          }))
        }
      };

      if (students.length === 0) {
        diagnostics.checks.studentsExist.warning = `No active students found in ${faculty?.name || 'this'} faculty`;
      }
    }

    // Check 5: Grades for sample student
    let sampleStudentGrades = 0;
    if (students.length > 0 && courses.length > 0) {
      const sampleStudent = students[0];
      const gradeCount = await Grade.countDocuments({
        student: sampleStudent._id,
        semester: sem
      });

      diagnostics.checks.gradesExist = {
        passed: true,
        details: {
          sampleStudent: {
            name: sampleStudent.name,
            id: sampleStudent._id
          },
          gradeCount: gradeCount,
          semester: sem
        }
      };
      sampleStudentGrades = gradeCount;
    }

    // Overall status
    diagnostics.summary = {
      overallStatus: diagnostics.checks.teacherValid.passed && 
                     diagnostics.checks.coursesExist?.passed &&
                     diagnostics.checks.studentsExist?.passed ? 'OK' : 'ISSUES_FOUND',
      activeIssues: [],
      recommendations: []
    };

    // Add issues and recommendations
    if (!diagnostics.checks.teacherValid.passed) {
      diagnostics.summary.activeIssues.push('Teacher validation failed');
      if (!teacher.faculty) {
        diagnostics.summary.recommendations.push('CRITICAL: Assign a faculty to the teacher');
      }
      if (!teacher.isActive) {
        diagnostics.summary.recommendations.push('Teacher is not active, set isActive = true');
      }
    }

    if (!diagnostics.checks.facultyExists?.passed) {
      diagnostics.summary.activeIssues.push('Faculty not found in database');
      diagnostics.summary.recommendations.push('Verify faculty assignment or create the faculty');
    }

    if (!diagnostics.checks.coursesExist?.passed) {
      diagnostics.summary.activeIssues.push(`No courses found for semester ${sem} and faculty`);
      diagnostics.summary.recommendations.push(`Create courses for semester ${sem} or run: npm run seed:sample`);
    }

    if (!diagnostics.checks.studentsExist?.passed) {
      diagnostics.summary.activeIssues.push('No students found in this faculty');
      diagnostics.summary.recommendations.push('Enroll students in this faculty or check student assignments');
    }

    if (diagnostics.summary.activeIssues.length === 0) {
      diagnostics.summary.status = 'ALL_CHECKS_PASSED';
      diagnostics.summary.recommendations.push('System is properly configured. Marks entry should work.');
    }

    res.json(diagnostics);
  } catch (err) {
    console.error('runDiagnostics error:', err);
    res.status(500).json({
      error: 'Diagnostic check failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : 'See logs'
    });
  }
};

// ========== STATS ==========

exports.getTeacherStats = async (req, res) => {
  try {
    const teacher = req.user;
    const facultyId = teacher.faculty;

    if (!facultyId) {
      return res.json({ students: 0, courses: 0, gradesEntered: 0, draftGrades: 0, publishedGrades: 0 });
    }

    const [students, courses, gradesEntered, draftGrades, publishedGrades] = await Promise.all([
      User.countDocuments({ role: 'student', faculty: facultyId, isActive: true }),
      Course.countDocuments({ faculty: facultyId }),
      Grade.countDocuments({ teacher: teacher._id }),
      Grade.countDocuments({ teacher: teacher._id, status: 'draft' }),
      Grade.countDocuments({ teacher: teacher._id, status: 'published' }),
    ]);

    res.json({ students, courses, gradesEntered, draftGrades, publishedGrades });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ========== PUBLISH / UNPUBLISH ==========

exports.getSemesterPublishStatus = async (req, res) => {
  try {
    const teacher = req.user;
    const semester = parseInt(req.params.semester);

    if (!teacher.faculty) {
      return res.status(400).json({ message: 'Teacher must have a faculty assigned' });
    }

    const [total, published, draft] = await Promise.all([
      Grade.countDocuments({ faculty: teacher.faculty, semester }),
      Grade.countDocuments({ faculty: teacher.faculty, semester, status: 'published' }),
      Grade.countDocuments({ faculty: teacher.faculty, semester, status: 'draft' }),
    ]);

    // Get students with their grade summary
    const students = await User.find({ role: 'student', faculty: teacher.faculty, isActive: true })
      .select('_id name registrationNumber')
      .sort({ name: 1 });

    const studentIds = students.map((s) => s._id);
    const grades = await Grade.find({ faculty: teacher.faculty, semester, student: { $in: studentIds } })
      .select('student status');

    const studentMap = {};
    grades.forEach((g) => {
      const sid = g.student.toString();
      if (!studentMap[sid]) studentMap[sid] = { total: 0, published: 0 };
      studentMap[sid].total++;
      if (g.status === 'published') studentMap[sid].published++;
    });

    const studentSummary = students.map((s) => ({
      _id: s._id,
      name: s.name,
      registrationNumber: s.registrationNumber,
      gradesCount: studentMap[s._id.toString()]?.total || 0,
      publishedCount: studentMap[s._id.toString()]?.published || 0,
    }));

    res.json({ semester, total, published, draft, students: studentSummary });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.publishSemesterResults = async (req, res) => {
  try {
    const teacher = req.user;
    const semester = parseInt(req.params.semester);

    if (!teacher.faculty) {
      return res.status(400).json({ message: 'Teacher must have a faculty assigned' });
    }

    const result = await Grade.updateMany(
      { faculty: teacher.faculty, semester, status: 'draft' },
      { $set: { status: 'published', publishedAt: new Date(), publishedBy: teacher._id } }
    );

    // Notify affected students
    if (result.modifiedCount > 0) {
      const studentIds = await Grade.distinct('student', {
        faculty: teacher.faculty, semester, status: 'published',
      });
      notifyMany(studentIds, {
        type:  'result_published',
        title: `Semester ${semester} results published`,
        body:  'Your grades for this semester are now available. Check your results page.',
        meta:  { semester },
      }).catch(() => {});
    }

    res.json({
      message: `Published ${result.modifiedCount} grade(s) for Semester ${semester}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.unpublishSemesterResults = async (req, res) => {
  try {
    const teacher = req.user;
    const semester = parseInt(req.params.semester);

    if (!teacher.faculty) {
      return res.status(400).json({ message: 'Teacher must have a faculty assigned' });
    }

    const result = await Grade.updateMany(
      { faculty: teacher.faculty, semester, status: 'published' },
      { $set: { status: 'draft' }, $unset: { publishedAt: '', publishedBy: '' } }
    );

    res.json({
      message: `Unpublished ${result.modifiedCount} grade(s) for Semester ${semester}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ========== BULK CSV IMPORT ==========

exports.bulkCSVImport = async (req, res) => {
  try {
    const teacher = req.user;
    const { semester, rows } = req.body;
    // rows: [{ registrationNumber, courseCode, obtainedMarks, totalMarks }]

    if (!semester || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'semester and rows[] are required' });
    }
    if (!teacher.faculty) {
      return res.status(400).json({ message: 'Teacher must have a faculty assigned' });
    }

    const { getGradeForPercentage } = require('../utils/gradingScale');
    const saved = [];
    const errors = [];

    for (const row of rows) {
      const { registrationNumber, courseCode, obtainedMarks, totalMarks } = row;
      try {
        const student = await User.findOne({ registrationNumber: registrationNumber?.trim(), role: 'student' });
        if (!student) { errors.push({ registrationNumber, reason: 'Student not found' }); continue; }
        if (student.faculty.toString() !== teacher.faculty.toString()) {
          errors.push({ registrationNumber, reason: 'Student not in your faculty' }); continue;
        }

        const course = await Course.findOne({ code: courseCode?.trim().toUpperCase(), faculty: teacher.faculty });
        if (!course) { errors.push({ registrationNumber, courseCode, reason: 'Course not found in your faculty' }); continue; }

        const obtained = parseFloat(obtainedMarks);
        const total = parseFloat(totalMarks) || 100;
        if (isNaN(obtained) || obtained < 0 || obtained > total) {
          errors.push({ registrationNumber, courseCode, reason: 'Invalid marks' }); continue;
        }

        const percentage = parseFloat(((obtained / total) * 100).toFixed(2));
        const { grade, gpa } = getGradeForPercentage(percentage);

        let gradeRecord = await Grade.findOne({ student: student._id, course: course._id, semester: parseInt(semester) });
        if (gradeRecord) {
          gradeRecord.obtainedMarks = obtained;
          gradeRecord.totalMarks = total;
          gradeRecord.percentage = percentage;
          gradeRecord.grade = grade;
          gradeRecord.gpa = gpa;
          gradeRecord.teacher = teacher._id;
          gradeRecord.status = 'draft';
          gradeRecord.updatedAt = new Date();
        } else {
          gradeRecord = new Grade({
            student: student._id, course: course._id,
            semester: parseInt(semester), faculty: teacher.faculty,
            obtainedMarks: obtained, totalMarks: total,
            percentage, grade, gpa,
            teacher: teacher._id, status: 'draft',
          });
        }
        await gradeRecord.save();
        saved.push({ registrationNumber, courseCode, grade, gpa });
      } catch (rowErr) {
        errors.push({ registrationNumber, courseCode, reason: rowErr.message });
      }
    }

    res.json({
      message: `Imported ${saved.length} grade(s) successfully`,
      saved: saved.length,
      failed: errors.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ========== HELPER FUNCTIONS ==========

function calculateGradeDistribution(courses) {
  const distribution = {};
  courses.forEach(c => {
    if (!distribution[c.grade]) {
      distribution[c.grade] = 0;
    }
    distribution[c.grade]++;
  });
  return distribution;
}
