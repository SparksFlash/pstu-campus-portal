const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
	name: { type: String, unique: true, required: true, trim: true },
	code: { type: String, trim: true },
	description: { type: String, trim: true },
	dean: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	totalSemesters: { type: Number, default: 8 },
	totalStudentPerSemester: { type: Number, default: 80 },
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date,
});

module.exports = mongoose.model('Faculty', facultySchema);

