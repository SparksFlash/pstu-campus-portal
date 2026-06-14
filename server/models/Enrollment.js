const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester:     { type: Number, required: true, min: 1, max: 8 },
  academicYear: { type: String },
  status:       { type: String, enum: ['enrolled', 'dropped', 'completed'], default: 'enrolled' },
  enrolledAt:   { type: Date, default: Date.now },
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, semester: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
