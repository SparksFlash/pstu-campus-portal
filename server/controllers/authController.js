const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function generateToken(user) {
	return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}


exports.register = async (req, res) => {
	try {
		const { name, email, password, role, faculty, registrationNumber, studentId } = req.body;
		if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email' });
		if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
		if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

		if (role === 'student' && !registrationNumber && !studentId) {
			return res.status(400).json({ message: 'Students must provide registrationNumber or studentId' });
		}

		const orConditions = [{ email }];
		if (registrationNumber) orConditions.push({ registrationNumber });
		if (studentId) orConditions.push({ studentId });
		const existing = await User.findOne({ $or: orConditions });
		if (existing) return res.status(400).json({ message: 'Account with provided email/ID already exists' });

		const verificationToken        = crypto.randomBytes(32).toString('hex');
		const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

		const user = new User({
			name, email, password, role, faculty, registrationNumber, studentId,
			isVerified: false, verificationToken, verificationTokenExpires,
		});
		await user.save();

		const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
		const CLIENT_URL_LOCAL = process.env.CLIENT_URL || 'http://localhost:3000';
		const verifyUrl = `${SERVER_URL}/api/v1/auth/verify/${verificationToken}`;

		const html = `
			<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
				<h2 style="color:#1d4ed8">Verify Your PSTU Account</h2>
				<p>Hi <strong>${name}</strong>,</p>
				<p>Thank you for registering on <strong>PSTU Campus Portal</strong>.</p>
				<p>Please click the button below to verify your email address:</p>
				<div style="text-align:center;margin:30px 0">
					<a href="${verifyUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px">Verify Email</a>
				</div>
				<p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you did not register, ignore this email.</p>
			</div>`;

		try {
			await require('../utils/emailService').sendEmail(email, 'Verify your PSTU Campus Portal account', html);
			res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
		} catch (emailErr) {
			console.error('Verification email failed:', emailErr.message);
			// Auto-verify if email fails so user is not stuck
			user.isVerified = true;
			user.verificationToken = undefined;
			user.verificationTokenExpires = undefined;
			await user.save();
			res.status(201).json({ message: 'Registration successful! You can now log in.' });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};


exports.login = async (req, res) => {
	try {
		const { email, password, role, registrationNumber, studentId, faculty } = req.body;
		if (!password) return res.status(400).json({ message: 'Missing password' });

		let query = {};
		if (role === 'student') {
			if (!registrationNumber || !studentId || !faculty) {
				return res.status(400).json({ message: 'Students must provide registrationNumber, studentId and faculty' });
			}
			query = { registrationNumber, studentId, faculty, role: 'student' };
			if (email) query.email = email;
		} else {
			if (!email) return res.status(400).json({ message: 'Email is required' });
			query = { email };
			if (role) query.role = role;
			if (faculty) query.faculty = faculty;
		}

		const user = await User.findOne(query).populate('faculty', 'name');
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });

		// Account lockout check
		if (user.isLocked) {
			return res.status(423).json({
				message: 'Account temporarily locked due to multiple failed login attempts. Try again in 30 minutes.',
			});
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			await user.incLoginAttempts();
			return res.status(400).json({ message: 'Invalid credentials' });
		}

		if (role && role !== user.role) {
			return res.status(403).json({ message: 'Selected role does not match account role' });
		}

		if (!user.isVerified) {
			return res.status(403).json({ message: 'Email not verified. Please check your inbox.' });
		}

		if (!user.isActive) {
			return res.status(403).json({ message: 'Your account has been deactivated. Contact support.' });
		}

		// Reset login attempts on successful login
		if (user.loginAttempts > 0 || user.lockUntil) {
			await user.updateOne({ $set: { loginAttempts: 0, lastLogin: Date.now() }, $unset: { lockUntil: 1 } });
		} else {
			await user.updateOne({ $set: { lastLogin: Date.now() } });
		}

		const token = generateToken(user);
		res.json({
			token,
			user: {
				id:                 user._id,
				name:               user.name,
				email:              user.email,
				role:               user.role,
				faculty:            user.faculty || null,
				registrationNumber: user.registrationNumber || null,
				studentId:          user.studentId          || null,
				employeeId:         user.employeeId         || null,
				semester:           user.semester           || null,
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};


exports.verifyEmail = async (req, res) => {
	try {
		const token = req.query.token || req.params.token;
		if (!token) return res.status(400).json({ message: 'Missing token' });

		const user = await User.findOne({
			verificationToken: token,
			verificationTokenExpires: { $gt: Date.now() },
		});

		if (!user) {
			if (req.params && req.params.token) return res.redirect(`${CLIENT_URL}/verify?status=error&reason=invalid`);
			return res.status(400).json({ message: 'Invalid or expired token' });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpires = undefined;
		await user.save();

		if (req.params && req.params.token) {
			return res.redirect(`${CLIENT_URL}/verify?status=success`);
		}
		return res.json({ message: 'Email verified successfully' });
	} catch (err) {
		console.error(err);
		if (req.params && req.params.token) return res.redirect(`${CLIENT_URL}/verify?status=error`);
		return res.status(500).json({ message: 'Server error' });
	}
};

// convenience alias for the /verify/:token route
exports.verifyEmailAndRedirect = async (req, res) => {
	return exports.verifyEmail(req, res);
};


/**
 * POST /api/v1/auth/forgot-password
 * Generates a secure reset token (stored as SHA-256 hash) and emails the plain token.
 */
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email: email.toLowerCase() });

		// Always return 200 so attackers cannot enumerate valid emails
		if (!user) {
			return res.json({ message: 'If that email is registered you will receive a reset link shortly.' });
		}

		// Generate plain token, store only its hash
		const plainToken = crypto.randomBytes(32).toString('hex');
		const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

		user.resetPasswordToken = tokenHash;
		user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
		await user.save({ validateBeforeSave: false });

		const resetUrl = `${CLIENT_URL}/auth/reset-password?token=${plainToken}`;
		const html = `
			<p>Hi ${user.name},</p>
			<p>You requested a password reset for your PSTU account.</p>
			<p><a href="${resetUrl}">Reset your password</a></p>
			<p>This link expires in <strong>1 hour</strong>.</p>
			<p>If you did not request this, please ignore this email — your password will remain unchanged.</p>
		`;

		let emailSent = false;
		try {
			await sendEmail(user.email, 'Reset your PSTU password', html);
			emailSent = true;
		} catch (emailErr) {
			console.error('Failed to send reset email:', emailErr);
			// Clear the token so the user can try again
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;
			await user.save({ validateBeforeSave: false });
			return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
		}

		const isDev = process.env.NODE_ENV !== 'production';
		const response = { message: 'If that email is registered you will receive a reset link shortly.' };
		if (!emailSent || isDev) {
			response.devResetUrl = resetUrl;
		}
		res.json(response);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};


/**
 * POST /api/v1/auth/reset-password
 * Verifies the hashed token and updates the user password.
 */
exports.resetPassword = async (req, res) => {
	try {
		const { token, password } = req.body;

		const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

		const user = await User.findOne({
			resetPasswordToken: tokenHash,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
		}

		user.password = password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		user.loginAttempts = 0;
		user.lockUntil = undefined;
		await user.save();

		res.json({ message: 'Password reset successful. You can now log in.' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};
