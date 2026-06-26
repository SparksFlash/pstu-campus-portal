import api from './api';

const paymentService = {
  // Fee config
  getFeeConfig: ()                        => api.get('/payments/fee-config'),
  setFeeConfig: (data)                    => api.post('/payments/fee-config', data),

  // Dynamic fee breakdown based on semester courses
  getFeeBreakdown: (semester) => api.get(`/payments/fee-breakdown/${semester}`),

  // Initiate payment — returns { GatewayPageURL, tranId }
  initiatePayment: (semester, academicYear) =>
    api.post('/payments/initiate', { semester, academicYear }),

  // Student history
  getMyPayments: ()                       => api.get('/payments/my'),
  getPaymentByTranId: (tranId)            => api.get(`/payments/by-tran/${tranId}`),
  getSemesterPaymentStatus: (semester)    => api.get(`/payments/semester-status/${semester}`),

  // Admin
  getAllPayments: (params)                => api.get('/payments/admin/all', { params }),
  getPaymentStats: ()                     => api.get('/payments/admin/stats'),
};

export default paymentService;
