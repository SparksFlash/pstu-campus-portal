const mongoose = require('mongoose');

const busScheduleSchema = new mongoose.Schema({
	busNumber: { type: String, required: true, unique: true },
	routeName: String,
	pickupPoints: [{ location: String, time: String }],
	dropPoints: [{ location: String, time: String }],
	daysOfOperation: [String],
	driver: String,
	phone: String,
	capacity: Number,
	createdAt: { type: Date, default: Date.now },
	updatedAt: Date
});

module.exports = mongoose.model('BusSchedule', busScheduleSchema);

