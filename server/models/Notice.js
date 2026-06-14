const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
	attachments: [String],
	isActive: { type: Boolean, default: true },
	publishDate: Date,
	expiryDate: Date,
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

module.exports = mongoose.model('Notice', noticeSchema);

