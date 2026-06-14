import api from './api';

export const userService = {
  getAllUsers: () =>
    api.get('/users'),

  getUsers: (params) =>
    api.get('/users', { params }),

  getUserById: (userId) =>
    api.get(`/users/${userId}`),

  getUserProfile: () =>
    api.get('/users/profile/me'),

  updateUserProfile: (data) =>
    api.put('/users/profile/me', data),
  changePassword: (data) =>
    api.put('/users/profile/change-password', data),
  uploadProfilePhoto: (formData, onUploadProgress) =>
    api.post('/users/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }),
  getStudents: (params) =>
    api.get('/users/students', { params }),
  getByRole: (role, params) =>
    api.get(`/users/role/${role}`, { params }),

  createUser: (userData) =>
    api.post('/users', userData),

  updateUser: (userId, userData) =>
    api.put(`/users/${userId}`, userData),

  deleteUser: (userId) =>
    api.delete(`/users/${userId}`),

  searchUsers: (query) =>
    api.get('/users/search', { params: { q: query } }),
};
