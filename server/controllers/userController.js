exports.getProfile = async (req, res) => {
	try {
		const user = req.user;
		res.json({ user });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

exports.updateProfile = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: 'User not found' });

		// allowed fields for users to update themselves
		const allowed = ['name', 'phone', 'profilePicture', 'address', 'dateOfBirth', 'registrationNumber', 'employeeId', 'faculty', 'password'];
		const objectIdFields = ['faculty'];
		const dateFields = ['dateOfBirth'];
		allowed.forEach((field) => {
			const val = req.body[field];
			if (val === undefined) return;
			if (objectIdFields.includes(field)) {
				// empty string can't be cast to ObjectId — set to null to clear
				user[field] = val === '' ? null : val;
			} else if (dateFields.includes(field)) {
				// empty string can't be cast to Date — set to null to clear
				user[field] = val === '' ? null : val;
			} else {
				user[field] = val;
			}
		});
		user.updatedAt = Date.now();
		await user.save();
		const out = user.toObject();
		delete out.password;
		res.json({ user: out });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const userId = req.user._id;
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing passwords' });
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: 'User not found' });
		const match = await user.comparePassword(currentPassword);
		if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
		if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
		user.password = newPassword;
		user.updatedAt = Date.now();
		await user.save();
		res.json({ message: 'Password changed successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.getAllUsers = async (req, res) => {
	try {
		const { role, q } = req.query;
		const filter = {};
		if (role) filter.role = role;
		if (q) filter.$or = [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') } ];
		const users = await User.find(filter).select('-password').populate('faculty');
		res.json(users);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

exports.getStudentsList = async (req, res) => {
	try {
		const { q, faculty } = req.query;
		const filter = { role: 'student' };

		// If the requester is a teacher, restrict to their faculty if available
		if (req.user.role === 'teacher') {
			if (req.user.faculty) {
				filter.faculty = req.user.faculty;
			} else {
				// teacher has no faculty assigned in DB -> fall back to returning all students
			}
		} else {
			// admins may pass ?faculty=... to filter, or omit to get all students
			if (faculty) filter.faculty = faculty;
		}

		if (q) filter.$or = [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') } ];

		console.log('getStudentsList - requester:', { id: req.user._id.toString(), role: req.user.role, faculty: req.user.faculty });
		console.log('getStudentsList - filter:', filter);
		const students = await User.find(filter).select('-password').populate('faculty');
		console.log('getStudentsList - found count:', students.length);
		res.json(students);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.getUsersByRole = async (req, res) => {
	try {
		const { role } = req.params;
		const { q, faculty } = req.query;
		if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

		// Authorization: admins can fetch any role; teachers can only fetch students
		if (req.user.role !== 'admin' && !(req.user.role === 'teacher' && role === 'student')) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		const filter = { role };
		if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

		// Admins may filter by faculty when requesting students
		if (role === 'student' && req.user.role === 'admin' && faculty) filter.faculty = faculty;

		console.log('getUsersByRole - requester:', { id: req.user._id.toString(), role: req.user.role, faculty: req.user.faculty });
		console.log('getUsersByRole - params:', { role, q, faculty });

		const users = await User.find(filter).select('-password').populate('faculty');
		res.json(users);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// Admin helper: return both teachers and students lists in a single response
exports.getTeachersAndStudents = async (req, res) => {
	try {
		const { q, faculty } = req.query;
		const nameOrEmail = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] } : {};

		// teachers
		const teacherFilter = { role: 'teacher', ...nameOrEmail };
		const teachers = await User.find(teacherFilter).select('-password').populate('faculty');

		// students (admins may filter by faculty)
		const studentFilter = { role: 'student', ...nameOrEmail };
		if (faculty) studentFilter.faculty = faculty;
		const students = await User.find(studentFilter).select('-password').populate('faculty');

		res.json({ teachers, students });
	} catch (err) {
		console.error('getTeachersAndStudents error:', err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.uploadProfilePhoto = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
		const file = req.file;
		if (!file.mimetype.startsWith('image/')) return res.status(400).json({ message: 'Invalid file type' });

		// convert buffer to data uri
		const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

		const result = await cloudinary.uploader.upload(dataUri, {
			folder: 'profiles',
			transformation: [ { width: 500, height: 500, crop: 'thumb', gravity: 'face' } ],
		});

		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: 'User not found' });
		user.profilePicture = result.secure_url;
		user.updatedAt = Date.now();
		await user.save();
		const out = user.toObject();
		delete out.password;
		res.json({ user: out, url: result.secure_url });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Upload failed' });
	}
};

