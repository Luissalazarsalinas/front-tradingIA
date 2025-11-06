// src/services/mock/orderMock.js
import { mockPortfolioApi } from '../mock/portfolioMock';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock orders implementation.
 * Stores orders in localStorage (coordinado con storage key used by portfolioMock).
 */

const STORAGE_ORDERS = 'tradingia_orders_v1';
const readOrders = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]'); } catch { return []; }
};
const writeOrders = (o) => localStorage.setItem(STORAGE_ORDERS, JSON.stringify(o));

const simulate = (data, delay = 350) => new Promise(res => setTimeout(() => res(data), delay));

const getOrders = async () => {
  return simulate(readOrders());
};

const placeOrder = async (payload) => {
  // normalize numbers
  const investAmount = Number(payload.investAmount || 0);
  const availableFunds = Number(payload.availableFunds ?? payload.portfolioValue ?? 0);

  // create order object
  const order = {
    orderId: payload.orderId || uuidv4(),
    portfolioId: payload.portfolioId || payload.portfolio?.portfolioId || null,
    symbol: payload.symbol,
    side: payload.side,
    orderType: payload.orderType || 'market',
    qty: payload.qty || null,
    investAmount,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  // load portfolio from mock to validate funds (uses portfolioMock internals)
  const portfolio = await mockPortfolioApi.getPortfolio(); // returns current user's primary portfolio in mock
  const funds = Number(portfolio?.metrics?.cash ?? portfolio?.metrics?.portfolioValue ?? 0);

  // Validate funds for buy orders
  if (order.side === 'buy') {
    if (investAmount <= 0) {
      throw new Error('Invest amount must be > 0');
    }
    if (investAmount > funds) {
      throw new Error('Fondos insuficientes para esta compra según presupuesto disponible');
    }
  }

  // Save order to storage
  const all = readOrders();
  all.unshift(order);
  writeOrders(all);

  // Auto-execute market buy/sell immediately
  if (order.orderType === 'market') {
    // mark filled
    order.status = 'filled';
    order.filledAt = new Date().toISOString();
    // persist change
    const updated = [order, ...readOrders().filter(o => o.orderId !== order.orderId)];
    writeOrders(updated);

    // Apply order to portfolio (mutates mock portfolio)
    try {
      await mockPortfolioApi.applyOrder(order);
    } catch (e) {
      // If the portfolio apply fails, mark order as failed
      order.status = 'failed';
      order.error = e.message || e;
      const rollback = [order, ...readOrders().filter(o => o.orderId !== order.orderId)];
      writeOrders(rollback);
      throw e;
    }
  } else {
    // limit/stop remain pending for later runMarketTick simulation
  }

  return simulate(order, 300);
};

const cancelOrder = async (orderId) => {
  const all = readOrders().map(o => (o.orderId === orderId ? { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() } : o));
  writeOrders(all);
  return simulate({ orderId, status: 'cancelled' }, 180);
};

const runMarketTick = async () => {
  // For simplicity: fill all pending orders on each tick (demo behavior)
  const orders = readOrders();
  const pending = orders.filter(o => o.status === 'pending');
  for (const o of pending) {
    // naive fill
    o.status = 'filled';
    o.filledAt = new Date().toISOString();
    try {
      await mockPortfolioApi.applyOrder(o);
    } catch (e) {
      o.status = 'failed';
      o.error = e.message || e;
    }
  }
  writeOrders(orders);
  return simulate(pending, 400);
};

export const mockOrderApi = {
  getOrders,
  placeOrder,
  cancelOrder,
  runMarketTick
};


// const simulate = (data, delay = 250) => new Promise(res => setTimeout(() => res(data), delay));

// let ORDERS = [];

// /**
//  * Helper: clone orders list for safe returns
//  */
// const cloneOrders = () => ORDERS.map(o => ({ ...o }));

// export const mockOrderApi = {
//   placeOrder: async (payload) => {
//     // payload expects: { symbol, side, orderType, qty, limitPrice?, stopPrice?, investAmount?, price? }
//     const now = new Date().toISOString();
//     // Determine investAmount if not provided
//     const investAmount = typeof payload.investAmount === 'number' && payload.investAmount > 0
//       ? Number(payload.investAmount)
//       : (payload.qty && payload.price ? Number(payload.qty) * Number(payload.price) : null);

//     // market orders execute immediately (mock)
//     const status = payload.orderType === 'market' ? 'filled' : 'pending';

//     const order = {
//       id: `ord_${Date.now().toString(36)}`,
//       symbol: payload.symbol,
//       name: payload.name || payload.symbol,
//       side: payload.side || 'buy',
//       orderType: payload.orderType || 'market',
//       qty: payload.qty || 1,
//       price: payload.price || payload.limitPrice || payload.stopPrice || null,
//       investAmount: investAmount ?? (payload.qty ? payload.qty * (payload.price || 1) : 0),
//       status,
//       createdAt: now,
//       executedAt: status === 'filled' ? now : null,
//       prevStatus: null
//     };

//     ORDERS.unshift(order);
//     return simulate(order, 200);
//   },

//   getOrders: async () => simulate(cloneOrders(), 120),

//   cancelOrder: async (id) => {
//     ORDERS = ORDERS.map(o => o.id === id ? { ...o, prevStatus: o.status, status: 'cancelled' } : o);
//     return simulate({ ok: true }, 120);
//   },

//   runMarketTick: async () => {
//     // Simulamos que algunas pending pasan a filled aleatoriamente
//     ORDERS = ORDERS.map(o => {
//       const prev = { ...o, prevStatus: o.status };
//       if (o.status === 'pending') {
//         // 50% chance a filled
//         if (Math.random() > 0.5) {
//           return { ...prev, status: 'filled', executedAt: new Date().toISOString() };
//         }
//       }
//       return prev;
//     });
//     return simulate(cloneOrders(), 300);
//   }
// };



