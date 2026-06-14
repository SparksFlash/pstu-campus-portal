const { getGradeForPercentage, calculatePercentage } = require('./gradingScale');

// Thin wrappers — all grading logic lives in gradingScale.js
exports.calculateGPA = (marks, total) => {
  const percentage = calculatePercentage(marks, total);
  return getGradeForPercentage(percentage).gpa;
};

exports.getGradePoint = (marks, total) => {
  const percentage = calculatePercentage(marks, total);
  return getGradeForPercentage(percentage).grade;
};

// Credit-weighted cumulative GPA from an array of { gpa, creditHours } objects
exports.calculateCGPA = (grades) => {
  if (!grades || grades.length === 0) return 0;
  let totalGradePoints = 0;
  let totalCredits = 0;
  grades.forEach((g) => {
    const credits = g.creditHours || g.credits || 3;
    totalGradePoints += (g.gpa || 0) * credits;
    totalCredits += credits;
  });
  return totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
};
