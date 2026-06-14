import api from './api';

export const gradeService = {
  createGrade: (gradeData) =>
    api.post('/grades', gradeData),

  getStudentGrades: (studentId) =>
    api.get(`/grades/student/${studentId}`),

  getAllGrades: () =>
    api.get('/grades'),

  calculateCGPA: (studentId) =>
    api.post(`/grades/calculate-cgpa/${studentId}`),

  updateGrade: (gradeId, data) =>
    api.put(`/grades/${gradeId}`, data),

  deleteGrade: (gradeId) =>
    api.delete(`/grades/${gradeId}`),

  getGradesByTeacher: () =>
    api.get('/grades/teacher/entries'),

  uploadGradesCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/grades/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // New grading endpoints
  recordGrade: (gradeData) =>
    api.post('/grades/record-grade', gradeData),

  getStudentResults: (semester = null) => {
    const params = semester ? `?semester=${semester}` : '';
    return api.get(`/grades/my-results${params}`);
  },

  getTeacherStudents: () =>
    api.get('/grades/my-students'),
};

