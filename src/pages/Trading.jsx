// src/pages/Trading.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';
import { portfolioService } from '../services/portfolioService';
import AssetRow from '../components/trading/AssetRow';
import NotificationsPanel from '../components/trading/NotificationsPanel';
import OrdersPanel from '../components/trading/OrdersPanel';

const Trading = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [aiNotifs, setAiNotifs] = useState([]);
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshOrders = async () => {
    try {
      const list = await orderService.getOrders();
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Error loading orders', e);
    }
  };

  const refreshPortfolio = async () => {
    try {
      const p = await portfolioService.getPortfolio();
      setPortfolio(p);
    } catch (e) {
      console.error('Error loading portfolio', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await refreshPortfolio();
        const notifs = await notificationService.getAiRecommendations();
        if (mounted) setAiNotifs(notifs || []);
        await refreshOrders();
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Compute available funds: prefer metrics.cash, fallback to portfolioValue
  const availableFunds = portfolio ? Number(portfolio.metrics?.cash ?? portfolio.metrics?.portfolioValue ?? 0) : 0;

  const handlePlaceOrder = async (orderPayload) => {
    try {
      // attach portfolioId and availableFunds explicitly
      const payload = {
        ...orderPayload,
        portfolioId: portfolio?.portfolioId,
        availableFunds
      };
      const created = await orderService.placeOrder(payload);
      // refresh orders and portfolio since mock will update portfolio when order filled
      await refreshOrders();
      await refreshPortfolio();
      return created;
    } catch (err) {
      alert(`Error al crear orden: ${err.message || err}`);
      throw err;
    }
  };

  const handleCancel = async (orderIdOrSymbol) => {
    try {
      // if string symbol passed from AssetRow cancel orders for that symbol
      if (typeof orderIdOrSymbol === 'string') {
        // cancel all pending orders for that symbol
        const toCancel = (orders || []).filter(o => o.symbol === orderIdOrSymbol && o.status === 'pending');
        await Promise.all(toCancel.map(o => orderService.cancelOrder(o.orderId)));
      } else {
        await orderService.cancelOrder(orderIdOrSymbol);
      }
      await refreshOrders();
      await refreshPortfolio();
    } catch (err) {
      alert(`No se pudo cancelar: ${err.message || err}`);
    }
  };

  const handleApproveRecommendation = async (rec) => {
    // build a suggested order payload from rec
    const suggestionPayload = {
      symbol: rec.symbol || (rec.title ? rec.title.split(' ')[0] : 'AAPL'),
      side: rec.type === 'rebalance' ? 'sell' : 'buy',
      orderType: rec.suggestedOrderType || 'market',
      investAmount: rec.suggestedAmount || Math.round((portfolio?.metrics?.portfolioValue || 1000000) * 0.02)
    };
    try {
      await handlePlaceOrder(suggestionPayload);
      // remove locally
      setAiNotifs(n => n.filter(x => x.id !== rec.id));
    } catch (e) {
      // already handled
    }
  };

  if (loading) {
    return <div className="container py-5"><div className="card custom-card p-4">Cargando entorno de trading...</div></div>;
  }

  if (!portfolio) {
    return <div className="container py-5"><div className="alert alert-warning">No hay portafolio configurado. Ve a <strong>Portfolio Intro</strong> para crearlo.</div></div>;
  }

  const holdings = portfolio.holdings || [];

  return (
    <div className="container py-4 trading-page">
      <div className="d-flex justify-content-between align-items-center mb-3 trading-page__top">
        <div>
          <h3 className="mb-0">Trading</h3>
          <div className="text-muted small">Administrador de órdenes y ejecución IA</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <div className="small text-muted">Presupuesto disponible</div>
            <div className="h5 mb-0">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(availableFunds || 0)}</div>
          </div>

          <div className="form-check form-switch">
            <input
              id="autoSwitch"
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={autoMode}
              onChange={() => setAutoMode(v => !v)}
            />
            <label className="form-check-label small" htmlFor="autoSwitch">Ejecución automática (IA)</label>
          </div>
        </div>
      </div>

      <div className="row gap-3">
        <div className="col-lg-7">
          <div className="card custom-card p-3 mb-3">
            <h6>Activos en portafolio</h6>
            <div className="mt-3">
              {holdings.length === 0 && <div className="small text-muted">No hay posiciones en el portafolio.</div>}
              {holdings.map((h, i) => (
                <AssetRow key={h.symbol + i} asset={{...h, portfolioId: portfolio.portfolioId}} onPlaceOrder={handlePlaceOrder} onCancelOrder={handleCancel} availableFunds={availableFunds} autoMode={autoMode} />
              ))}
            </div>
          </div>

          <OrdersPanel orders={orders} onCancel={handleCancel} />
        </div>

        <div className="col-lg-4">
          <NotificationsPanel notifs={aiNotifs} onApprove={handleApproveRecommendation} />
        </div>
      </div>
    </div>
  );
};

export default Trading;

// // src/pages/Trading.jsx
// import React, { useEffect, useState, useCallback } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import { orderService } from '../services/orderService';
// import { notificationService } from '../services/notificationService';
// import { portfolioService } from '../services/portfolioService';
// import AssetRow from '../components/trading/AssetRow';
// import NotificationsPanel from '../components/trading/NotificationsPanel';
// import OrdersPanel from '../components/trading/OrdersPanel';

// const fmtCurrency = (v) => {
//   try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v); }
//   catch { return v; }
// };

// const Trading = () => {
//   const { user, updateProfile } = useAuth();
//   const [portfolio, setPortfolio] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [aiNotifs, setAiNotifs] = useState([]);
//   const [autoMode, setAutoMode] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [availableFunds, setAvailableFunds] = useState(0);
//   const [notifFreq, setNotifFreq] = useState(15);

//   const refreshOrders = useCallback(async () => {
//     try {
//       const list = await orderService.getOrders();
//       setOrders(list || []);
//     } catch (e) {
//       console.error('Error refreshing orders', e);
//     }
//   }, []);

//   // load initial
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       setLoading(true);
//       try {
//         const p = await portfolioService.getPortfolio();
//         if (!mounted) return;
//         setPortfolio(p);
//         setAvailableFunds(p?.metrics?.portfolioValue ?? 0);

//         const notifs = await notificationService.getAiRecommendations();
//         if (!mounted) return;
//         setAiNotifs(notifs || []);

//         await refreshOrders();
//       } catch (e) {
//         console.error('Error inicializando trading', e);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();
//     return () => { mounted = false; };
//   }, [user, refreshOrders]);

//   // periodic recommendations reload
//   useEffect(() => {
//     let id = null;
//     const intervalMs = Math.max(1, Number(notifFreq || 15)) * 60 * 1000;
//     const tick = async () => {
//       try {
//         const nots = await notificationService.getAiRecommendations();
//         setAiNotifs(nots || []);
//       } catch (e) {
//         console.error('Error recargando notifs', e);
//       }
//     };
//     if (notifFreq > 0) id = setInterval(tick, intervalMs);
//     return () => clearInterval(id);
//   }, [notifFreq]);

//   // helpers to compute budget and usedAllocation
//   const budget = portfolio?.metrics?.portfolioValue ?? 0;
//   const usedAllocation = (() => {
//     const holdings = portfolio?.holdings || [];
//     const sum = holdings.reduce((s, h) => s + (Number(h.allocationPct) || 0), 0);
//     // convert to fraction (0..1)
//     return Math.min(1, Math.max(0, sum / 100));
//   })();

//   // place order main flow
//   const handlePlaceOrder = async (orderPayload) => {
//     setProcessing(true);
//     try {
//       // attach portfolioValue for service
//       const payload = { ...orderPayload, portfolioValue: budget, autoExecute: !!autoMode };

//       // basic validation: buy investAmount <= availableFunds
//       const investAmt = payload.investAmount != null ? Number(payload.investAmount) : null;
//       if (payload.side === 'buy' && investAmt != null && investAmt > budget) {
//         alert('El monto a invertir excede el presupuesto total del portafolio.');
//         setProcessing(false);
//         return;
//       }

//       // 1) place order
//       const order = await orderService.placeOrder(payload);

//       // optimistic orders list
//       setOrders(prev => [order, ...(prev || [])]);

//       // 2) if filled immediately, apply to portfolio and update context
//       if (order.status === 'filled') {
//         try {
//           const updatedPf = await portfolioService.applyOrder(order);
//           // update context so other pages reflect the change
//           if (updateProfile) {
//             try { await updateProfile({ portfolio: updatedPf }); } catch(e){ console.warn('updateProfile failed', e); }
//           }
//           setPortfolio(updatedPf);
//           setAvailableFunds(updatedPf?.metrics?.portfolioValue ?? budget);
//         } catch (err) {
//           console.error('Error applying filled order', err);
//         }
//       } else {
//         // 3) pending -> simulate market tick which may fill orders and triggers applyOrder in mocks
//         try {
//           await orderService.runMarketTick();
//         } catch (e) {
//           console.error('runMarketTick error', e);
//         }
//         // refresh orders + portfolio after tick
//         await refreshOrders();
//         try {
//           const pf = await portfolioService.getPortfolio();
//           setPortfolio(pf);
//           setAvailableFunds(pf?.metrics?.portfolioValue ?? budget);
//           if (updateProfile) {
//             try { await updateProfile({ portfolio: pf }); } catch(e){ console.warn('updateProfile failed', e); }
//           }
//         } catch (err) {
//           console.error('Error actualizando portafolio tras tick', err);
//         }
//       }

//       // refresh AI recs
//       try {
//         const nots = await notificationService.getAiRecommendations();
//         setAiNotifs(nots || []);
//       } catch (e) { /* ignore */ }

//       return order;
//     } catch (err) {
//       console.error('Error al crear orden', err);
//       alert(`Error al crear orden: ${err?.message || err}`);
//       throw err;
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleCancel = async (orderId) => {
//     setProcessing(true);
//     try {
//       await orderService.cancelOrder(orderId);
//       await refreshOrders();
//       // refresh portfolio
//       try {
//         const pf = await portfolioService.getPortfolio();
//         setPortfolio(pf);
//         setAvailableFunds(pf?.metrics?.portfolioValue ?? budget);
//         if (updateProfile) {
//           try { await updateProfile({ portfolio: pf }); } catch(e){ console.warn('updateProfile failed', e); }
//         }
//       } catch (err) { console.error('Error actualizando portafolio tras cancel', err); }

//       try {
//         const recs = await notificationService.getRecentNotifications();
//         setAiNotifs(recs || []);
//       } catch (e) {}
//     } catch (err) {
//       console.error('Error cancelando orden', err);
//       alert(`No se pudo cancelar: ${err?.message || err}`);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleApproveRecommendation = async (rec) => {
//     const suggestionPayload = {
//       symbol: rec.symbol || (rec.title ? rec.title.split(' ')[0] : 'AAPL'),
//       side: rec.type === 'rebalance' ? 'sell' : 'buy',
//       orderType: rec.suggestedOrderType || 'market',
//       qty: rec.qty || 1,
//       investAmount: rec.investAmount || undefined
//     };
//     try {
//       await handlePlaceOrder(suggestionPayload);
//       setAiNotifs(n => (n || []).filter(x => x.id !== rec.id));
//     } catch (e) {}
//   };

//   if (loading) {
//     return <div className="container py-5"><div className="card custom-card p-4">Cargando entorno de trading...</div></div>;
//   }

//   if (!portfolio) {
//     return <div className="container py-5"><div className="alert alert-warning">No hay portafolio configurado. Ve a <strong>Portfolio Intro</strong> para crearlo.</div></div>;
//   }

//   const holdings = portfolio.holdings || [];

//   return (
//     <div className="container py-4 trading-page">
//       <div className="d-flex justify-content-between align-items-center mb-3 trading-page__top">
//         <div>
//           <h3 className="mb-0">Trading</h3>
//           <div className="text-muted small">Administrador de órdenes y ejecución IA</div>
//         </div>

//         <div className="d-flex align-items-center gap-3">
//           <div className="text-end">
//             <div className="small text-muted">Presupuesto total</div>
//             <div className="h5 mb-0">{fmtCurrency(portfolio.metrics?.portfolioValue ?? 0)}</div>
//             <div className="small text-muted">Umbral riesgo: {portfolio?.riskThresholdPct ?? user?.financialProfile?.riskThresholdPct ?? '—'}%</div>
//           </div>

//           <div className="form-check form-switch">
//             <input
//               id="autoSwitch"
//               className="form-check-input"
//               type="checkbox"
//               role="switch"
//               checked={autoMode}
//               onChange={() => setAutoMode(v => !v)}
//               // si quieres inhabilitar: add disabled
//             />
//             <label className="form-check-label small" htmlFor="autoSwitch">Ejecución automática (IA)</label>
//           </div>
//         </div>
//       </div>

//       <div className="row gap-3">
//         <div className="col-lg-7">
//           <div className="card custom-card p-3 mb-3">
//             <h6>Activos en portafolio</h6>
//             <div className="mt-3">
//               {holdings.length === 0 && <div className="small text-muted">No hay posiciones en el portafolio.</div>}
//               {holdings.map((h, i) => (
//                 <AssetRow
//                   key={`${h.symbol}_${i}`}
//                   asset={h}
//                   onPlaceOrder={handlePlaceOrder}
//                   onCancelOrder={(symbolOrId) => {
//                     // cancel any pending orders by symbol
//                     const pending = orders.filter(o => (o.symbol === symbolOrId || o.id === symbolOrId) && o.status === 'pending');
//                     pending.forEach(po => handleCancel(po.id));
//                   }}
//                   budget={budget}
//                   usedAllocation={usedAllocation}
//                   autoMode={autoMode}
//                 />
//               ))}
//             </div>
//           </div>

//           <OrdersPanel orders={orders} onCancel={handleCancel} />
//         </div>

//         <div className="col-lg-4">
//           <NotificationsPanel
//             notifs={aiNotifs}
//             onApprove={handleApproveRecommendation}
//             notifFreq={notifFreq}
//             setNotifFreq={(v) => setNotifFreq(Number(v))}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Trading;



