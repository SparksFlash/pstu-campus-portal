const Institution = require('../models/Institution');

// POST /api/v1/institutions  — public, no auth
exports.register = async (req, res) => {
  try {
    const { universityName, location, type, estimatedStudents, contactName, contactEmail, contactPhone, plan, message } = req.body;
    if (!universityName || !location || !type || !contactName || !contactEmail || !contactPhone || !plan) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }
    const institution = await Institution.create({
      universityName, location, type, estimatedStudents,
      contactName, contactEmail, contactPhone, plan, message,
    });
    res.status(201).json({ message: 'Registration request submitted successfully.', institution });
  } catch (err) {
    console.error('Institution register error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// GET /api/v1/institutions  — admin only
exports.getAll = async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ createdAt: -1 });
    res.json({ institutions });
  } catch (err) {
    console.error('Institution getAll error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/v1/institutions/:id/status  — admin only
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Active or Rejected.' });
    }
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date() },
      { new: true }
    );
    if (!institution) return res.status(404).json({ message: 'Institution not found.' });
    res.json({ message: `Institution ${status.toLowerCase()} successfully.`, institution });
  } catch (err) {
    console.error('Institution updateStatus error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
