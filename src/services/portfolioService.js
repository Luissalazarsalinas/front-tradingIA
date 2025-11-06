// src/services/portfolioService.js
import api from './apiClient';
import { mockPortfolioApi } from './mock/portfolioMock';
import { USE_MOCK } from './apiClient';

const useMock = USE_MOCK;

export const portfolioService = {
  getPortfolio: async () => {
    if (useMock) return mockPortfolioApi.getPortfolio();
    const { data } = await api.get('/portfolio');
    return data;
  },

  createPortfolio: async (payload) => {
    if (useMock) return mockPortfolioApi.createPortfolio(payload);
    const { data } = await api.post('/portfolio', payload);
    return data;
  },

  updatePortfolio: async (id, patch) => {
    if (useMock) return mockPortfolioApi.updatePortfolio(id, patch);
    const { data } = await api.patch(`/portfolio/${id}`, patch);
    return data;
  },

  /**
   * Aplica una orden (buy/sell) al portafolio: ajusta holdings, cash y recalcula metrics.
   * order => { orderId, portfolioId, symbol, side, investAmount, qty, orderType, price, createdAt, status }
   */
  applyOrder: async (order) => {
    if (useMock) return mockPortfolioApi.applyOrder(order);
    const { data } = await api.post('/portfolio/apply-order', order);
    return data;
  }
};


// export const portfolioService = {
//   getPortfolio: async () => {
//     if (useMock) return mockPortfolioApi.getPortfolio();
//     const { data } = await api.get('/portfolio');
//     return data;
//   },

//   createPortfolio: async (payload) => {
//     if (useMock) return mockPortfolioApi.createPortfolio(payload);
//     const { data } = await api.post('/portfolio', payload);
//     return data;
//   },

//   updatePortfolio: async (id, patch) => {
//     if (useMock) return mockPortfolioApi.updatePortfolio(id, patch);
//     const { data } = await api.patch(`/portfolio/${id}`, patch);
//     return data;
//   },

//   // Nuevo: aplicar una orden (buy/sell) al portafolio
//   applyOrder: async (order) => {
//     if (useMock) return mockPortfolioApi.applyOrder(order);
//     const { data } = await api.post('/portfolio/apply-order', order);
//     return data;
//   }
// };


