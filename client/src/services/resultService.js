import api from './api';

export const resultService = {
  generateResult: (studentId, semester) =>
    api.post('/results', { studentId, semester }),

  getStudentResults: (studentId) =>
    api.get(`/results/student/${studentId}`),

  getAllResults: () =>
    api.get('/results'),

  getResultById: (resultId) =>
    api.get(`/results/${resultId}`),

  downloadResultPDF: (resultId) =>
    api.get(`/results/${resultId}/pdf`, { responseType: 'blob' }),

  updateResult: (resultId, data) =>
    api.put(`/results/${resultId}`, data),

  deleteResult: (resultId) =>
    api.delete(`/results/${resultId}`),

  generateBulkResults: (semesterData) =>
    api.post('/results/generate-bulk', semesterData),
};
