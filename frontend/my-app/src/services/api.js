import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.patch('/auth/preferences', preferences),
};

export const aiAPI = {
  reviewCode: (data) => api.post('/ai/review', data),
  debugCode: (data) => api.post('/ai/debug', data),
  getApproaches: (data) => api.post('/ai/approaches', data),
  optimizeCode: (data) => api.post('/ai/optimize', data),
  chat: (message) => api.post('/ai/chat', { message }),
};

export const executeAPI = {
  runCode: (code, language, input) => api.post('/execute/run', { code, language, input }),
  getSuggestions: (code, language) => api.post('/execute/suggestions', { code, language }),
};

export const historyAPI = {
  getHistory: (params) => api.get('/history', { params }),
  getAnalysis: (id) => api.get(`/history/${id}`),
  deleteAnalysis: (id) => api.delete(`/history/${id}`),
  getAnalytics: () => api.get('/history/analytics/summary'),
};

export const codeAPI = {
  getHistory: (params) => api.get('/code/history', { params }),
  getReview: (id) => api.get(`/code/review/${id}`),
  deleteReview: (id) => api.delete(`/code/review/${id}`),
  getAnalytics: () => api.get('/code/analytics'),
};

export const notesAPI = {
  getNotes: (params) => api.get('/notes', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  getFolders: () => api.get('/notes/folders/list'),
  getTags: () => api.get('/notes/tags/list'),
};

export default api;