import api from './apiClient';
import { mockNotifApi } from './mock/notificationMock';
import { USE_MOCK } from './apiClient';

const useMock = USE_MOCK;

/**
 * Key localStorage para notificaciones persistentes en modo mock
 */
const LS_KEY = 'tradingia_notifications_v1';

const genId = (prefix = 'n') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;

const nowISO = () => new Date().toISOString();

const readLocalNotifs = () => {
  try {
    const raw = localStorage.getItem(LS_KEY) || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeLocalNotifs = (arr) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch (e) {
    // ignore storage errors in dev
    // console.warn('No se pudo guardar notificaciones en localStorage', e);
  }
};

export const notificationService = {
  getAiRecommendations: async () => {
    if (useMock) {
      // delegar al mock (genera recomendaciones basadas en holdings)
      return mockNotifApi.getAiRecommendations();
    }
    const { data } = await api.get('/notifications/ai');
    return data;
  },

  getRecentNotifications: async () => {
    if (useMock) {
      // devolver notificaciones persistidas en localStorage si existen,
      // si no hay nada, caer al mock para obtener items iniciales
      const persisted = readLocalNotifs();
      if (persisted && persisted.length) return persisted;
      const fallback = await mockNotifApi.getRecentNotifications();
      // persistimos el fallback para pruebas posteriores
      writeLocalNotifs(fallback);
      return fallback;
    }
    const { data } = await api.get('/notifications');
    return data;
  },

  /**
   * pushNotification / addNotification
   * - En modo mock: persiste la notificación en localStorage y la devuelve.
   * - En modo real: hace POST a la API.
   *
   * payload: { title, when?, status?, ... }
   */
  pushNotification: async (payload = {}) => {
    if (useMock) {
      const list = readLocalNotifs();
      const item = {
        id: genId('n'),
        title: payload.title || 'Notificación',
        when: payload.when || nowISO(),
        status: payload.status || 'info',
        ...payload
      };
      list.unshift(item);
      writeLocalNotifs(list);
      return item;
    }
    const { data } = await api.post('/notifications', payload);
    return data;
  },

  // Alias para compatibilidad con versiones previas
  addNotification: async (payload = {}) => {
    return notificationService.pushNotification(payload);
  }
};