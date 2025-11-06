// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(v); }
  catch { return v; }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = user?.portfolios && user.portfolios.length ? user.portfolios : (user?.portfolio ? [user.portfolio] : []);
        if (!mounted) return;
        setPortfolios(list);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return (<div className="container py-5"><div className="card custom-card p-4">Cargando dashboard...</div></div>);

  // Siempre mostrar perfil de riesgo (si existe)
  const riskDisplay = user?.financialProfile?.computedRiskCategory || user?.riskEstimate || '—';
  const riskThreshold = user?.financialProfile?.riskThresholdPct ?? user?.riskThresholdPct ?? '—';

  return (
    <div className="container py-4 dashboard-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3>Dashboard</h3>
          <div className="text-muted small">Resumen rápido de tus portafolios y tu umbral de riesgo.</div>
        </div>

        <div className="text-end">
          <div className="small text-muted">Rebalanceo automático</div>
          <button className="btn btn-outline-secondary" title="Funcionalidad deshabilitada en esta vista" disabled>Rebalanceo automático: OFF</button>
        </div>
      </div>

      <div className="row">
        {portfolios.length === 0 && (
          <div className="col-12">
            <div className="card custom-card p-3">No tienes portafolios. Crea uno desde la página de Portafolios.</div>
          </div>
        )}

        {portfolios.map((p, idx) => (
          <div key={p.portfolioId || idx} className="col-md-6 mb-3">
            <div className="card custom-card p-3 portfolio-summary-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="small text-muted">Portafolio</div>
                  <div style={{ fontWeight:800, fontSize:'1.05rem' }}>Portafolio - {p.portfolioId ?? `pf_${idx+1}`}</div>
                </div>

                <div className="text-end">
                  <div className="small text-muted">Valor total</div>
                  <div className="value">{fmtCurrency(p.metrics?.portfolioValue ?? 0)}</div>
                </div>
              </div>

              <div className="mt-3 portfolio-card__summary">
                <div className="kv"><div className="text-muted">Retorno total</div><div>{p.metrics?.totalReturnPct != null ? `${(p.metrics.totalReturnPct*100).toFixed(2)}%` : '—'}</div></div>

                {/* Eliminamos Calmar Ratio por petición */}
                <div className="kv"><div className="text-muted">Sharpe Ratio</div><div>{p.metrics?.sharpe ?? '—'}</div></div>

                <div className="kv"><div className="text-muted">Max Drawdown</div><div style={{ color: p.metrics?.maxDrawdown && p.metrics.maxDrawdown < 0 ? '#ff6b6b' : undefined }}>{p.metrics?.maxDrawdown ?? '—'}</div></div>

                <div className="kv"><div className="text-muted">Perfil de riesgo</div><div>{p.computedRiskCategory ?? p.riskProfile ?? riskDisplay}</div></div>

                <div className="kv"><div className="text-muted">Umbral de riesgo aplicado</div><div>{(p.riskThresholdPct ?? riskThreshold) !== undefined ? `${p.riskThresholdPct ?? riskThreshold}%` : '—'}</div></div>
              </div>

              <div className="mt-3 small text-muted">Resumen de holdings y estado.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

