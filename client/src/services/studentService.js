import api from './api';

const studentService = {
  getDashboardStats: () => api.get('/student/dashboard'),
};

export default studentService;
