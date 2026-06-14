const mongoose = require('mongoose');

const feeConfigSchema = new mongoose.Schema({
  semester:     { type: Number, required: true, min: 1, max: 8, unique: true },
  amount:       { type: Number, required: true, min: 0 },
  currency:     { type: String, default: 'BDT' },
  description:  { type: String },
  academicYear: { type: String },
  updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('FeeConfig', feeConfigSchema);
