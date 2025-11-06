// src/services/profileMock.js
// Mock persistente para perfiles — garantiza que riskEstimate y suggestedAssets se persisten y se devuelven.
const STORAGE_KEY = 'tradingia_users_v1';
const simulate = (data, delay = 400) => new Promise(res => setTimeout(() => res(data), delay));

const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const writeUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

const scoringMap = {
  toCategory: (score) => {
    if (score >= 24) return 'AGRESIVO';
    if (score >= 15) return 'MODERADO';
    return 'CONSERVADOR';
  }
};

// suggestions by category: sets of suggested assets (>=5 each, you asked later to expand these; put a representative set)
const ASSETS_BY_CATEGORY = {
  CONSERVADOR: [
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond' },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' },
    { symbol: 'IUSB', name: 'iShares Core Total USD Bond Market' },
    { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corp' }
  ],
  MODERADO: [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'IJH', name: 'iShares Core S&P Mid-Cap' },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets' },
    { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' }
  ],
  AGRESIVO: [
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'ARKK', name: 'ARK Innovation ETF' },
    { symbol: 'SOXL', name: 'Direxion Semiconductor 3x' },
    { symbol: 'BTC', name: 'Bitcoin (proxy)' },
    { symbol: 'ETH', name: 'Ethereum (proxy)' }
  ],
  DEFAULT: [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' }
  ]
};

// compute risk score from questionnaire
const computeScore = (riskQuestionnaire = {}) => {
  const values = Object.values(riskQuestionnaire || {}).map(v => Number(v) || 0);
  return values.reduce((s, v) => s + v, 0);
};

const deriveSuggestedAssets = (category, count = 5) => {
  const set = ASSETS_BY_CATEGORY[(category || 'DEFAULT').toUpperCase()] || ASSETS_BY_CATEGORY.DEFAULT;
  // pick first 'count' (stable) or random sample if you want variability
  return set.slice(0, Math.max(5, count)).map(a => ({ ...a }));
};

export const profileMock = {
  getProfile: async () => {
    const users = readUsers();
    const u = users[0] || null;
    if (!u) return simulate(null, 200);

    // ensure financialProfile exists shape
    const fp = u.financialProfile || {};
    const score = computeScore(fp.riskQuestionnaire || {});
    const category = u.riskEstimate?.level || fp.computedRiskCategory || scoringMap.toCategory(score);
    const suggestedAssets = u.suggestedAssets && u.suggestedAssets.length ? u.suggestedAssets : deriveSuggestedAssets(category, 5);

    // persist computed values if not present or out of sync
    u.riskEstimate = { level: category, score, reason: `Puntaje: ${score}` };
    u.suggestedAssets = suggestedAssets;
    writeUsers(users);

    return simulate({
      financialProfile: fp,
      riskEstimate: u.riskEstimate,
      suggestedAssets: u.suggestedAssets
    }, 300);
  },

  updateProfile: async (payload) => {
    // payload expected: { financialProfile: {...} } or partial
    const users = readUsers();
    if (!users.length) {
      // create demo user if none exists
      const demo = {
        id: Date.now().toString(36),
        email: 'demo@tradingia.test',
        firstName: 'Demo',
        lastName: 'User',
        password: 'Demo123!',
        activated: true,
        createdAt: new Date().toISOString(),
        financialProfile: null,
        portfolios: [],
        portfolio: null,
        riskEstimate: null,
        suggestedAssets: null
      };
      users.push(demo);
    }

    const u = users[0];
    // merge patched financial profile
    u.financialProfile = { ...(u.financialProfile || {}), ...(payload.financialProfile || {}) };

    // compute score & category
    const score = computeScore(u.financialProfile.riskQuestionnaire || {});
    const category = scoringMap.toCategory(score);

    // derive suggestedAssets using category and (optionally) riskThresholdPct
    const suggested = deriveSuggestedAssets(category, 5);

    u.riskEstimate = { level: category, score, reason: `Calculado automáticamente (score ${score})` };
    u.suggestedAssets = suggested;

    // persist
    writeUsers(users);

    // return the persisted info as API would
    return simulate({ financialProfile: u.financialProfile, riskEstimate: u.riskEstimate, suggestedAssets: u.suggestedAssets }, 500);
  }
};
