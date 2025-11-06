// src/pages/Portfolio.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { portfolioService } from '../services/portfolioService';
import { notificationService } from '../services/notificationService';

// Formateadores
const fmtCurrency = (v) => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(v) || 0);
  } catch { return String(v ?? '—'); }
};
const fmtPctRaw = (v) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return '—';
  return `${Number(v).toFixed(2)}%`;
};
const fmtPctFromDecimal = (v) => {
  if (v === undefined || v === null) return '—';
  return `${(Number(v) * 100).toFixed(2)}%`;
};

const StatCard = ({ title, value, subtitle, accentClass }) => (
  <div className="col-md-4 mb-3 stat-card">
    <div className={`card custom-card p-3 stat-card__inner ${accentClass || ''}`}>
      <div className="stat-card__title small text-muted">{title}</div>
      <div className="stat-card__value">{value}</div>
      {subtitle && <div className="small text-muted stat-card__subtitle">{subtitle}</div>}
    </div>
  </div>
);

const AiNotificationsPanel = ({ notifs = [], onApprove = () => {}, onDismiss = () => {} }) => (
  <div className="card custom-card p-3 ai-panel">
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="mb-0">Notificaciones IA</h6>
      <small className="text-muted">Recomendaciones</small>
    </div>

    <div>
      {notifs.length === 0 && <div className="small text-muted">No hay recomendaciones en este momento.</div>}
      {notifs.map(n => (
        <div key={n.id} className="ai-panel__item">
          <div className="ai-panel__content">
            <div className="ai-panel__title" title={n.title}>{n.title}</div>
            <div className="small text-muted">{n.when ?? ''}</div>
          </div>

          <div className="ai-panel__actions">
            <button className="btn btn-sm btn-outline-success" onClick={() => onApprove(n)}>Aprobar</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onDismiss(n)}>Descartar</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Portfolio = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [aiNotifs, setAiNotifs] = useState([]);

  // Load portfolios & AI notifs
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = [];
        if (user?.portfolios && Array.isArray(user.portfolios) && user.portfolios.length) {
          user.portfolios.forEach(p => list.push(p));
        }
        if (user?.portfolio) {
          if (!list.find(x => x.portfolioId === user.portfolio.portfolioId)) list.push(user.portfolio);
        }
        if (list.length === 0) {
          try {
            const p = await portfolioService.getPortfolio();
            if (p) list.push(p);
          } catch (err) {
            // ignore
          }
        }
        if (!mounted) return;
        setPortfolios(list);
        setSelectedIdx(list.length > 0 ? 0 : -1);

        // load AI notifications (mock or real)
        try {
          const nots = await notificationService.getAiRecommendations();
          if (!mounted) return;
          setAiNotifs(nots || []);
        } catch (e) {
          // ignore notifs error
        }
      } catch (err) {
        console.error('Error cargando portafolios', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const selected = useMemo(() => {
    if (!portfolios || portfolios.length === 0 || selectedIdx < 0) return null;
    return portfolios[selectedIdx];
  }, [portfolios, selectedIdx]);

  const canCreateNew = useMemo(() => portfolios.length < 2, [portfolios.length]);

  // Create new portfolio (pedagogical)
  const handleCreateNewPortfolio = async () => {
    if (!canCreateNew) return;
    setProcessing(true);
    try {
      const payload = {
        value: 500000,
        totalReturnPct: 0,
        holdings: []
      };
      const newPf = await portfolioService.createPortfolio(payload);
      const newList = [...portfolios, newPf].slice(0, 2);
      if (updateProfile) await updateProfile({ portfolios: newList });
      setPortfolios(newList);
      setSelectedIdx(newList.length - 1);
    } catch (err) {
      console.error('Error creando portafolio', err);
      alert('No se pudo crear el portafolio. Revisa la consola.');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle auto rebalance (now UI allows toggle but you wanted it disabled on some cases; keeping logic)
  const handleToggleAutoRebalance = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const newFlag = !selected.autoRebalance;
      if (selected.portfolioId) {
        try {
          const updated = await portfolioService.updatePortfolio(selected.portfolioId, { autoRebalance: newFlag });
          const newList = portfolios.map(p => (p.portfolioId === updated.portfolioId ? updated : p));
          if (updateProfile) await updateProfile({ portfolios: newList });
          setPortfolios(newList);
        } catch (err) {
          const newList = portfolios.map(p => (p === selected ? { ...p, autoRebalance: newFlag } : p));
          if (updateProfile) await updateProfile({ portfolios: newList });
          setPortfolios(newList);
        }
      } else {
        const newList = portfolios.map(p => (p === selected ? { ...p, autoRebalance: newFlag } : p));
        if (updateProfile) await updateProfile({ portfolios: newList });
        setPortfolios(newList);
      }
    } catch (err) {
      console.error('Error toggle auto rebalance', err);
      alert('No se pudo cambiar la opción de rebalaceo.');
    } finally {
      setProcessing(false);
    }
  };

  // Request add assets -> simulate server/IA review
  const handleRequestAddAssets = async () => {
    if (!selected) {
      alert('Selecciona un portafolio primero.');
      return;
    }
    setProcessing(true);
    try {
      await notificationService.getRecentNotifications();
      alert('Solicitud enviada: la IA o el equipo revisará la propuesta y te notificará.');
    } catch (err) {
      console.error('Error solicitando agregación', err);
      alert('No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  // Approve a notification (example: create an order or mark as processed)
  const handleApproveNotif = async (notif) => {
    setAiNotifs(prev => prev.filter(n => n.id !== notif.id));
    alert(`Recomendación aprobada: ${notif.title}`);
  };

  const handleDismissNotif = async (notif) => {
    setAiNotifs(prev => prev.filter(n => n.id !== notif.id));
  };

  if (loading) {
    return <div className="container py-5"><div className="card custom-card p-4">Cargando portafolio...</div></div>;
  }

  // helper: safely extract risk label from possibly-object riskProfile
  const getRiskLabel = (p) => {
    // p can be string or object { level, score, reason, normalized } etc.
    if (!p) return '—';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
      return p.level || p.name || (p.score ? `${p.score}` : '—');
    }
    return String(p);
  };

  return (
    <div className="container py-4 portfolio-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3>Mi Portafolio</h3>
          <div className="text-muted small">Métricas clave, gestión y recomendaciones IA.</div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-primary"
            onClick={handleCreateNewPortfolio}
            disabled={!canCreateNew || processing}
            title={!canCreateNew ? 'Solo puedes tener hasta 2 portafolios activos' : 'Crear un portafolio pedagógico'}
          >
            {processing ? 'Procesando...' : 'Crear nuevo portafolio'}
          </button>

          {/* If you want the rebalance button visually disabled in this app, you can set disabled prop */}
          <button
            className={`btn ${selected && selected.autoRebalance ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={handleToggleAutoRebalance}
            disabled={!selected || processing}
            title="Activar/desactivar rebalanceo automático para el portafolio seleccionado"
          >
            {selected && selected.autoRebalance ? 'Rebalanceo automático: ON' : 'Rebalanceo automático: OFF'}
          </button>

          <button
            className="btn btn-outline-info"
            onClick={handleRequestAddAssets}
            disabled={!selected || processing}
            title="Solicitar al sistema agregar nuevos activos sugeridos"
          >
            Solicitar agregación de activos
          </button>
        </div>
      </div>

      <div className="card custom-card p-3 mb-3 portfolio-note">
        <div>
          <strong>Nota:</strong> Puedes crear hasta <strong>2 portafolios</strong>. Usa portafolios separados para estrategias distintas. El botón <em>Crear nuevo portafolio</em> se desactivará cuando alcances el límite.
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card custom-card p-3 mb-3">
            {/* Selector de portafolios */}
            <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
              {portfolios.length === 0 && <div className="small text-muted">No tienes portafolios aún.</div>}
              {portfolios.map((p, idx) => (
                <button
                  key={p.portfolioId || `pf_${idx}`}
                  className={`btn ${selectedIdx === idx ? 'btn-cta' : 'btn-outline-secondary'} btn-sm`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  {/* Nombre más amigable */}
                  {`Portafolio - ${p.portfolioId ? String(p.portfolioId) : `#${idx + 1}`}`}
                </button>
              ))}
            </div>

            {selected ? (
              <>
                {/* KPI top row */}
                <div className="row portfolio-metrics mb-3">
                  <StatCard
                    title="Valor del portafolio"
                    value={fmtCurrency(selected.metrics?.portfolioValue ?? 0)}
                    subtitle={`Holdings: ${(selected.holdings || []).length}`}
                  />
                  <StatCard
                    title="Retorno total"
                    value={selected.metrics?.totalReturnPct != null ? `${(selected.metrics.totalReturnPct * 100).toFixed(2)}%` : '—'}
                    subtitle={selected.metrics?.totalReturnAmount ? fmtCurrency(selected.metrics.totalReturnAmount) : ''}
                    accentClass="stat-card--accent"
                  />
                  <StatCard
                    title="Retorno ajustado (Sharpe)"
                    value={selected.metrics?.sharpe ?? '—'}
                    subtitle="Sharpe Ratio"
                  />
                </div>

                {/* Métricas adicionales */}
                <div className="card custom-card p-3 mb-3 metrics-card">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="small text-muted">Sharpe Ratio</div>
                      <div className="metric-value">{selected.metrics?.sharpe ?? '—'}</div>
                    </div>
                    <div>
                      <div className="small text-muted">Max Drawdown</div>
                      <div className="metric-value" style={{ color: selected.metrics?.maxDrawdown && selected.metrics.maxDrawdown < 0 ? '#ff6b6b' : undefined }}>
                        {selected.metrics?.maxDrawdown ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="small text-muted">Perfil riesgo</div>
                      <div className="metric-value">{getRiskLabel(selected.riskProfile ?? selected.metrics?.riskProfile)}</div>
                    </div>
                  </div>
                </div>

                {/* Advertencia automática si alguna posición supera umbral */}
                {selected.metrics?.portfolioValue != null && selected.holdings && selected.holdings.length > 0 && (
                  (() => {
                    const over = (selected.holdings || []).find(h => {
                      const ap = Number(h.allocationPct || 0);
                      // assume riskThreshold stored at portfolio.riskThresholdPct or user's profile
                      const riskThreshold = Number(selected.riskThresholdPct ?? (user?.financialProfile?.riskThresholdPct ?? 20));
                      return ap > riskThreshold;
                    });
                    if (over) {
                      return (
                        <div className="alert alert-warning mb-3">
                          <strong>Advertencia:</strong> una posición concentra {over.allocationPct || over.allocationPct === 0 ? `${over.allocationPct}%` : 'un porcentaje desconocido'} del portafolio, que supera tu umbral de riesgo de {selected.riskThresholdPct ?? (user?.financialProfile?.riskThresholdPct ?? 20)}%. Considera rebalacear o reducir exposición.
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {/* Top holdings list */}
                <div className="mt-1">
                  <h6>Top holdings</h6>
                  {(selected.holdings || []).length === 0 && <div className="small text-muted">Sin holdings aún.</div>}
                  {(selected.holdings || []).map((h, i) => {
                    // compute invested amount from portfolio value and allocationhttps://chatgpt.com/c/68aa730f-d778-8321-a646-07509251f377
                    const portfolioValue = Number(selected.metrics?.portfolioValue || 0);
                    const allocationPct = Number(h.allocationPct != null ? h.allocationPct : (h.allocationPct === 0 ? 0 : (h.allocationPct || 0)));
                    const investedAmount = allocationPct ? Math.round((allocationPct / 100) * portfolioValue) : null;
                    const pnlText = (h.pnlPct != null && h.pnlPct !== undefined) ? (h.pnlPct >= 0 ? `+${h.pnlPct}%` : `${h.pnlPct}%`) : '—';

                    return (
                      <div key={h.symbol + i} className="holding-row d-flex justify-content-between align-items-center p-2">
                        <div>
                          <div className="holding-symbol">{h.symbol} <span className="small text-muted">· {h.name}</span></div>
                          <div className="small text-muted">Allocation: {allocationPct ? `${allocationPct}%` : '—'} {investedAmount != null ? `· ${fmtCurrency(investedAmount)}` : ''}</div>
                        </div>
                        <div className="text-end">
                          <div className="holding-allocation">{allocationPct ? `${allocationPct}%` : '—'}</div>
                          <div className="small" style={{ color: (h.pnlPct != null && h.pnlPct >= 0) ? '#10b981' : '#ff6b6b' }}>{pnlText}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 d-flex gap-2">
                  <Link to="/trading" className="btn btn-ghost">Ir a Trading</Link>
                  <Link to="/dashboard" className="btn btn-outline-secondary">Volver al Dashboard</Link>
                </div>
              </>
            ) : (
              <div className="small text-muted">Selecciona un portafolio para ver su resumen.</div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {/* NOTE: el usuario pidió remover panel IA en portfolio - aquí solo mostramos umbral de riesgo */}
          <div className="card custom-card p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Umbral de riesgo</h6>
              <small className="text-muted">Referencia</small>
            </div>
            <div>
              <div className="small text-muted">Valor aplicado:</div>
              <div className="fw-bold">{(selected && (selected.riskThresholdPct ?? selected.metrics?.riskThresholdPct ?? user?.financialProfile?.riskThresholdPct)) ? `${selected.riskThresholdPct ?? selected.metrics?.riskThresholdPct ?? user?.financialProfile?.riskThresholdPct}%` : '—'}</div>
              <div className="small text-muted mt-2">Este umbral sirve como referencia para validaciones y alertas en trading y en recomendaciones IA.</div>
            </div>
          </div>

          {/* Si se quisiera mantener IA panel en Portfolio, lo mostraríamos aquí; según instrucción lo removemos. */}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;





