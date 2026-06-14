import api from './api';

export const authService = {
  login: (credentials) =>
    api.post('/auth/login', credentials),

  register: (userData) =>
    api.post('/auth/register', userData),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  verifyToken: () =>
    api.get('/auth/verify'),

  refreshToken: () =>
    api.post('/auth/refresh'),

  updateProfile: (userData) =>
    api.put('/auth/profile', userData),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
};
