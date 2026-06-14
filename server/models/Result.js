const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	semester: { type: Number, required: true },
	faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
	courses: [{
		course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
		gpa: Number,
		gradePoint: String,
		creditHours: Number
	}],
	sgpa: Number,
	cgpa: Number,
	totalCredits: Number,
	earnedCredits: Number,
	generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	generatedAt: { type: Date, default: Date.now },
	printedAt: Date
});

module.exports = mongoose.model('Result', resultSchema);

