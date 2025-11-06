// src/services/mock/notificationMock.js
// Mock API para notificaciones de IA (trading y portafolio).
// Devuelve promesas simulando latencia de red.

const now = () => new Date().toISOString();
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

let _store = [
  // Portfolio / optimization notifications
  {
    id: 'pf_001',
    type: 'portfolio_optimization',
    title: 'Rebalance sugerido: reducir exposición en Tech',
    body: 'La IA detectó sobreponderación en tecnología. Recomendación: reducir AAPL/NVDA combinados 6% y mover a bonos/ETFs defensivos.',
    when: now(),
    severity: 'info',
    tags: ['rebalance','risk'],
    suggestedAction: {
      description: 'Reducir 3% NVDA, 3% AAPL; aumentar BND 6%',
      estimatedImpactPct: -0.8
    },
    read: false
  },
  {
    id: 'pf_002',
    type: 'risk_alert',
    title: 'Umbral de riesgo superado (drawdown)',
    body: 'El drawdown del portafolio alcanzó -12.3% en los últimos 7 días, por encima del umbral definido.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    severity: 'warning',
    tags: ['drawdown','alert'],
    suggestedAction: {
      description: 'Revisión manual recomendada; considerar stop-loss por posición',
      requireUser: true
    },
    read: false
  },
  {
    id: 'pf_003',
    type: 'optimization_completed',
    title: 'Optimización completada: rebalance automático aplicado',
    body: 'La estrategia automática aplicó rebalance al portafolio para alinear con límites por posición.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    severity: 'success',
    tags: ['rebalance','auto'],
    details: { before: { tech: 42 }, after: { tech: 35 } },
    read: false
  },
  {
    id: 'pf_004',
    type: 'suggested_allocation',
    title: 'Nuevas asignaciones sugeridas según perfil',
    body: 'Basado en tu perfil MODERADO, la IA sugiere 60% renta variable / 30% bonos / 10% cash.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    severity: 'info',
    tags: ['allocation','recommendation'],
    suggestedAllocation: [{ bucket: 'equity', pct: 60 }, { bucket: 'bonds', pct: 30 }],
    read: false
  },
  {
    id: 'pf_005',
    type: 'opportunity_spotted',
    title: 'Oportunidad: caída temporal en sector energético',
    body: 'La IA detectó una caída brusca en el sector energético; sugiere evaluar compra parcial para diversificar.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    severity: 'info',
    tags: ['opportunity'],
    suggestedAction: { symbol: 'XOM', action: 'buy', suggestionPct: 2 },
    read: false
  },
  {
    id: 'pf_006',
    type: 'limit_exceeded',
    title: 'Concentración excedida: posición mayor al límite',
    body: 'Tu posición en GOOGL supera el límite por posición (10%). Recomendación: reducir exposición.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    severity: 'warning',
    tags: ['concentration','risk'],
    suggestedAction: { description: 'Vender 4% de GOOGL' },
    read: false
  },

  // Trading / execution recommendations
  {
    id: 'tr_001',
    type: 'trade_recommendation',
    title: 'Comprar NVDA (limit) — oportunidad intradía',
    body: 'La IA sugiere una orden LIMIT de compra en NVDA a 1% por debajo del precio actual con alta probabilidad de ejecución favorable.',
    when: now(),
    severity: 'info',
    tags: ['trade','limit','nvda'],
    suggestedOrder: {
      symbol: 'NVDA',
      side: 'buy',
      orderType: 'limit',
      qty: 10,
      limitPrice: 210.00,
      confidence: 0.82
    },
    read: false
  },
  {
    id: 'tr_002',
    type: 'trade_recommendation',
    title: 'Vender TSLA (stop-loss) — gestión de riesgo',
    body: 'Recomendación de stop-loss para TSLA: colocar stop a -10% desde el precio de adquisición para limitar pérdida.',
    when: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: 'warning',
    tags: ['trade','stop-loss','tsla'],
    suggestedOrder: {
      symbol: 'TSLA',
      side: 'sell',
      orderType: 'stop-loss',
      qty: 5,
      stopPrice: 480.00,
      confidence: 0.75
    },
    read: false
  },
  {
    id: 'tr_003',
    type: 'trade_signal',
    title: 'Señal Market: aumento de volumen en AAPL',
    body: 'Volumen inusual detectado en AAPL. La IA sugiere una orden MARKET parcial para aprovechar momentum.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    severity: 'info',
    tags: ['trade','market','aapl'],
    suggestedOrder: {
      symbol: 'AAPL',
      side: 'buy',
      orderType: 'market',
      qty: 15,
      confidence: 0.68
    },
    read: false
  },
  {
    id: 'tr_004',
    type: 'strategy_recommendation',
    title: 'Ajuste sugerido: reducir apalancamiento en CFDs',
    body: 'Dado la alta volatilidad actual, la IA recomienda reducir apalancamiento de 1:5 a 1:2 en posiciones CFD.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    severity: 'warning',
    tags: ['strategy','risk'],
    suggestedAction: { description: 'Reducir apalancamiento en cuentas margin' },
    read: false
  },
  {
    id: 'tr_005',
    type: 'trade_recommendation',
    title: 'Comprar BTC (limit) — oportunidad de acumulación',
    body: 'La IA identifica zona de soporte para BTC. Orden LIMIT recomendada para acumulación parcial con baja exposición automática.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    severity: 'info',
    tags: ['crypto','btc','limit'],
    suggestedOrder: {
      symbol: 'BTC',
      side: 'buy',
      orderType: 'limit',
      qty: 0.02,
      limitPrice: 450000000, // represent COP or cents depending on your convention
      confidence: 0.6
    },
    read: false
  },
  {
    id: 'tr_006',
    type: 'trade_recommendation',
    title: 'Oportunidad swing: MSFT (limit)',
    body: 'Se proyecta una ruptura técnica en MSFT; la IA sugiere compra escalonada en caso de retroceso.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    severity: 'info',
    tags: ['trade','msft','swing'],
    suggestedOrder: {
      symbol: 'MSFT',
      side: 'buy',
      orderType: 'limit',
      qty: 8,
      limitPrice: 320.0,
      confidence: 0.7
    },
    read: false
  },
  {
    id: 'tr_007',
    type: 'execution_report',
    title: 'Orden ejecutada: MARKET AAPL',
    body: 'Orden MARKET de compra AAPL (qty 10) ejecutada con éxito a precio promedio 145.12 COP.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    severity: 'success',
    tags: ['execution','aapl'],
    execution: { symbol: 'AAPL', qty: 10, avgPrice: 145.12 },
    read: false
  },
  {
    id: 'tr_008',
    type: 'trade_alert',
    title: 'Fallo ejecución: LIMIT GOOGL',
    body: 'La orden LIMIT propuesta para GOOGL no se pudo ejecutar (precio no alcanzado). Se recomienda revisar el nivel de límite.',
    when: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
    severity: 'danger',
    tags: ['execution','limit','googl'],
    suggestedAction: { description: 'Revisar y ajustar precio límite o convertir a market' },
    read: false
  }
];

// API mock
export const mockNotifApi = {
  // devuelve las recomendaciones de trading (filtro por type 'trade_*')
  getAiRecommendations: async () => {
    await delay(250);
    const recs = _store.filter(n => n.type.startsWith('tr_') || n.type === 'trade_recommendation' || n.type === 'trade_signal' || n.type === 'strategy_recommendation');
    // devolver una copia para evitar mutaciones externas
    return recs.map(r => ({ ...r }));
  },

  // devuelve todas las notificaciones recientes (portfolio + trading)
  getRecentNotifications: async () => {
    await delay(180);
    // ordenar por fecha (desc)
    const sorted = [..._store].sort((a,b) => new Date(b.when) - new Date(a.when));
    return sorted.map(n => ({ ...n }));
  },

  // agrega una notificación (para simular creación desde frontend)
  addNotification: async (payload) => {
    await delay(120);
    const id = `mock_${Date.now()}`;
    const item = { id, when: now(), read: false, ...payload };
    _store.unshift(item);
    return { ...item };
  },

  // marcar como leído
  markAsRead: async (id) => {
    await delay(80);
    const idx = _store.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Notificación no encontrada');
    _store[idx].read = true;
    return { ..._store[idx] };
  },

  // limpiar mocks (útil para tests)
  clearAll: async () => {
    await delay(80);
    _store = [];
    return true;
  },

  // para depuración: obtener _store completo (copia)
  dumpAll: () => _store.map(x => ({ ...x }))
};

export default mockNotifApi;

