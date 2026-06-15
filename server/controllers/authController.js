const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function generateToken(user) {
	return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}


exports.register = async (req, res) => {
	try {
		const { name, email, password, role, faculty, registrationNumber, studentId, semester } = req.body;
		if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email' });
		if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
		if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

		if (role === 'student' && !registrationNumber && !studentId) {
			return res.status(400).json({ message: 'Students must provide registrationNumber or studentId' });
		}
		if (role === 'student' && (!semester || semester < 1 || semester > 8)) {
			return res.status(400).json({ message: 'Students must select a semester (1–8)' });
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
			semester: role === 'student' ? parseInt(semester) : undefined,
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
			await sendEmail(email, 'Verify your PSTU Campus Portal account', html);
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
 * Generates a 6-digit OTP (stored as SHA-256 hash) and emails it to the user.
 */
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email: email.toLowerCase() });

		// Always return 200 so attackers cannot enumerate valid emails
		if (!user) {
			return res.json({ message: 'If that email is registered you will receive an OTP shortly.' });
		}

		// Generate 6-digit OTP, store only its SHA-256 hash
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

		user.resetPasswordToken = otpHash;
		user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
		await user.save({ validateBeforeSave: false });

		const html = `
			<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
				<h2 style="color:#1d4ed8">Password Reset OTP</h2>
				<p>Hi <strong>${user.name}</strong>,</p>
				<p>You requested a password reset for your PSTU Campus Portal account.</p>
				<p>Your one-time password (OTP) is:</p>
				<div style="text-align:center;margin:24px 0">
					<span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1d4ed8;background:#eff6ff;padding:16px 24px;border-radius:8px;display:inline-block">${otp}</span>
				</div>
				<p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
				<p style="color:#6b7280;font-size:13px">If you did not request this, please ignore this email — your password will remain unchanged.</p>
			</div>
		`;

		try {
			await sendEmail(user.email, 'Your PSTU password reset OTP', html);
		} catch (emailErr) {
			console.error('Failed to send OTP email:', emailErr);
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;
			await user.save({ validateBeforeSave: false });
			return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
		}

		const isDev = process.env.NODE_ENV !== 'production';
		const response = { message: 'OTP sent to your email. It expires in 10 minutes.' };
		if (isDev) response.devOtp = otp;
		res.json(response);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};


/**
 * POST /api/v1/auth/reset-password
 * Verifies the OTP hash and updates the user password.
 * Body: { email, otp, password }
 */
exports.resetPassword = async (req, res) => {
	try {
		const { email, otp, password } = req.body;

		const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

		const user = await User.findOne({
			email: email.toLowerCase(),
			resetPasswordToken: otpHash,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ message: 'OTP is invalid or has expired.' });
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


/**
 * POST /api/v1/auth/google
 * Verify Google ID token; find or create user; return JWT.
 * Body: { credential } — the ID token from @react-oauth/google
 */
exports.googleAuth = async (req, res) => {
	try {
		const { credential } = req.body;
		if (!credential) return res.status(400).json({ message: 'Google credential missing' });

		if (!process.env.GOOGLE_CLIENT_ID) {
			return res.status(503).json({ message: 'Google sign-in is not configured on this server.' });
		}

		// Verify the ID token
		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		const { sub: googleId, email, name, picture } = payload;

		if (!email) return res.status(400).json({ message: 'Google account has no email' });

		// Find existing user by googleId first, then by email
		let user = await User.findOne({ googleId }).populate('faculty', 'name');
		let isNewUser = false;

		if (!user) {
			user = await User.findOne({ email: email.toLowerCase() }).populate('faculty', 'name');
			if (user) {
				// Link existing email-based account to Google
				user.googleId = googleId;
				if (!user.profilePicture && picture) user.profilePicture = picture;
				await user.save({ validateBeforeSave: false });
			} else {
				// Create new user — role defaults to student, profile completion required
				user = new User({
					name,
					email: email.toLowerCase(),
					googleId,
					profilePicture: picture || '',
					role: 'student',
					isVerified: true,
					isActive: true,
				});
				await user.save({ validateBeforeSave: false });
				isNewUser = true;
			}
		}

		if (!user.isActive) {
			return res.status(403).json({ message: 'Your account has been deactivated. Contact support.' });
		}

		await user.updateOne({ $set: { lastLogin: Date.now() } });

		const token = generateToken(user);
		res.json({
			token,
			isNewUser,
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
				profilePicture:     user.profilePicture     || null,
			},
		});
	} catch (err) {
		console.error('googleAuth error:', err);
		if (err.message && err.message.includes('Token used too late')) {
			return res.status(401).json({ message: 'Google token expired. Please try again.' });
		}
		res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
	}
};
