const BusSchedule = require('../models/BusSchedule');

exports.getAllBuses = async (req, res) => {
  try {
    const buses = await BusSchedule.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await BusSchedule.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBus = async (req, res) => {
  try {
    const { busNumber, routeName, pickupPoints, dropPoints, daysOfOperation, driver, phone, capacity } = req.body;
    const bus = new BusSchedule({
      busNumber, routeName, pickupPoints, dropPoints, daysOfOperation, driver, phone, capacity
    });
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBus = async (req, res) => {
  try {
    const bus = await BusSchedule.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const bus = await BusSchedule.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Bus deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};