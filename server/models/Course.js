const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	code: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
	semester: { type: Number, min: 1, max: 8, required: true },
	creditHours: Number,
	totalMarks: { type: Number, default: 100 },
	teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	description: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

module.exports = mongoose.model('Course', courseSchema);

