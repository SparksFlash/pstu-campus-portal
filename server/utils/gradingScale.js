// Grading scale: percentage -> grade object
const GRADING_SCALE = [
  { minPercentage: 80, maxPercentage: 100, grade: 'A+', gpa: 4.00 },
  { minPercentage: 75, maxPercentage: 79, grade: 'A', gpa: 3.75 },
  { minPercentage: 70, maxPercentage: 74, grade: 'A-', gpa: 3.50 },
  { minPercentage: 65, maxPercentage: 69, grade: 'B+', gpa: 3.25 },
  { minPercentage: 60, maxPercentage: 64, grade: 'B', gpa: 3.00 },
  { minPercentage: 55, maxPercentage: 59, grade: 'B-', gpa: 2.75 },
  { minPercentage: 50, maxPercentage: 54, grade: 'C+', gpa: 2.50 },
  { minPercentage: 45, maxPercentage: 49, grade: 'C', gpa: 2.25 },
  { minPercentage: 40, maxPercentage: 44, grade: 'D', gpa: 2.00 },
  { minPercentage: 0, maxPercentage: 39, grade: 'F', gpa: 0.00 },
];

/**
 * Get grade and GPA for a given percentage
 * @param {number} percentage - Marks percentage (0-100)
 * @returns {object} { grade, gpa }
 */
exports.getGradeForPercentage = (percentage) => {
  if (percentage < 0 || percentage > 100) {
    return { grade: 'F', gpa: 0.00 };
  }
  const result = GRADING_SCALE.find(
    (scale) => percentage >= scale.minPercentage && percentage <= scale.maxPercentage
  );
  return result || { grade: 'F', gpa: 0.00 };
};

/**
 * Calculate percentage from obtained marks and total marks
 * @param {number} obtainedMarks
 * @param {number} totalMarks
 * @returns {number} percentage
 */
exports.calculatePercentage = (obtainedMarks, totalMarks) => {
  if (totalMarks <= 0) return 0;
  return (obtainedMarks / totalMarks) * 100;
};

/**
 * Get all grading scale rules
 */
exports.getGradingScale = () => GRADING_SCALE;
