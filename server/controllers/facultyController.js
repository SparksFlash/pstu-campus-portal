const Faculty = require('../models/Faculty');

exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().populate('dean', 'name email');
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('dean', 'name email');
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const { name, code, description, dean } = req.body;
    const faculty = new Faculty({ name, code, description, dean });
    await faculty.save();
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};