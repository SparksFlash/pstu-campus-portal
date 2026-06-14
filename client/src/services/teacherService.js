import api from './api';

const teacherService = {
  getStudentsBySemester: (semester) =>
    api.get(`/teacher/students/semester/${semester}`),

  getStudentDetails: (studentId, semester) =>
    api.get(`/teacher/student/${studentId}/semester/${semester}`),

  enterMarks: (marksData) =>
    api.post('/teacher/marks/enter', marksData),

  bulkEnterMarks: (studentId, semester, marksData) =>
    api.post('/teacher/marks/bulk-enter', { studentId, semester, marksData }),

  generateMarksheet: (studentId, semester) =>
    api.get(`/teacher/marksheet/${studentId}/semester/${semester}`),

  generateResult: (studentId) =>
    api.get(`/teacher/result/${studentId}`),

  getStats: () =>
    api.get('/teacher/stats'),

  getSemesterPublishStatus: (semester) =>
    api.get(`/teacher/publish/${semester}`),

  publishSemesterResults: (semester) =>
    api.post(`/teacher/publish/${semester}`),

  unpublishSemesterResults: (semester) =>
    api.post(`/teacher/unpublish/${semester}`),

  bulkCSVImport: (semester, rows) =>
    api.post('/teacher/marks/bulk-csv', { semester, rows }),
};

export default teacherService;
