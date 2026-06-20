const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  universityName:    { type: String, required: true, trim: true },
  location:          { type: String, required: true, trim: true },
  type:              { type: String, required: true },
  estimatedStudents: { type: String },
  contactName:       { type: String, required: true, trim: true },
  contactEmail:      { type: String, required: true, trim: true, lowercase: true },
  contactPhone:      { type: String, required: true, trim: true },
  plan:              { type: String, required: true },
  message:           { type: String },
  status:            { type: String, enum: ['Pending', 'Active', 'Rejected'], default: 'Pending' },
  reviewedAt:        { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
