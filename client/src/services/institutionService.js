import api from './api';

export const institutionService = {
  register:     (data)         => api.post('/institutions', data),
  getAll:       ()             => api.get('/institutions'),
  updateStatus: (id, status)   => api.patch(`/institutions/${id}/status`, { status }),
};
