import axios from 'axios';

// Determine base URL based on environment
// In development: uses Vite proxy ('/api')
// In production: uses VITE_API_URL or falls back to relative URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    // Production: use explicit API URL if provided
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  // Development: use Vite proxy
  // Production: use same origin (if backend is on same domain)
  return '/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
