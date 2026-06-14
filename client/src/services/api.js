import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Unauthorized -> clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Rate limit hit
    if (error.response?.status === 429) {
      return Promise.reject({ message: 'Too many requests. Please wait a moment and try again.' });
    }

    // Network / CORS errors (no response) -> provide helpful message
    if (!error.response) {
      console.error('API network error:', error.message || error);
      return Promise.reject({ message: 'Cannot reach the server. Make sure the backend is running on port 5000.' });
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
