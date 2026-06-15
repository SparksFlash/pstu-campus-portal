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

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email, otp, password) =>
    api.post('/auth/reset-password', { email, otp, password }),

  googleAuth: (credential) =>
    api.post('/auth/google', { credential }),
};
