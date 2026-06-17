const ClassRoutine = require('../models/ClassRoutine');

// GET /api/v1/class-routine?faculty=&semester=
exports.getRoutine = async (req, res) => {
  try {
    const { faculty, semester } = req.query;
    if (!faculty || !semester) {
      return res.status(400).json({ message: 'faculty and semester are required' });
    }
    const routine = await ClassRoutine.findOne({ faculty, semester: parseInt(semester) })
      .populate('faculty', 'name code')
      .populate('createdBy', 'name');
    res.json(routine || { entries: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/v1/class-routine/entry  — upsert a single cell
exports.updateEntry = async (req, res) => {
  try {
    const { faculty, semester, day, timeSlot, courseCode, courseTitle, course, teacher, teacherName, room } = req.body;
    if (!faculty || !semester || !day || !timeSlot) {
      return res.status(400).json({ message: 'faculty, semester, day and timeSlot are required' });
    }

    const entry = { day, timeSlot, courseCode, courseTitle, course: course || undefined, teacher: teacher || undefined, teacherName, room };

    // Pull existing entry for this slot, then push the new one (upsert the routine doc)
    const routine = await ClassRoutine.findOneAndUpdate(
      { faculty, semester: parseInt(semester) },
      {
        $setOnInsert: { faculty, semester: parseInt(semester), createdBy: req.user._id },
        $pull: { entries: { day, timeSlot } },
      },
      { upsert: true, new: true }
    );

    // Now push the new entry
    routine.entries.push(entry);
    routine.updatedAt = Date.now();
    await routine.save();

    res.json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/v1/class-routine/entry  — clear a single cell
exports.clearEntry = async (req, res) => {
  try {
    const { faculty, semester, day, timeSlot } = req.body;
    if (!faculty || !semester || !day || !timeSlot) {
      return res.status(400).json({ message: 'faculty, semester, day and timeSlot are required' });
    }

    const routine = await ClassRoutine.findOneAndUpdate(
      { faculty, semester: parseInt(semester) },
      { $pull: { entries: { day, timeSlot } }, $set: { updatedAt: Date.now() } },
      { new: true }
    );

    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json({ message: 'Entry cleared', routine });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
