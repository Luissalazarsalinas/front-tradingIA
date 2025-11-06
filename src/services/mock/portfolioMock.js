// src/services/mock/portfolioMock.js
const STORAGE_KEY = 'tradingia_users_v1';
const simulate = (data, delay = 600) => new Promise(res => setTimeout(() => res(data), delay));

const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const writeUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

// sets of assets (>=8 por perfil) — te pedí esto antes: ahora hay >8 por perfil
const ASSETS_BY_PROFILE = {
  CONSERVADOR: [
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', pnlPct: 0.6 },
    { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond', pnlPct: 0.45 },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF', pnlPct: 0.9 },
    { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', pnlPct: 1.1 },
    { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', pnlPct: 0.4 },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', pnlPct: 0.7 },
    { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond', pnlPct: 0.5 },
    { symbol: 'TIP', name: 'iShares TIPS Bond ETF', pnlPct: 0.35 }
  ],
  MODERADO: [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', pnlPct: 1.4 },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', pnlPct: 1.2 },
    { symbol: 'IJH', name: 'iShares Core S&P Mid-Cap', pnlPct: 1.8 },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', pnlPct: 2.1 },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF', pnlPct: 0.9 },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', pnlPct: 0.7 },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', pnlPct: 1.0 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', pnlPct: 2.5 }
  ],
  AGRESIVO: [
    { symbol: 'NVDA', name: 'NVIDIA Corp.', pnlPct: 6.2 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', pnlPct: 4.1 },
    { symbol: 'ARKK', name: 'ARK Innovation ETF', pnlPct: 2.8 },
    { symbol: 'BTC', name: 'Bitcoin (proxy)', pnlPct: 9.7 },
    { symbol: 'SOXL', name: 'Direxion Semiconductor 3x', pnlPct: 12.4 },
    { symbol: 'ETH', name: 'Ethereum (proxy)', pnlPct: 7.1 },
    { symbol: 'PLTR', name: 'Palantir', pnlPct: 3.2 },
    { symbol: 'COIN', name: 'Coinbase', pnlPct: 5.0 }
  ]
};

// compute metrics helper (now supports cash)
const computeMetrics = (holdings, baseValue = 1000000, cash = 0) => {
  const holdingsValue = holdings.reduce((s, h) => s + (h.value || 0), 0);
  const portfolioValue = Math.round(baseValue); // We'll update below to be cash + holdingsValue
  // If holdings have no explicit value but have allocationPct, derive values
  let holdingsTotal = holdingsValue;
  if (holdingsTotal === 0 && holdings.length) {
    // if allocations given: compute value from allocationPct
    const sumAlloc = holdings.reduce((s, h) => s + (h.allocationPct || 0), 0) || 100;
    holdingsTotal = Math.round(baseValue * (sumAlloc / 100));
    holdings.forEach(h => {
      h.value = Math.round(baseValue * ((h.allocationPct || 0) / sumAlloc));
    });
  }
  const totalCapital = Math.round((cash || 0) + holdingsTotal);
  // compute weightedReturn from each holding pnlPct (pnlPct is percent)
  const weightedReturn = holdings.reduce((s, h) => {
    const hv = Number(h.value || 0);
    if (!hv) return s;
    return s + ((hv / Math.max(1, totalCapital)) * (Number(h.pnlPct || 0)));
  }, 0);
  const totalReturnPct = Number((weightedReturn / 100).toFixed(4));
  const totalReturnAmount = Math.round(totalCapital * totalReturnPct);

  // simple sharpe based on weightedReturn (mock)
  const sharpe = Math.max(0.2, Math.min(3.5, (weightedReturn / 5)));
  // max drawdown negative as inverse-ish
  const maxDrawdown = -Math.min(40, Math.round((1 / Math.max(0.1, sharpe)) * 10) * 1);

  return {
    totalCapital,
    portfolioValue: totalCapital,
    cash: Math.round(cash || 0),
    totalReturnPct,
    totalReturnAmount,
    sharpe: Number(sharpe.toFixed(2)),
    // remove calmar (was requested)
    maxDrawdown: Number(maxDrawdown.toFixed(2))
  };
};

const nowReadable = (offsetMinutes = 0) => {
  const d = new Date(Date.now() - offsetMinutes * 60 * 1000);
  return d.toISOString();
};

export const mockPortfolioApi = {
  getPortfolio: async () => {
    const users = readUsers();
    const u = users[0] || null;
    if (u && u.portfolio) {
      const pf = u.portfolio;
      // ensure holdings have value fields and metrics exist
      pf.holdings = pf.holdings || [];
      // If holdings have allocationPct but no value, compute values from base
      const base = pf.metrics?.totalCapital || pf.metrics?.portfolioValue || 1000000;
      if (!pf.metrics) {
        pf.metrics = computeMetrics(pf.holdings, base, pf.metrics?.cash ?? 0);
      } else {
        // Recompute metrics based on holdings and existing cash
        const cash = pf.metrics?.cash ?? 0;
        pf.metrics = { ...(pf.metrics || {}), ...computeMetrics(pf.holdings, base, cash) };
      }
      pf.aiRecommendations = pf.aiRecommendations || [];
      pf.agentActivity = pf.agentActivity || [{ id: 1, title: 'Portafolio mock inicial', when: nowReadable(60), status: 'completed' }];
      return simulate(pf, 400);
    }

    // No portfolio stored: create demo based on user risk or fallback to MODERADO
    const profile = u?.financialProfile ?? null;
    const riskCategory = (u?.riskEstimate?.level || profile?.computedRiskCategory || 'MODERADO').toString().toUpperCase();
    const set = ASSETS_BY_PROFILE[riskCategory] || ASSETS_BY_PROFILE.MODERADO;
    // pick 5 assets randomly for the demo portfolio
    const shuffled = set.slice().sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    const baseValue = Math.round(Number(profile?.capitalDisponible ?? 1000000));
    // create equal allocation and compute values
    const per = Math.floor(100 / selected.length);
    const remainder = 100 - per * selected.length;
    const holdings = selected.map((a, i) => ({
      symbol: a.symbol,
      name: a.name,
      allocationPct: i === 0 ? per + remainder : per,
      pnlPct: a.pnlPct,
      value: Math.round(baseValue * ((i === 0 ? per + remainder : per) / 100))
    }));
    // set a small cash buffer so user can perform buys: 5% of base unless holdings don't sum 100
    const holdingsTotal = holdings.reduce((s, h) => s + (h.value || 0), 0);
    let cash = Math.max(0, baseValue - holdingsTotal);
    if (cash === 0) cash = Math.round(baseValue * 0.05);

    const metrics = computeMetrics(holdings, baseValue, cash);

    const portfolio = {
      portfolioId: `pf_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      metrics,
      holdings,
      aiRecommendations: [
        { id: 'n1', title: 'Rebalance sugerido: reducir tech 3%', type: 'rebalance', confidence: 0.82, when: '2 hours ago' }
      ],
      agentActivity: [
        { id: 1, title: 'Portafolio mock inicial', when: nowReadable(60), status: 'completed' }
      ],
      autoRebalance: false
    };

    return simulate(portfolio, 520);
  },

  createPortfolio: async (payload) => {
    const users = readUsers();
    if (!users.length) {
      const demoUser = {
        id: Date.now().toString(36),
        email: 'demo@tradingia.test',
        firstName: 'Demo',
        lastName: 'User',
        password: 'Demo123!',
        activated: true,
        createdAt: new Date().toISOString(),
        financialProfile: null,
        portfolios: [],
        portfolio: null
      };
      users.push(demoUser);
    }
    const u = users[0];
    const baseValue = Number(payload.value || u.financialProfile?.capitalDisponible || 1000000);

    // build holdings from payload.holdings or fallback
    const sourceHoldings = (payload.holdings && payload.holdings.length) ? payload.holdings : (() => {
      const risk = (u.riskEstimate?.level || 'MODERADO').toString().toUpperCase();
      const set = ASSETS_BY_PROFILE[risk] || ASSETS_BY_PROFILE.MODERADO;
      const shuffled = set.slice().sort(() => 0.5 - Math.random());
      return shuffled.slice(0,5).map((a, i) => ({ symbol: a.symbol, name: a.name, allocationPct: Math.floor(100/5) }));
    })();

    const per = Math.floor(100 / sourceHoldings.length);
    const remainder = 100 - (per * sourceHoldings.length);
    const holdings = sourceHoldings.map((h, i) => ({
      symbol: h.symbol,
      name: h.name || h.symbol,
      allocationPct: h.allocationPct ?? (i === 0 ? per + remainder : per),
      pnlPct: h.pnlPct ?? (Math.round((Math.random() * 5 + 0.2) * 10) / 10)
    }));

    // compute initial per-holding values
    holdings.forEach(h => {
      h.value = Math.round(baseValue * ((h.allocationPct || 0) / 100));
    });

    // ensure a small cash buffer to allow purchases
    let holdingsTotal = holdings.reduce((s, h) => s + (h.value || 0), 0);
    let cash = Math.max(0, baseValue - holdingsTotal);
    if (cash === 0) cash = Math.round(baseValue * 0.05);

    const metrics = computeMetrics(holdings, baseValue, cash);

    const portfolio = {
      portfolioId: `pf_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      metrics,
      holdings,
      aiRecommendations: [
        { id: `ai_${Date.now().toString(36)}_1`, title: 'Rebalance sugerido: reducir concentración en una posición', type: 'rebalance', confidence: 0.82, when: 'just now' }
      ],
      agentActivity: [
        { id: 1, title: 'Portafolio creado', when: nowReadable(0), status: 'completed' }
      ],
      autoRebalance: false
    };

    u.portfolio = portfolio;
    u.portfolios = u.portfolios || [];
    u.portfolios.unshift(portfolio);
    writeUsers(users);
    return simulate(portfolio, 700);
  },

  updatePortfolio: async (id, patch) => {
    const users = readUsers();
    if (!users.length) throw new Error('Usuario no encontrado');
    const u = users[0];
    let updated = null;
    if (u.portfolio && u.portfolio.portfolioId === id) {
      u.portfolio = { ...u.portfolio, ...patch };
      updated = u.portfolio;
    } else if (u.portfolios && Array.isArray(u.portfolios)) {
      const i = u.portfolios.findIndex(p => p.portfolioId === id);
      if (i !== -1) {
        u.portfolios[i] = { ...u.portfolios[i], ...patch };
        updated = u.portfolios[i];
      }
    }
    if (!updated) throw new Error('Portafolio no encontrado');
    writeUsers(users);
    return simulate(updated, 360);
  },

  /**
   * applyOrder(order) -> aplica orden buy/sell al portfolio del usuario en localStorage.
   * Estructura order: { orderId, portfolioId, symbol, side, investAmount, qty, orderType, filledAt }
   */
  applyOrder: async (order) => {
    const users = readUsers();
    if (!users.length) throw new Error('Usuario no encontrado');
    const u = users[0];
    const pf = u.portfolio;
    if (!pf) throw new Error('No hay portafolio activo');

    const invest = Number(order.investAmount || 0);
    if (isNaN(invest)) throw new Error('Invest amount inválido');

    // Ensure holdings array
    pf.holdings = pf.holdings || [];

    const totalCapital = pf.metrics?.totalCapital || pf.metrics?.portfolioValue || 1000000;
    // available cash
    const cash = Number(pf.metrics?.cash ?? 0);

    if (order.side === 'buy') {
      if (invest > cash) {
        throw new Error('Fondos insuficientes para ejecutar la compra en el portafolio.');
      }
      // Find holding or create new
      const idx = pf.holdings.findIndex(h => h.symbol === order.symbol);
      if (idx === -1) {
        // create new holding with value = invest
        const sample = (ASSETS_BY_PROFILE.MODERADO.find(a => a.symbol === order.symbol) || { name: order.symbol, pnlPct: 0 });
        pf.holdings.push({
          symbol: order.symbol,
          name: sample.name || order.symbol,
          value: Math.round(invest),
          pnlPct: sample.pnlPct ?? 0,
          allocationPct: 0
        });
      } else {
        // increase existing holding value
        pf.holdings[idx].value = Math.round((pf.holdings[idx].value || 0) + invest);
      }
      // reduce cash
      pf.metrics.cash = Math.round(cash - invest);
    } else if (order.side === 'sell') {
      // sell: remove value from holding (sell amount invest = we interpret investAmount as amount to receive)
      const idx = pf.holdings.findIndex(h => h.symbol === order.symbol);
      if (idx === -1) throw new Error('No existe la posición para vender');
      const currentVal = Number(pf.holdings[idx].value || 0);
      const sellAmount = Math.min(invest, currentVal);
      pf.holdings[idx].value = Math.round(currentVal - sellAmount);
      pf.metrics.cash = Math.round(cash + sellAmount);
      // if holding is zero remove
      if (pf.holdings[idx].value <= 0) pf.holdings.splice(idx, 1);
    } else {
      throw new Error('Side inválido');
    }

    // Recompute allocationPct and metrics: allocationPct based on holdings' value vs total holdings + cash
    const holdingsTotal = pf.holdings.reduce((s, h) => s + (h.value || 0), 0);
    const newTotalCapital = Math.round(holdingsTotal + (pf.metrics.cash || 0));
    pf.holdings.forEach(h => {
      h.allocationPct = newTotalCapital > 0 ? Math.round(((h.value || 0) / newTotalCapital) * 10000) / 100 : 0;
    });

    pf.metrics = { ...(pf.metrics || {}), ...computeMetrics(pf.holdings, newTotalCapital, pf.metrics.cash) };
    // persist
    u.portfolio = pf;
    writeUsers(users);

    return simulate(pf, 420);
  }
};


// // src/services/mock/portfolioMock.js
// const STORAGE_KEY = 'tradingia_users_v1';
// const simulate = (data, delay = 450) => new Promise(res => setTimeout(() => res(data), delay));

// const readUsers = () => {
//   try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
// };
// const writeUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

// // Mock price map (valores de referencia para calcular investAmount si hace falta)
// const PRICE_MAP = {
//   VTI: 200, VOO: 400, BND: 75, XLK: 120, NVDA: 350, TSLA: 220, BTC: 45000, ARKK: 40, SOXL: 80,
//   AAPL: 150, MSFT: 320, GOOGL: 110, AMZN: 135, JPM: 160, XLF: 30, XLE: 60, VNQ: 90
// };
// const getMockPrice = (symbol) => PRICE_MAP[symbol] || 100;

// // Sets de holdings por perfil (cada perfil incluye al menos 9 activos para pruebas)
// const HOLDINGS_POOL = {
//   Conservador: [
//     { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocationPct: 25, pnlPct: 0.4 },
//     { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond', allocationPct: 15, pnlPct: 0.3 },
//     { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', allocationPct: 8, pnlPct: 0.6 },
//     { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocationPct: 12, pnlPct: 1.0 },
//     { symbol: 'XLF', name: 'Financial Sector ETF', allocationPct: 8, pnlPct: 0.7 },
//     { symbol: 'TIP', name: 'iShares TIPS Bond', allocationPct: 10, pnlPct: 0.2 },
//     { symbol: 'LQD', name: 'iShares Investment Grade Corp Bond', allocationPct: 12, pnlPct: 0.25 },
//     { symbol: 'BIL', name: 'SPDR Bloomberg 1-3 Month T-Bill ETF', allocationPct: 10, pnlPct: 0.05 },
//     { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', allocationPct: 0, pnlPct: 0.03 }
//   ],
//   Moderado: [
//     { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocationPct: 25, pnlPct: 1.2 },
//     { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', allocationPct: 15, pnlPct: 1.1 },
//     { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocationPct: 15, pnlPct: 0.6 },
//     { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', allocationPct: 10, pnlPct: 2.3 },
//     { symbol: 'AAPL', name: 'Apple Inc.', allocationPct: 8, pnlPct: 1.8 },
//     { symbol: 'MSFT', name: 'Microsoft Corp.', allocationPct: 8, pnlPct: 1.6 },
//     { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', allocationPct: 7, pnlPct: 0.9 },
//     { symbol: 'XLE', name: 'Energy Sector ETF', allocationPct: 6, pnlPct: 0.7 },
//     { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF', allocationPct: 6, pnlPct: 0.5 }
//   ],
//   Agresivo: [
//     { symbol: 'NVDA', name: 'NVIDIA Corp.', allocationPct: 18, pnlPct: 6.2 },
//     { symbol: 'TSLA', name: 'Tesla, Inc.', allocationPct: 14, pnlPct: 4.1 },
//     { symbol: 'ARKK', name: 'ARK Innovation ETF', allocationPct: 12, pnlPct: 3.5 },
//     { symbol: 'SOXL', name: 'Direxion Semiconductors 3x', allocationPct: 10, pnlPct: 8.2 },
//     { symbol: 'BTC', name: 'Bitcoin', allocationPct: 10, pnlPct: 9.7 },
//     { symbol: 'AAPL', name: 'Apple Inc.', allocationPct: 8, pnlPct: 1.8 },
//     { symbol: 'MSFT', name: 'Microsoft Corp.', allocationPct: 8, pnlPct: 1.6 },
//     { symbol: 'NVDA-2', name: 'NVDA Call Mock', allocationPct: 10, pnlPct: 5.5 }, // ejemplo para diversificar
//     { symbol: 'GOOGL', name: 'Alphabet Inc.', allocationPct: 10, pnlPct: 2.9 }
//   ],
//   'No definido': [
//     { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocationPct: 60, pnlPct: 1.2 },
//     { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocationPct: 40, pnlPct: 0.6 }
//   ]
// };

// const computeMetrics = (holdings = [], baseValue = 1000000) => {
//   // If holdings have absolute 'value', compute portfolioValue from them; otherwise use baseValue
//   const holdingsHaveValue = holdings.some(h => typeof h.value === 'number');
//   const portfolioValue = holdingsHaveValue
//     ? Math.round(holdings.reduce((s, h) => s + (Number(h.value) || 0), 0))
//     : Math.round(baseValue);

//   // compute weighted return based on pnlPct and allocation
//   const allocationSum = holdings.reduce((s, h) => s + (Number(h.allocationPct) || 0), 0) || 100;
//   const weightedReturn = holdings.reduce((s, h) => s + ((Number(h.allocationPct) || 0) / allocationSum) * (Number(h.pnlPct) || 0), 0);
//   const totalReturnPct = weightedReturn / 100;
//   const totalReturnAmount = Math.round(portfolioValue * totalReturnPct);

//   // Sharpe mock: scaled from weightedReturn
//   const sharpe = Math.max(0.1, Math.min(4.0, (weightedReturn / 5)));
//   // Max drawdown: inverso proporcional
//   const maxDrawdown = -Math.min(90, Math.round((1 / Math.max(0.01, sharpe)) * 10));

//   return {
//     portfolioValue,
//     totalReturnPct: Number(totalReturnPct.toFixed(4)),
//     totalReturnAmount,
//     sharpe: Number(sharpe.toFixed(2)),
//     maxDrawdown: Number(maxDrawdown.toFixed(2))
//   };
// };

// const nowReadable = (offsetMinutes = 0) => {
//   const d = new Date(Date.now() - offsetMinutes * 60 * 1000);
//   return d.toISOString();
// };

// const sampleHoldingsForRisk = (level) => {
//   const map = HOLDINGS_POOL;
//   const set = map[level] || map.Moderado || [];
//   // Clone and ensure structure: no absolute value initially
//   return set.map(h => ({ ...h, value: undefined }));
// };

// // applyOrder helper: mutate user's primary portfolio
// const applyOrderToPortfolio = (u, order) => {
//   if (!u) throw new Error('Usuario no encontrado');
//   let pf = u.portfolio;
//   if (!pf) {
//     // try to build one
//     const baseValue = (u.financialProfile?.capitalDisponible && Number(u.financialProfile.capitalDisponible)) || 1000000;
//     const level = u.riskEstimate?.level || 'Moderado';
//     const holdings = sampleHoldingsForRisk(level);
//     const metrics = computeMetrics(holdings, baseValue);
//     pf = {
//       portfolioId: `pf_${Date.now().toString(36)}`,
//       createdAt: new Date().toISOString(),
//       metrics,
//       holdings,
//       aiRecommendations: [],
//       agentActivity: []
//     };
//     u.portfolio = pf;
//     u.portfolios = u.portfolios || [];
//     u.portfolios.unshift(pf);
//   }

//   const price = order.price ?? getMockPrice(order.symbol);
//   const investAmount = typeof order.investAmount === 'number' && order.investAmount > 0
//     ? Number(order.investAmount)
//     : (order.qty ? Number(order.qty) * price : 0);

//   let holdings = pf.holdings || [];
//   const idx = holdings.findIndex(h => h.symbol === order.symbol);
//   if (order.side === 'buy') {
//     if (idx >= 0) {
//       holdings[idx].value = (Number(holdings[idx].value) || 0) + investAmount;
//     } else {
//       holdings.push({
//         symbol: order.symbol,
//         name: order.name || order.symbol,
//         allocationPct: 0,
//         value: investAmount,
//         pnlPct: order.pnlPct ?? 0
//       });
//     }
//   } else if (order.side === 'sell') {
//     if (idx >= 0) {
//       holdings[idx].value = Math.max(0, (Number(holdings[idx].value) || 0) - investAmount);
//       if (holdings[idx].value === 0) holdings.splice(idx, 1);
//     } else {
//       // venta de símbolo no en holdings -> ignoramos (mock)
//     }
//   }

//   // recalcular portfolioValue y allocationPct
//   const portfolioValue = Math.round(holdings.reduce((s, h) => s + (Number(h.value) || 0), 0)) || (pf.metrics?.portfolioValue || 0);
//   holdings = holdings.map(h => {
//     const alloc = portfolioValue > 0 ? Number(((Number(h.value) || 0) / portfolioValue * 100).toFixed(2)) : 0;
//     return { ...h, allocationPct: alloc };
//   });

//   pf.holdings = holdings;
//   pf.metrics = computeMetrics(holdings, portfolioValue || 1000000);

//   pf.agentActivity = pf.agentActivity || [];
//   pf.agentActivity.unshift({
//     id: `act_${Date.now().toString(36)}`,
//     title: `${order.side === 'buy' ? 'Compra' : 'Venta'} ${order.symbol} · ${order.orderType}`,
//     when: new Date().toISOString(),
//     status: 'completed'
//   });

//   // update aiRecommendations lightly (mock)
//   pf.aiRecommendations = pf.aiRecommendations || [];
//   return pf;
// };

// export const mockPortfolioApi = {
//   getPortfolio: async () => {
//     const users = readUsers();
//     const u = users[0] || null;
//     if (u && u.portfolio) {
//       const pf = u.portfolio;
//       pf.metrics = pf.metrics || computeMetrics(pf.holdings || [], pf.metrics?.portfolioValue || 1000000);
//       pf.aiRecommendations = pf.aiRecommendations || [
//         { id: 'r1', type: 'rebalance', title: 'Reduce exposición en tecnología 3%', confidence: 0.78, when: '1 hour ago' }
//       ];
//       pf.agentActivity = pf.agentActivity || [{ id: 1, title: 'Portafolio cargado (mock)', when: nowReadable(60), status: 'completed' }];
//       return simulate(pf, 400);
//     }

//     const profile = u?.financialProfile ?? null;
//     const riskLevel = u?.riskEstimate?.level ?? (profile ? 'Moderado' : 'Moderado');
//     const holdings = sampleHoldingsForRisk(riskLevel);
//     const baseValue = Math.round((u?.financialProfile?.capitalDisponible && Number(u.financialProfile.capitalDisponible)) || 1248573.89);

//     // Asignar valores iniciales proporcionales al baseValue usando allocationPct
//     const allocationSum = holdings.reduce((s, h) => s + (Number(h.allocationPct) || 0), 0) || 100;
//     const populatedHoldings = holdings.map(h => {
//       const value = Math.round((Number(h.allocationPct) || 0) / allocationSum * baseValue);
//       return { ...h, value };
//     });

//     const metrics = computeMetrics(populatedHoldings, baseValue);
//     const portfolio = {
//       portfolioId: `pf_${Date.now().toString(36)}`,
//       createdAt: new Date().toISOString(),
//       metrics,
//       holdings: populatedHoldings,
//       aiRecommendations: [
//         { id: 'n1', title: 'Rebalance sugerido: reducir tech 3%', type: 'rebalance', confidence: 0.82, when: '2 hours ago' },
//         { id: 'n2', title: 'Comprar posición en BND para balance', type: 'buy', confidence: 0.6, when: '1 day ago' }
//       ],
//       agentActivity: [
//         { id: `a_${Date.now().toString(36)}`, title: 'Portafolio mock inicial', when: nowReadable(60), status: 'completed' }
//       ],
//       autoRebalance: false
//     };

//     return simulate(portfolio, 550);
//   },

//   createPortfolio: async (payload) => {
//     const users = readUsers();
//     if (!users.length) {
//       const demoUser = {
//         id: Date.now().toString(36),
//         email: 'demo@tradingia.test',
//         firstName: 'Demo',
//         lastName: 'User',
//         password: 'Demo123!',
//         activated: true,
//         createdAt: new Date().toISOString(),
//         financialProfile: null,
//         portfolios: [],
//         portfolio: null
//       };
//       users.push(demoUser);
//     }

//     const u = users[0];
//     const riskLevel = (u.riskEstimate && u.riskEstimate.level) || (u.financialProfile ? 'Moderado' : 'Moderado');
//     const holdingsSource = payload.holdings && payload.holdings.length ? payload.holdings : sampleHoldingsForRisk(riskLevel);
//     const baseValue = Number(payload.value) || (u.financialProfile?.capitalDisponible ? Number(u.financialProfile.capitalDisponible) : 1000000);

//     // If incoming holdings don't have value, distribute amounts from baseValue using allocationPct
//     const allocationSum = holdingsSource.reduce((s, h) => s + (Number(h.allocationPct) || 0), 0) || 100;
//     const populatedHoldings = holdingsSource.map(h => ({
//       ...h,
//       value: typeof h.value === 'number' ? h.value : Math.round((Number(h.allocationPct) || 0) / allocationSum * baseValue)
//     }));

//     const metrics = computeMetrics(populatedHoldings, baseValue);
//     const portfolio = {
//       portfolioId: `pf_${Date.now().toString(36)}`,
//       createdAt: new Date().toISOString(),
//       metrics,
//       holdings: populatedHoldings,
//       aiRecommendations: [
//         { id: `ai_${Date.now().toString(36)}_1`, title: 'Rebalance sugerido: reducir concentración en una posición', type: 'rebalance', confidence: 0.82, when: 'just now' }
//       ],
//       agentActivity: [
//         { id: 1, title: 'Portafolio creado', when: nowReadable(0), status: 'completed' }
//       ],
//       autoRebalance: false
//     };

//     u.portfolio = portfolio;
//     u.portfolios = u.portfolios || [];
//     u.portfolios.unshift(portfolio);
//     writeUsers(users);
//     return simulate(portfolio, 900);
//   },

//   updatePortfolio: async (id, patch) => {
//     const users = readUsers();
//     if (!users.length) throw new Error('Usuario no encontrado');
//     const u = users[0];
//     let updated = null;
//     if (u.portfolio && u.portfolio.portfolioId === id) {
//       u.portfolio = { ...u.portfolio, ...patch };
//       updated = u.portfolio;
//     } else if (u.portfolios && Array.isArray(u.portfolios)) {
//       const i = u.portfolios.findIndex(p => p.portfolioId === id);
//       if (i !== -1) {
//         u.portfolios[i] = { ...u.portfolios[i], ...patch };
//         updated = u.portfolios[i];
//       }
//     }
//     if (!updated) throw new Error('Portafolio no encontrado');
//     writeUsers(users);
//     return simulate(updated, 450);
//   },

//   // Nuevo: aplicar una orden al portfolio persistido
//   applyOrder: async (order) => {
//     const users = readUsers();
//     if (!users.length) throw new Error('Usuario no encontrado');
//     const u = users[0];
//     const updatedPf = applyOrderToPortfolio(u, order);
//     writeUsers(users);
//     return simulate(updatedPf, 350);
//   }
// };


