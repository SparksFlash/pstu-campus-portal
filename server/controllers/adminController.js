const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Result = require('../models/Result');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { paginateQuery } = require('../utils/paginate');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalFaculties,
      totalCourses,
      totalGrades,
      totalResults,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Faculty.countDocuments(),
      Course.countDocuments(),
      Grade.countDocuments(),
      Result.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt isVerified isActive'),
    ]);

    res.json({
      totalStudents,
      totalTeachers,
      totalFaculties,
      totalCourses,
      totalGrades,
      totalResults,
      recentUsers,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page, limit, action, resource } = req.query;
    const filter = {};
    if (action) filter.action = new RegExp(action, 'i');
    if (resource) filter.resource = resource;

    const result = await paginateQuery(AuditLog, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'actor', select: 'name email role' },
    });

    res.json(result);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admins from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    const action = user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action,
      resource: 'User',
      resourceId: user._id,
      after: { isActive: user.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { _id: user._id, name: user.name, isActive: user.isActive },
    });
  } catch (err) {
    console.error('toggleUserActive error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allowed = ['name', 'email', 'role', 'faculty', 'semester', 'registrationNumber', 'studentId', 'employeeId', 'isActive'];
    allowed.forEach((field) => {
      const val = req.body[field];
      if (val === undefined) return;
      if (field === 'semester') {
        user[field] = val === '' || val === null ? null : parseInt(val);
      } else if (field === 'faculty') {
        user[field] = val === '' ? null : val;
      } else {
        user[field] = val;
      }
    });
    user.updatedAt = Date.now();
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE_USER',
      resource: 'User',
      resourceId: user._id,
      after: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const out = user.toObject();
    delete out.password;
    res.json({ message: 'User updated successfully', user: out });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Semester Promotion ────────────────────────────────────────────────────────

async function checkStudentEligibility(student, semester) {
  const [grades, payment] = await Promise.all([
    Grade.find({ student: student._id, semester, status: 'published' }).select('grade course').populate('course', 'code'),
    Payment.findOne({ student: student._id, semester, status: 'completed' }),
  ]);

  const reasons = [];

  if (grades.length === 0) {
    reasons.push('No published grades for this semester');
  } else {
    const failed = grades.filter(g => g.grade === 'F');
    if (failed.length > 0) {
      reasons.push(`Failed: ${failed.map(g => g.course?.code || 'unknown').join(', ')}`);
    }
  }

  if (!payment) {
    reasons.push('Semester fee unpaid');
  }

  return { eligible: reasons.length === 0, reasons };
}

// GET /admin/promote/preview?faculty=<id>&semester=<n>
exports.getSemesterPromotionPreview = async (req, res) => {
  try {
    const { faculty, semester } = req.query;
    if (!faculty || !semester) {
      return res.status(400).json({ message: 'faculty and semester are required' });
    }
    const sem = parseInt(semester, 10);
    if (sem < 1 || sem > 7) {
      return res.status(400).json({ message: 'Semester must be between 1 and 7' });
    }

    const students = await User.find({
      role: 'student', faculty, semester: sem, isActive: true,
    }).select('name email registrationNumber semester');

    const eligible = [];
    const blocked  = [];

    await Promise.all(students.map(async (student) => {
      const { eligible: ok, reasons } = await checkStudentEligibility(student, sem);
      const entry = {
        _id:                student._id,
        name:               student.name,
        email:              student.email,
        registrationNumber: student.registrationNumber,
        currentSemester:    student.semester,
      };
      if (ok) {
        eligible.push(entry);
      } else {
        blocked.push({ ...entry, reasons });
      }
    }));

    // stable sort by name
    eligible.sort((a, b) => a.name.localeCompare(b.name));
    blocked.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ semester: sem, faculty, eligible, blocked });
  } catch (err) {
    console.error('getSemesterPromotionPreview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/promote
// Body: { faculty, semester, studentIds? }
exports.promoteSemester = async (req, res) => {
  try {
    const { faculty, semester, studentIds } = req.body;
    if (!faculty || !semester) {
      return res.status(400).json({ message: 'faculty and semester are required' });
    }
    const sem = parseInt(semester, 10);
    if (sem < 1 || sem > 7) {
      return res.status(400).json({ message: 'Semester must be between 1 and 7' });
    }

    // Fetch candidates — use provided list or all students in that semester
    const filter = { role: 'student', faculty, semester: sem, isActive: true };
    if (studentIds?.length) filter._id = { $in: studentIds };
    const students = await User.find(filter).select('name email registrationNumber semester');

    const promotable = [];
    const skipped    = [];

    await Promise.all(students.map(async (student) => {
      const { eligible, reasons } = await checkStudentEligibility(student, sem);
      if (eligible) {
        promotable.push(student._id);
      } else {
        skipped.push({ name: student.name, registrationNumber: student.registrationNumber, reasons });
      }
    }));

    if (promotable.length > 0) {
      await User.updateMany(
        { _id: { $in: promotable } },
        { $inc: { semester: 1 }, updatedAt: Date.now() },
      );

      // Audit log — one entry covering the batch
      await AuditLog.create({
        actor:     req.user._id,
        actorRole: req.user.role,
        action:    'SEMESTER_PROMOTION',
        resource:  'User',
        after: {
          promotedCount: promotable.length,
          fromSemester:  sem,
          toSemester:    sem + 1,
          faculty,
          promotedIds:   promotable,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      message:  `${promotable.length} student${promotable.length !== 1 ? 's' : ''} promoted to Semester ${sem + 1}.`,
      promoted: promotable.length,
      skipped,
    });
  } catch (err) {
    console.error('promoteSemester error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, role, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { registrationNumber: new RegExp(q, 'i') },
        { employeeId: new RegExp(q, 'i') },
      ];
    }

    const result = await paginateQuery(User, filter, {
      page,
      limit: limit || 20,
      sort: { createdAt: -1 },
      select: '-password -verificationToken -resetPasswordToken -refreshTokens',
      populate: { path: 'faculty', select: 'name code' },
    });

    res.json(result);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
