import api from './api';

export const adminService = {
  getStats: () =>
    api.get('/admin/stats'),

  getAuditLogs: (params) =>
    api.get('/admin/audit-logs', { params }),

  getAllUsers: (params) =>
    api.get('/admin/users', { params }),

  toggleUserActive: (userId) =>
    api.patch(`/admin/users/${userId}/toggle-active`),

  updateUser: (userId, data) =>
    api.patch(`/admin/users/${userId}`, data),
};
