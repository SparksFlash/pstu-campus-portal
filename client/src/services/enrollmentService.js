import api from './api';

const enrollmentService = {
  getAvailableCourses: (semester) => {
    const params = semester ? `?semester=${semester}` : '';
    return api.get(`/enrollments/available${params}`);
  },

  getMyEnrollments: (semester, status) => {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (status)   params.append('status', status);
    const qs = params.toString();
    return api.get(`/enrollments${qs ? `?${qs}` : ''}`);
  },

  enrollCourse: (courseId, academicYear) =>
    api.post('/enrollments', { courseId, academicYear }),

  dropCourse: (enrollmentId) =>
    api.delete(`/enrollments/${enrollmentId}`),
};

export default enrollmentService;
