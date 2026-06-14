const mongoose = require('mongoose');

const phoneDiarySchema = new mongoose.Schema({
	category: String,
	department: String,
	contactPerson: String,
	designation: String,
	phone: String,
	email: String,
	address: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

module.exports = mongoose.model('PhoneDiary', phoneDiarySchema);

