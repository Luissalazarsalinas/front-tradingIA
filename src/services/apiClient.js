import axios from 'axios';
import { authService } from './authService';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true' || true; // default true in dev

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

api.interceptors.response.use((res) => res, (err) => {
  // You can inspect err.response.status to handle global errors (401, 403...)
  return Promise.reject(err);
});

export { api, USE_MOCK };
export default api;