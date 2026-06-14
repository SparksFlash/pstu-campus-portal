const Result = require('../models/Result');
const Grade = require('../models/Grade');

exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('student faculty generatedBy');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).populate('courses.course');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.generateResult = async (req, res) => {
  try {
    const { student, semester, faculty, generatedBy } = req.body;
    const grades = await Grade.find({ student, semester, faculty }).populate('course');
    
    if (grades.length === 0) return res.status(400).json({ message: 'No grades found for this semester' });
    
    let sgpa = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    const courses = [];
    
    grades.forEach(g => {
      const course = g.course;
      const credits = course.creditHours || 3;
      totalCredits += credits;
      courses.push({
        course: g.course._id,
        gpa: g.gpa,
        gradePoint: g.gradePoint,
        creditHours: credits
      });
      sgpa += g.gpa * credits;
      if (g.gpa >= 2.0) earnedCredits += credits;
    });
    
    sgpa = sgpa / totalCredits;
    
    // Credit-weighted CGPA across all semesters for this student
    const allGrades = await Grade.find({ student }).populate('course', 'creditHours');
    const totalGradePoints = allGrades.reduce((sum, g) => sum + (g.gpa || 0) * (g.course?.creditHours || 3), 0);
    const allCredits = allGrades.reduce((sum, g) => sum + (g.course?.creditHours || 3), 0);
    const cgpa = allCredits > 0 ? parseFloat((totalGradePoints / allCredits).toFixed(2)) : 0;
    
    let result = await Result.findOne({ student, semester, faculty });
    if (result) {
      result.courses = courses;
      result.sgpa = sgpa;
      result.cgpa = cgpa;
      result.totalCredits = totalCredits;
      result.earnedCredits = earnedCredits;
      result.generatedBy = generatedBy;
      result.generatedAt = Date.now();
      await result.save();
    } else {
      result = new Result({
        student, semester, faculty, courses, sgpa, cgpa, totalCredits, earnedCredits, generatedBy
      });
      await result.save();
    }
    
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};