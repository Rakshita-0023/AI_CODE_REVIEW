import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.patch('/auth/preferences', preferences),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const projectAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  getStats: () => api.get('/projects/stats'),
  createProject: (data) => api.post('/projects', data),
  getProject: (id) => api.get(`/projects/${id}`),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

export const fileAPI = {
  getFiles: (projectId) => api.get(`/projects/${projectId}/files`),
  createFile: (projectId, data) => api.post(`/projects/${projectId}/files`, data),
  updateFile: (projectId, fileId, data) => api.put(`/projects/${projectId}/files/${fileId}`, data),
  deleteFile: (projectId, fileId) => api.delete(`/projects/${projectId}/files/${fileId}`),
};

// Helper to try Netlify function first, fallback to backend
const tryWithFallback = async (netlifyPath, backendPath, data) => {
  try {
    return await api.post(netlifyPath, data);
  } catch (error) {
    console.warn(`Netlify function failed, falling back to backend: ${error.message}`);
    return await api.post(backendPath, data);
  }
};

export const aiAPI = {
  reviewCode: (data) => tryWithFallback('/.netlify/functions/analyze', '/ai/review', { ...data, type: 'review' }),
  debugCode: (data) => tryWithFallback('/.netlify/functions/analyze', '/ai/debug', { ...data, type: 'debug' }),
  getApproaches: (data) => tryWithFallback('/.netlify/functions/analyze', '/ai/approaches', { ...data, type: 'approaches' }),
  optimizeCode: (data) => tryWithFallback('/.netlify/functions/analyze', '/ai/optimize', { ...data, type: 'optimize' }),
  chat: (data) => api.post('/ai/chat', data),
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

export const scratchpadAPI = {
  getScratchpads: (params) => api.get('/scratchpads', { params }),
  getWorkspaceScratchpads: (workspaceId) => api.get(`/scratchpads/${workspaceId}`),
  createScratchpad: (data) => api.post('/scratchpads', data),
  updateScratchpad: (id, data) => api.put(`/scratchpads/${id}`, data),
  deleteScratchpad: (id) => api.delete(`/scratchpads/${id}`),
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

export const trashAPI = {
  getTrash: (params) => api.get('/trash', { params }),
};

export default api;