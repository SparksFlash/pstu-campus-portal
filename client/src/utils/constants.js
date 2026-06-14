export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  GRADES: '/grades',
  RESULTS: '/results',
  COURSES: '/courses',
  FACULTIES: '/faculties',
  NOTICES: '/notices',
  BUS_SCHEDULE: '/bus-schedule',
  PHONE_DIARY: '/phone-diary',
};

export const GRADE_OPTIONS = [
  { value: 'A+', label: 'A+ (4.0)' },
  { value: 'A', label: 'A (3.75)' },
  { value: 'A-', label: 'A- (3.5)' },
  { value: 'B+', label: 'B+ (3.25)' },
  { value: 'B', label: 'B (3.0)' },
  { value: 'B-', label: 'B- (2.75)' },
  { value: 'C+', label: 'C+ (2.5)' },
  { value: 'C', label: 'C (2.25)' },
  { value: 'C-', label: 'C- (2.0)' },
  { value: 'D+', label: 'D+ (1.75)' },
  { value: 'D', label: 'D (1.5)' },
  { value: 'F', label: 'F (0.0)' },
];

export const SEMESTER_OPTIONS = [
  { value: '1-1', label: '1st Year 1st Semester' },
  { value: '1-2', label: '1st Year 2nd Semester' },
  { value: '2-1', label: '2nd Year 1st Semester' },
  { value: '2-2', label: '2nd Year 2nd Semester' },
  { value: '3-1', label: '3rd Year 1st Semester' },
  { value: '3-2', label: '3rd Year 2nd Semester' },
  { value: '4-1', label: '4th Year 1st Semester' },
  { value: '4-2', label: '4th Year 2nd Semester' },
];

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_TIMEOUT = 30000;
