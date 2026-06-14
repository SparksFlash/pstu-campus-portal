const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
	faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
	semester: Number,
	obtainedMarks: Number,
	totalMarks: Number,
	percentage: Number,
	grade: String, // A+, A, B+, B, C+, C, D, F
	gpa: Number, // 4.0 scale
	gradePoint: String, // Legacy field for backward compatibility
	teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	status: { type: String, enum: ['draft', 'published'], default: 'draft' },
	publishedAt: Date,
	publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

module.exports = mongoose.model('Grade', gradeSchema);

