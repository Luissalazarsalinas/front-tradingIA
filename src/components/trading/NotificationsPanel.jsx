// src/components/trading/NotificationsPanel.jsx
import React from 'react';

const NotificationsPanel = ({ notifs = [], onApprove = () => {}, onReject = () => {}, freq, setFreq }) => {
  return (
    <div className="card custom-card p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Recomendaciones IA</h6>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="small text-muted mb-0">Frecuencia</label>
          <select className="form-select form-select-sm" style={{ width: 120 }} value={freq} onChange={(e) => setFreq(Number(e.target.value))}>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
          </select>
        </div>
      </div>

      <div>
        {notifs.length === 0 && <div className="small text-muted">No hay recomendaciones en este momento.</div>}
        {notifs.map(n => (
          <div key={n.id} className="ai-notif d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div className="small text-muted">{n.when}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-success" onClick={() => onApprove(n)}>Aprobar</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => onReject(n)}>Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPanel;
