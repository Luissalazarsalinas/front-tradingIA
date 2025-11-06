// src/components/trading/AssetRow.jsx
import React, { useState } from 'react';

const OrderControls = ({ onSubmit, availableFunds = 0, asset = {}, autoMode = false }) => {
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [investAmount, setInvestAmount] = useState( Math.max(0, Math.round((availableFunds || 0) * 0.05)) ); // default 5% of available

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      symbol: asset.symbol,
      side,
      orderType,
      qty: Number(qty),
      limitPrice: orderType === 'limit' ? Number(limitPrice) : null,
      stopPrice: orderType === 'stop-loss' ? Number(stopPrice) : null,
      investAmount: Number(investAmount)
    };
    await onSubmit(payload);
  };

  const insufficient = side === 'buy' && Number(investAmount) > Number(availableFunds || 0);

  return (
    <form className="asset-order-form" onSubmit={handleSubmit}>
      <div className="d-flex gap-2 align-items-center flex-wrap">
        <select className="form-select form-select-sm" value={side} onChange={e => setSide(e.target.value)}>
          <option value="buy">Comprar</option>
          <option value="sell">Vender</option>
        </select>

        <select className="form-select form-select-sm" value={orderType} onChange={e => setOrderType(e.target.value)}>
          <option value="market">Market</option>
          <option value="limit">Limit</option>
          <option value="stop-loss">Stop-Loss</option>
        </select>

        <input className="form-control form-control-sm" type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} style={{ width: 90 }} />

        {orderType === 'limit' && (
          <input className="form-control form-control-sm" type="number" placeholder="Precio límite" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} style={{ width: 130 }} />
        )}

        {orderType === 'stop-loss' && (
          <input className="form-control form-control-sm" type="number" placeholder="Stop price" value={stopPrice} onChange={e => setStopPrice(e.target.value)} style={{ width: 130 }} />
        )}

        <div style={{ width: 140 }}>
          <input className="form-control form-control-sm" type="number" min="0" step="1" value={investAmount} onChange={e => setInvestAmount(Number(e.target.value))} />
          <div className="small text-muted">COP a invertir</div>
        </div>

        <button className="btn btn-sm btn-primary" type="submit" disabled={insufficient}>
          {insufficient ? 'Fondos insuficientes' : (autoMode ? 'Enviar (IA)' : 'Enviar')}
        </button>
      </div>

      <div className="small mt-2 text-muted">
        P&L actual: <strong style={{ color: asset.pnlPct >= 0 ? '#10b981' : '#ff6b6b' }}>{asset.pnlPct >= 0 ? `+${asset.pnlPct}%` : `${asset.pnlPct}%`}</strong>
        <span className="ms-3">Valor posición: <strong>{asset.value ? asset.value.toLocaleString('es-CO') + ' COP' : '—'}</strong></span>
      </div>
    </form>
  );
};

const AssetRow = ({ asset, onPlaceOrder, onCancelOrder, availableFunds = 0, autoMode = false }) => {
  const [expanded, setExpanded] = useState(false);

  const handlePlace = async (payload) => {
    try {
      // attach portfolioId and availableFunds to payload
      const enriched = { ...payload, portfolioId: asset.portfolioId, availableFunds };
      await onPlaceOrder(enriched);
    } catch (e) {
      // bubble up
      throw e;
    }
  };

  return (
    <div className="asset-row">
      <div className="asset-row__head d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <div className="asset-row__icon">{(asset.symbol || '').slice(0,3)}</div>
          <div>
            <div className="asset-row__symbol">{asset.symbol} <span className="small text-muted"> - {asset.name}</span></div>
            <div className="small text-muted">Allocation: {asset.allocationPct ?? '—'}%</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="small text-muted">P&L: <span style={{ color: asset.pnlPct >= 0 ? '#10b981' : '#ff6b6b', fontWeight: 700 }}>{asset.pnlPct >= 0 ? `+${asset.pnlPct}%` : `${asset.pnlPct}%`}</span></div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setExpanded(e => !e)}>{expanded ? 'Ocultar' : 'Operar'}</button>
        </div>
      </div>

      {expanded && (
        <div className="asset-row__body mt-2">
          <OrderControls onSubmit={handlePlace} availableFunds={availableFunds} asset={asset} autoMode={autoMode} />
          <div className="mt-2 d-flex gap-2">
            <button className="btn btn-sm btn-outline-danger" onClick={() => onCancelOrder(asset.symbol)}>Cancelar órdenes (símbolo)</button>
            <button className="btn btn-sm btn-outline-info" onClick={() => alert('Abrir modal de detalles (mock)')}>Detalles</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetRow;


// // src/components/trading/AssetRow.jsx
// import React, { useState } from 'react';

// /**
//  * Props:
//  * - asset: { symbol, name, allocationPct, value, pnlPct, price? }
//  * - onPlaceOrder(payload): async -> creates order. payload should include investAmount if user set it.
//  * - onCancelOrder(symbolOrId)
//  * - budget: number (total portfolio value)
//  * - usedAllocation: number (0..1 fraction of used allocation)
//  * - autoMode: bool
//  */
// const AssetRow = ({ asset, onPlaceOrder, onCancelOrder, budget = 0, usedAllocation = 0, autoMode = false }) => {
//   const [expanded, setExpanded] = useState(false);
//   const [side, setSide] = useState('buy');
//   const [orderType, setOrderType] = useState('market');
//   const [qty, setQty] = useState(1);
//   const [limitPrice, setLimitPrice] = useState('');
//   const [stopPrice, setStopPrice] = useState('');
//   const [investAmount, setInvestAmount] = useState(''); // COP
//   const [submitting, setSubmitting] = useState(false);

//   // compute available funds conservatively: budget * (1 - usedAllocation)
//   const clampUsed = Number(isFinite(usedAllocation) ? usedAllocation : 0);
//   const usedFrac = Math.min(1, Math.max(0, clampUsed));
//   const availableFunds = Math.max(0, Number(budget || 0) * (1 - usedFrac));

//   // P&L displays: money and %
//   const pnlPct = typeof asset.pnlPct === 'number' ? asset.pnlPct : null;
//   const pnlMoney = (pnlPct != null && asset.value != null) ? Math.round((pnlPct / 100) * Number(asset.value)) : null;

//   const handleSubmit = async (e) => {
//     e && e.preventDefault();
//     setSubmitting(true);
//     try {
//       // compute investAmount to send: prefer explicit investAmount by user, otherwise approximate by qty * price
//       let investAmt = investAmount ? Number(investAmount) : null;
//       if (!investAmt && qty && asset.price) investAmt = Number(qty) * Number(asset.price);
//       if (!investAmt && qty && !asset.price) investAmt = Number(qty); // fallback

//       // validate available funds for buy
//       if (side === 'buy' && investAmt != null && investAmt > availableFunds) {
//         alert('Fondos insuficientes para esta compra según presupuesto disponible.');
//         setSubmitting(false);
//         return;
//       }

//       const payload = {
//         symbol: asset.symbol,
//         name: asset.name,
//         side,
//         orderType,
//         qty: Number(qty) || 1,
//         limitPrice: orderType === 'limit' ? (limitPrice ? Number(limitPrice) : null) : null,
//         stopPrice: orderType === 'stop-loss' ? (stopPrice ? Number(stopPrice) : null) : null,
//         investAmount: investAmt,
//         price: asset.price || undefined,
//         autoExecute: !!autoMode
//       };

//       await onPlaceOrder(payload);

//       // clear small inputs on success (optional)
//       setLimitPrice('');
//       setStopPrice('');
//       setInvestAmount('');
//       setQty(1);
//       setExpanded(false);
//     } catch (err) {
//       console.error('Error placing order from AssetRow', err);
//       alert('No se pudo crear la orden. Revisa la consola.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="asset-row mb-3">
//       <div className="asset-row__head d-flex align-items-center justify-content-between">
//         <div className="d-flex align-items-center">
//           <div className="asset-row__icon me-3" style={{ width: 56, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', fontWeight: 700 }}>
//             {(asset.symbol || '').slice(0, 3)}
//           </div>

//           <div>
//             <div className="asset-row__symbol" style={{ fontWeight: 800 }}>
//               {asset.symbol}
//               <span className="small text-muted"> · {asset.name}</span>
//             </div>
//             <div className="small text-muted">
//               Allocation: {asset.allocationPct != null ? `${asset.allocationPct}%` : '—'}
//               {asset.value != null ? ` · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(asset.value)}` : ''}
//             </div>
//           </div>
//         </div>

//         <div className="d-flex align-items-center gap-3">
//           <div className="text-end small">
//             <div>P&L: <span style={{ color: pnlPct >= 0 ? '#10b981' : '#ff6b6b', fontWeight: 700 }}>
//               {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct}%` : '—'}
//               {pnlMoney != null ? ` (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(pnlMoney)})` : ''}
//             </span></div>
//             <div className="small text-muted">Disponible: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(availableFunds)}</div>
//           </div>

//           <div className="d-flex gap-2">
//             <button className="btn btn-sm btn-outline-secondary" onClick={() => setExpanded(v => !v)}>{expanded ? 'Ocultar' : 'Operar'}</button>
//             <button className="btn btn-sm btn-outline-danger" onClick={() => onCancelOrder && onCancelOrder(asset.symbol)}>Cancelar órdenes</button>
//           </div>
//         </div>
//       </div>

//       {expanded && (
//         <div className="asset-row__body mt-2">
//           <form onSubmit={handleSubmit} className="asset-order-form">
//             <div className="d-flex gap-2 align-items-center flex-wrap">
//               <select className="form-select form-select-sm" value={side} onChange={e => setSide(e.target.value)} style={{ width: 110 }}>
//                 <option value="buy">Comprar</option>
//                 <option value="sell">Vender</option>
//               </select>

//               <select className="form-select form-select-sm" value={orderType} onChange={e => setOrderType(e.target.value)} style={{ width: 120 }}>
//                 <option value="market">Market</option>
//                 <option value="limit">Limit</option>
//                 <option value="stop-loss">Stop-Loss</option>
//               </select>

//               <input className="form-control form-control-sm" type="number" min="1" step="1" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: 90 }} />

//               {orderType === 'limit' && (
//                 <input className="form-control form-control-sm" type="number" placeholder="Precio límite" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} style={{ width: 130 }} />
//               )}

//               {orderType === 'stop-loss' && (
//                 <input className="form-control form-control-sm" type="number" placeholder="Stop price" value={stopPrice} onChange={e => setStopPrice(e.target.value)} style={{ width: 130 }} />
//               )}

//               <input
//                 className="form-control form-control-sm"
//                 type="number"
//                 placeholder="Monto a invertir (COP)"
//                 value={investAmount}
//                 onChange={e => setInvestAmount(e.target.value)}
//                 style={{ width: 180 }}
//               />

//               <button className={`btn btn-sm ${autoMode ? 'btn-success' : 'btn-primary'}`} type="submit" disabled={submitting}>
//                 {submitting ? 'Enviando...' : (autoMode ? 'Enviar (IA)' : 'Enviar')}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AssetRow;



