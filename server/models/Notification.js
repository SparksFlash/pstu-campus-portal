const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      {
    type: String,
    enum: ['result_published', 'result_unpublished', 'notice_created', 'general'],
    default: 'general',
  },
  title:     { type: String, required: true },
  body:      { type: String },
  isRead:    { type: Boolean, default: false },
  meta:      { type: mongoose.Schema.Types.Mixed }, // e.g. { semester: 3 }
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
