import api from './api';

export const courseService = {
  getAllCourses: (params) =>
    api.get('/courses', { params }),

  getCourseById: (courseId) =>
    api.get(`/courses/${courseId}`),

  createCourse: (courseData) =>
    api.post('/courses', courseData),

  updateCourse: (courseId, data) =>
    api.put(`/courses/${courseId}`, data),

  deleteCourse: (courseId) =>
    api.delete(`/courses/${courseId}`),

  searchCourses: (query) =>
    api.get('/courses/search', { params: { q: query } }),

  getCoursesWithEnrollment: () =>
    api.get('/courses/with-enrollment'),

  // New grading-related endpoints
  getTeacherCourses: () =>
    api.get('/courses/my-courses'),

  getCourseStudents: (courseId) =>
    api.get(`/courses/${courseId}/students`),

  recordGrade: (gradeData) =>
    api.post('/grades/record-grade', gradeData),
};

