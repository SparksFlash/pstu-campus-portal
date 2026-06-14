import api from './api';

export const phoneService = {
  getAllPhoneEntries: () =>
    api.get('/phone-diary'),

  getPhoneEntryById: (entryId) =>
    api.get(`/phone-diary/${entryId}`),

  createPhoneEntry: (entryData) =>
    api.post('/phone-diary', entryData),

  updatePhoneEntry: (entryId, data) =>
    api.put(`/phone-diary/${entryId}`, data),

  deletePhoneEntry: (entryId) =>
    api.delete(`/phone-diary/${entryId}`),

  searchPhoneEntries: (query) =>
    api.get('/phone-diary/search', { params: { q: query } }),

  getPhoneEntriesByDepartment: (department) =>
    api.get(`/phone-diary/department/${department}`),
};
