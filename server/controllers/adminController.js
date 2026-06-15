const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Result = require('../models/Result');
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
