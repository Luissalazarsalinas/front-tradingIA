// src/services/authService.js
import { mockApi } from './apiMock';
const AUTH_KEY = 'tradingia_auth_v1';

export const authService = {
  register: async (payload) => {
    // Registra el usuario y retorna el objeto resultante.
    // En esta versión NO se requiere confirmación por email.
    return mockApi.register(payload);
  },

  confirmEmail: async (token) => {
    // Compatibilidad: no-op en el mock actual
    return mockApi.confirmEmail(token);
  },

  login: async (email, password) => {
    return mockApi.login(email, password);
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY);
    return mockApi.logout();
  },

  updateProfile: async (userId, patch) => {
    return mockApi.updateProfile(userId, patch);
  },

  changePassword: async (userId, oldP, newP) => {
    return mockApi.changePassword(userId, oldP, newP);
  },

  getStoredAuth: () => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  },

  getToken: () => {
    try {
      const a = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      return a?.token || null;
    } catch {
      return null;
    }
  }
};
