// src/services/orderService.js
import { v4 as uuidv4 } from 'uuid';
import { portfolioService } from './portfolioService';
import { mockOrderApi } from './mock/orderMock';
import { USE_MOCK } from './apiClient';

const useMock = USE_MOCK;

// En memoria (mock) orders storage if using mock
let _orders = [];

export const orderService = {
  getOrders: async () => {
    if (useMock) return mockOrderApi.getOrders();
    const { data } = await fetch('/orders').then(r => r.json());
    return data;
  },

  placeOrder: async (payload) => {
    /**
     payload must contain:
       portfolioId, symbol, side ('buy'|'sell'), investAmount (number), orderType, qty?, limitPrice?, stopPrice?,
       portfolioValue (optional) OR availableFunds
    */
    if (useMock) {
      return mockOrderApi.placeOrder(payload);
    }

    // For real backend (placeholder)
    const res = await fetch('/orders', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json());
    return res;
  },

  cancelOrder: async (orderId) => {
    if (useMock) return mockOrderApi.cancelOrder(orderId);
    const res = await fetch(`/orders/${orderId}`, { method: 'DELETE' }).then(r => r.json());
    return res;
  },

  // Simulate market tick to fill pending orders (mock)
  runMarketTick: async () => {
    if (useMock) return mockOrderApi.runMarketTick();
    return null;
  }
};


// export const orderService = {
//   placeOrder: async (payload) => {
//     if (useMock) {
//       const order = await mockOrderApi.placeOrder(payload);
//       // Si la orden quedó filled inmediatamente, aplicarla sobre el portafolio
//       if (order.status === 'filled') {
//         try {
//           await portfolioService.applyOrder(order);
//         } catch (e) {
//           console.error('applyOrder error', e);
//         }
//       }
//       return order;
//     }
//     const { data } = await api.post('/orders', payload);
//     return data;
//   },

//   getOrders: async () => {
//     if (useMock) return mockOrderApi.getOrders();
//     const { data } = await api.get('/orders');
//     return data;
//   },

//   cancelOrder: async (orderId) => {
//     if (useMock) return mockOrderApi.cancelOrder(orderId);
//     const { data } = await api.delete(`/orders/${orderId}`);
//     return data;
//   },

//   // Simula tick de mercado que puede rellenar órdenes pending;
//   // el mock retorna órdenes actualizadas y aquí aplicamos las que pasen a filled
//   runMarketTick: async () => {
//     if (useMock) {
//       const updatedOrders = await mockOrderApi.runMarketTick();
//       const filled = updatedOrders.filter(o => o.prevStatus !== 'filled' && o.status === 'filled');
//       await Promise.all(filled.map(o => portfolioService.applyOrder(o).catch(e => console.error('applyOrder err', e))));
//       return updatedOrders;
//     }
//     return [];
//   }
// };


