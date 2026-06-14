const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  faculty:         { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  semester:        { type: Number, required: true, min: 1, max: 8 },
  academicYear:    { type: String },
  purpose:         { type: String, default: 'semester_fee' },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: 'BDT' },
  status:          { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },

  // SSLCommerz identifiers
  tranId:          { type: String, required: true, unique: true }, // our generated ID
  valId:           { type: String },                               // SSLCommerz val_id on success
  bankTranId:      { type: String },                               // bank transaction ID

  // Raw gateway response (stored for audit)
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },

  paidAt:          { type: Date },
  createdAt:       { type: Date, default: Date.now },
});

paymentSchema.index({ student: 1, semester: 1, status: 1 });
paymentSchema.index({ faculty: 1, status: 1, createdAt: -1 });
paymentSchema.index({ tranId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
