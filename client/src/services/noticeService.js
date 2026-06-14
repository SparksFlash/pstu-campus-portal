import api from './api';

export const noticeService = {
  getAllNotices: () =>
    api.get('/notices'),

  getNoticeById: (noticeId) =>
    api.get(`/notices/${noticeId}`),

  createNotice: (noticeData) =>
    api.post('/notices', noticeData),

  updateNotice: (noticeId, data) =>
    api.put(`/notices/${noticeId}`, data),

  deleteNotice: (noticeId) =>
    api.delete(`/notices/${noticeId}`),

  getLatestNotices: (limit = 10) =>
    api.get('/notices/latest', { params: { limit } }),

  searchNotices: (query) =>
    api.get('/notices/search', { params: { q: query } }),
};
