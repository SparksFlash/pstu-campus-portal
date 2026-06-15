import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://pstu-api.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 70000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — with auto-retry on cold start
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config;

    // Auto-retry once on network/timeout error (Render free tier cold start)
    if (!error.response && !config._retried) {
      config._retried = true;
      await new Promise((r) => setTimeout(r, 5000));
      return api(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (error.response?.status === 429) {
      return Promise.reject({ message: 'Too many requests. Please wait a moment and try again.' });
    }

    if (!error.response) {
      return Promise.reject({
        message: 'Server is unavailable. Please try again in a moment.',
      });
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
