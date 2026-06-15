const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	password: { type: String, minlength: 6 },
	googleId: { type: String, unique: true, sparse: true },
	phone: String,
	role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
	faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
	profilePicture: String,
	address: String,
	dateOfBirth: Date,
	registrationNumber: String,
	employeeId: String,
	studentId: { type: String, unique: true, sparse: true },
	semester: { type: Number, min: 1, max: 8 },          // students only
	isActive: { type: Boolean, default: true },
	isVerified: { type: Boolean, default: false },
	verificationToken: String,
	verificationTokenExpires: Date,
	// Password reset
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	// Account lockout after repeated failed logins
	loginAttempts: { type: Number, default: 0 },
	lockUntil: Date,
	lastLogin: Date,
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

userSchema.pre('save', async function(next) {
	if (!this.isModified('password') || !this.password) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		return next();
	} catch (err) {
		return next(err);
	}
});

userSchema.virtual('isLocked').get(function () {
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.comparePassword = async function(enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Increment failed login attempts; lock account for 30 min after 5 failures
userSchema.methods.incLoginAttempts = async function () {
	const MAX_ATTEMPTS = 5;
	const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

	// If previous lock has expired, reset
	if (this.lockUntil && this.lockUntil < Date.now()) {
		return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
	}

	const updates = { $inc: { loginAttempts: 1 } };
	if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
		updates.$set = { lockUntil: Date.now() + LOCK_DURATION };
	}
	return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);

