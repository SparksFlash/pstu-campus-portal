import api from './api';

export const classRoutineService = {
  getRoutine: (facultyId, semester) =>
    api.get('/class-routine', { params: { faculty: facultyId, semester } }),

  updateEntry: (data) =>
    api.patch('/class-routine/entry', data),

  clearEntry: (data) =>
    api.delete('/class-routine/entry', { data }),
};
