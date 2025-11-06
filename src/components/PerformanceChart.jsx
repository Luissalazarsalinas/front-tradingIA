import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
} from 'recharts';

// Formateadores
const fmtCurrencyShort = (v) => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  } catch {
    return v;
  }
};

const PerformanceChart = ({ data = [], height = 260 }) => {
  // data: [{ date: '2025-01', value: 123000, benchmark: 100000 }, ...]
  return (
    <div className="chart-container" role="img" aria-label="Gráfico de rendimiento del portafolio">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <Tooltip
            formatter={(value) => [fmtCurrencyShort(value), 'Valor']}
            labelFormatter={(label) => `Periodo: ${label}`}
            contentStyle={{ background: '#061018', border: '1px solid rgba(255,255,255,0.04)', color: '#cfeff4' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }} />
          <Line type="monotone" dataKey="value" name="Portafolio" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="#7dd3fc" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          <Brush dataKey="date" height={24} stroke="rgba(255,255,255,0.06)" travellerWidth={8} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;