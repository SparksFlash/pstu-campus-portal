import api from './api';

export const facultyService = {
  getAllFaculties: () =>
    api.get('/faculties'),

  getFacultyById: (facultyId) =>
    api.get(`/faculties/${facultyId}`),

  createFaculty: (facultyData) =>
    api.post('/faculties', facultyData),

  updateFaculty: (facultyId, data) =>
    api.put(`/faculties/${facultyId}`, data),

  deleteFaculty: (facultyId) =>
    api.delete(`/faculties/${facultyId}`),

  getFacultyCourses: (facultyId) =>
    api.get(`/faculties/${facultyId}/courses`),
};
