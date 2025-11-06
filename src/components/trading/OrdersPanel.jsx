// src/components/trading/OrdersPanel.jsx
import React from 'react';

const OrdersPanel = ({ orders = [], onCancel = () => {} }) => {
  return (
    <div className="card custom-card p-3 mb-3">
      <h6>Órdenes recientes</h6>
      {orders.length === 0 && <div className="small text-muted">No hay órdenes.</div>}
      {orders.map(o => (
        <div key={o.orderId} className="order-row d-flex justify-content-between align-items-center">
          <div>
            <div style={{ fontWeight: 700 }}>{o.symbol} • {o.side.toUpperCase()}</div>
            <div className="small text-muted">{o.orderType} • {o.status}</div>
          </div>
          <div className="text-end">
            <div>{Number(o.investAmount || 0).toLocaleString('es-CO')} COP</div>
            <div className="small text-muted">{o.filledAt ? new Date(o.filledAt).toLocaleString() : (o.createdAt ? new Date(o.createdAt).toLocaleString() : '')}</div>
            {o.status === 'pending' && <button className="btn btn-sm btn-outline-danger mt-1" onClick={() => onCancel(o.orderId)}>Cancelar</button>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersPanel;


// // src/components/trading/OrdersPanel.jsx
// import React from 'react';

// const OrdersPanel = ({ orders = [], onCancel = () => {} }) => {
//   return (
//     <div className="card custom-card p-3 mb-3">
//       <h6>Órdenes recientes</h6>
//       {orders.length === 0 && <div className="small text-muted">No hay órdenes recientemente.</div>}
//       {orders.map(o => (
//         <div key={o.id} className="order-row d-flex justify-content-between align-items-center mb-2">
//           <div>
//             <div style={{fontWeight:700}}>{o.symbol} · {o.side.toUpperCase()} · {o.orderType}</div>
//             <div className="small text-muted">
//               {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
//               {o.executedAt ? ` · Ejecutada: ${new Date(o.executedAt).toLocaleString()}` : ''}
//               {' · '}Monto: {o.investAmount ? new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP' }).format(o.investAmount) : '—'}
//               {' · qty: '}{o.qty ?? '—'}
//             </div>
//           </div>

//           <div style={{ textAlign: 'right' }}>
//             <div style={{ textTransform: 'capitalize', fontWeight: 700 }}>{o.status}</div>
//             {o.status === 'pending' && <button className="btn btn-sm btn-outline-danger mt-1" onClick={() => onCancel(o.id)}>Cancelar</button>}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default OrdersPanel;


