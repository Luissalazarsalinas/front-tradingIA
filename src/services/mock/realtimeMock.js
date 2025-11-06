export class SimulatedSocket {
  constructor({ getPortfolios, intervalMs = 5000 } = {}) {
    if (typeof getPortfolios !== 'function') throw new Error('getPortfolios required');
    this.getPortfolios = getPortfolios;
    this.intervalMs = intervalMs;
    this._listeners = { tick: [], started: [], stopped: [] };
    this._timer = null;
    this._state = { values: {} };
  }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  _emit(event, payload) {
    const list = this._listeners[event] || [];
    list.forEach(fn => { try { fn(payload); } catch (e) { /* ignore */ } });
  }

  static _randomPct() { return (Math.random() - 0.5) * 0.012; }

  _ensureInitialValues(portfolios) {
    portfolios.forEach((p, idx) => {
      const id = p.portfolioId ?? `pf_local_${idx}`;
      const initial = Number(p.metrics?.portfolioValue ?? this._state.values[id] ?? 1000000);
      if (this._state.values[id] === undefined) this._state.values[id] = initial;
    });
  }

  start() {
    if (this._timer) return;
    const portfolios = this.getPortfolios() || [];
    this._ensureInitialValues(portfolios);
    this._emit('started', { when: new Date().toISOString() });
    this._timer = setInterval(() => {
      const portfoliosNow = this.getPortfolios() || [];
      portfoliosNow.forEach((p, idx) => {
        const id = p.portfolioId ?? `pf_local_${idx}`;
        const prev = Number(this._state.values[id] ?? (p.metrics?.portfolioValue ?? 1000000));
        const pct = SimulatedSocket._randomPct();
        const newValue = Math.max(0, Number((prev * (1 + pct)).toFixed(2)));
        const pctChange = prev > 0 ? (newValue - prev) / prev : 0;
        this._state.values[id] = newValue;
        this._emit('tick', { portfolioId: id, newValue, pctChange, timestamp: new Date().toISOString() });
      });
    }, this.intervalMs);
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
    this._emit('stopped', { when: new Date().toISOString() });
  }

  getLatestValue(portfolioId) { return this._state.values[portfolioId]; }
}

export default SimulatedSocket;