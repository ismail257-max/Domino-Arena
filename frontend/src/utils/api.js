import axios from 'axios';
import { getToken, removeToken } from '../services/authService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (e.g., token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto-logout on 401 error
      console.log('Authentication error. Logging out.');
      removeToken();
      // Reloading the page will redirect to the login page via ProtectedRoute logic
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
