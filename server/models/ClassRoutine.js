const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  day:         { type: String, required: true },
  timeSlot:    { type: String, required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseCode:  String,
  courseTitle: String,
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: String,
  room:        String,
}, { _id: false });

const classRoutineSchema = new mongoose.Schema({
  faculty:     { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  semester:    { type: Number, min: 1, max: 8, required: true },
  entries:     [entrySchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   Date,
});

classRoutineSchema.index({ faculty: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ClassRoutine', classRoutineSchema);
