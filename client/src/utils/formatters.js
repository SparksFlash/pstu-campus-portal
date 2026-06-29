export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCGPA = (cgpa) => {
  if (!cgpa) return '0.00';
  return parseFloat(cgpa).toFixed(2);
};

export const formatGrade = (grade) => {
  const gradeMap = {
    'A+': 4.0,
    'A': 3.75,
    'A-': 3.5,
    'B+': 3.25,
    'B': 3.0,
    'B-': 2.75,
    'C+': 2.5,
    'C': 2.25,
    'C-': 2.0,
    'D+': 1.75,
    'D': 1.5,
    'F': 0.0,
  };
  return gradeMap[grade] || 0;
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Converts semester number (1-8) to academic label
// 1→Level-1 Semester-I, 2→Level-1 Semester-II, 3→Level-2 Semester-I, etc.
export const semesterLabel = (n) => {
  const num = parseInt(n);
  if (!num || num < 1 || num > 8) return `Semester ${n}`;
  const level = Math.ceil(num / 2);
  const part  = num % 2 === 1 ? 'I' : 'II';
  return `Level-${level} Semester-${part}`;
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};
