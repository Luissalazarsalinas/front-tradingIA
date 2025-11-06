// src/pages/FinancialProfileForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import { useNavigate } from 'react-router-dom';
import InfoModal from '../components/InfoModal';

const defaultProfile = {
  capitalDisponible: '',
  experiencia: '',
  edad: '',
  ingresosMensuales: '',
  dependientes: 0,
  estabilidad: '',
  toleranciaPerdida: '',
  objetivoPrincipal: '',
  horizonte: '',
  expectativaRendimiento: '',
  estrategiaPortafolio: '',
  limitesConcentracion: '',
  nivelControl: '',
  riskQuestionnaire: { q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null },
  umbralRiesgo: { perdidaMensualMaxPct: '5-10%', maxDrawdownPct: '10%', stopLossPerPositionPct: 8, autoExecutionRiskPct: 10, semiautoApprovalThreshold: 3, requireApprovalForSemiauto: true },
  riskThresholdPct: 10
};

const scoringMap = {
  toCategory: (score) => {
    if (score >= 24) return 'AGRESIVO';
    if (score >= 15) return 'MODERADO';
    return 'CONSERVADOR';
  }
};

const recommendationsByCategory = {
  CONSERVADOR: { positionLimit: '2-5%', stopLossAuto: '5%', instruments: 'Acciones grandes, ETFs', leverage: '1:1', suggestedThresholdDefault: 5 },
  MODERADO: { positionLimit: '5-10%', stopLossAuto: '10%', instruments: 'Acciones, algunos CFDs', leverage: '1:2 - 1:5', suggestedThresholdDefault: 15 },
  AGRESIVO: { positionLimit: '10-20%', stopLossAuto: '20%', instruments: 'CFDs, Forex, Criptos', leverage: '1:10+', suggestedThresholdDefault: 35 }
};

const QUESTIONS = [
  { key: 'q1', title: 'Tolerancia al Riesgo General — ¿Cómo lo describirían tus amigos como inversionista?', options: [{label:'Evita riesgos completamente', value:1},{label:'Cauteloso', value:2},{label:'Toma riesgos después de investigar', value:3},{label:'Muy arriesgado / agresivo', value:4}] },
  { key: 'q2', title: 'Escenario de Ganancia Potencial — Si pudiera elegir una inversión, ¿cuál tomaría?', options: [{label:'Ganancia segura de $1,000', value:1},{label:'50% probabilidad de ganar $5,000', value:2},{label:'25% probabilidad de ganar $10,000', value:3},{label:'5% probabilidad de ganar $100,000', value:4}] },
  { key: 'q3', title: 'Reacción ante Pérdida de Capital — Si perdiera el trabajo después de invertir sus ahorros, usted:', options: [{label:'Vendería todas las inversiones inmediatamente', value:1},{label:'Vendería la mayoría, mantendría algo', value:2},{label:'Mantendría las inversiones', value:3},{label:'Invertiría más aprovechando precios bajos', value:4}] },
  { key: 'q4', title: 'Asignación de Capital Inesperado — Si recibiera $20,000 inesperados para invertir:', options: [{label:'Cuenta de ahorros / CDT', value:1},{label:'Bonos seguros / renta fija', value:2},{label:'Acciones / fondos de acciones', value:3},{label:'Trading / instrumentos especulativos', value:4}] },
  { key: 'q5', title: 'Experiencia y Comodidad — ¿Qué tan cómodo se siente con trading/inversiones volátiles?', options: [{label:'Nada cómodo', value:1},{label:'Algo cómodo', value:2},{label:'Muy cómodo', value:3},{label:'Completamente cómodo', value:4}] },
  { key: 'q6', title: 'Percepción de "Riesgo" — Al escuchar "riesgo financiero", piensa primero en:', options: [{label:'Pérdida', value:1},{label:'Incertidumbre', value:2},{label:'Oportunidad', value:3},{label:'Emoción / adrenalina', value:4}] },
  { key: 'q7', title: 'Preferencia Riesgo-Rendimiento — ¿Cuál prefiere para su portafolio mensual?', options: [{label:'+5% mejor caso / 0% peor caso', value:1},{label:'+15% mejor caso / -5% peor caso', value:2},{label:'+30% mejor caso / -15% peor caso', value:3},{label:'+50% mejor caso / -25% peor caso', value:4}] },
  { key: 'q8', title: 'Diversificación vs Concentración — Para $20,000, prefiere:', options: [{label:'70% bajo, 20% medio, 10% alto', value:1},{label:'40% bajo, 40% medio, 20% alto', value:2},{label:'20% bajo, 30% medio, 50% alto', value:3},{label:'10% bajo, 20% medio, 70% alto', value:4}] }
];

const HELP_CONTENT = {
  q1: { title: '¿Qué mide esta pregunta?', body: 'Evalúa tu disposición social a asumir riesgos como inversor. Personas que se describen como "arriesgadas" toleran mayor volatilidad.' },
  q2: { title: 'Escenario de ganancia potencial', body: 'Esta pregunta evalúa tu preferencia por recompensas seguras vs. grandes ganancias inciertas. Las probabilidades pequeñas con grandes ganancias indican mayor tolerancia al riesgo.' },
  q3: { title: 'Reacción ante pérdida de capital', body: 'Mide tu comportamiento ante una pérdida significativa. Vender inmediatamente es conservador; invertir más ante caídas sugiere mayor tolerancia.' },
  q4: { title: 'Asignación de capital inesperado', body: 'Revela si prefieres seguridad (ahorros/bonos) o usar dinero para oportunidades especulativas.' },
  q5: { title: 'Experiencia y comodidad', body: 'Combina conocimiento y tolerancia emocional a la volatilidad. Más comodidad suele correlacionar con mayor riesgo.' },
  q6: { title: 'Percepción de "riesgo"', body: 'Indica si asociás riesgo a pérdida, oportunidad o incluso emoción — esto informa tu estilo de inversión.' },
  q7: { title: 'Preferencia riesgo-rendimiento', body: 'Balance entre retorno objetivo y pérdida aceptable. Mayor retorno esperado típicamente significa tolerar mayores pérdidas.' },
  q8: { title: 'Diversificación vs concentración', body: 'Mide si prefieres diversificar para reducir riesgo o concentrarte en pocas oportunidades con mayor potencial.' },
  drawdown: { title: '¿Qué es drawdown?', body: 'El drawdown es la caída desde el punto máximo de tu portafolio hasta un mínimo. Un drawdown alto implica mayor pérdida temporal.' },
  stoploss: { title: '¿Qué es un stop-loss?', body: 'Stop-loss = orden para vender si el activo cae por debajo de un precio. Ayuda a limitar pérdidas por posición.' },
  leverage: { title: '¿Qué es apalancamiento?', body: 'Apalancamiento permite controlar más capital con menos dinero propio. Aumenta ganancias y pérdidas — usarlo requiere cuidado y gestión de riesgo.' },
  threshold: { title: '¿Qué es el "Umbral de riesgo"?', body: 'Es un porcentaje que define un límite general de exposición/ pérdidas aceptables que la plataforma usará como referencia para acciones automáticas y alertas.' }
};

const FinancialProfileForm = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const local = user?.financialProfile ?? null;
        if (local && mounted) {
          setProfile(prev => ({ ...prev, ...local }));
        } else {
          try {
            const res = await profileService.getProfile();
            if (res && mounted) {
              const merged = { ...defaultProfile, ...(res.financialProfile || {}) };
              setProfile(merged);
            }
          } catch (e) {
            // ignore
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // scoring (se mantiene para lógica interna)
  const totalScore = useMemo(() => {
    const q = profile.riskQuestionnaire || {};
    let s = 0;
    Object.values(q).forEach(v => { s += Number(v || 0); });
    return s || 0;
  }, [profile.riskQuestionnaire]);

  const suggestedCategory = useMemo(() => (totalScore === 0 ? null : scoringMap.toCategory(totalScore)), [totalScore]);

  useEffect(() => {
    if (!suggestedCategory) return;
    const rec = recommendationsByCategory[suggestedCategory];
    if (!profile.riskThresholdPct || profile.riskThresholdPct === defaultProfile.riskThresholdPct) {
      setProfile(prev => ({ ...prev, riskThresholdPct: rec.suggestedThresholdDefault }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedCategory]);

  const handleChange = (path, value) => {
    if (path.startsWith('riskQuestionnaire.')) {
      const key = path.replace('riskQuestionnaire.', '');
      setProfile(prev => ({ ...prev, riskQuestionnaire: { ...(prev.riskQuestionnaire || {}), [key]: Number(value) } }));
    } else if (path.startsWith('umbralRiesgo.')) {
      const key = path.replace('umbralRiesgo.', '');
      setProfile(prev => ({ ...prev, umbralRiesgo: { ...(prev.umbralRiesgo || {}), [key]: value } }));
    } else {
      setProfile(prev => ({ ...prev, [path]: value }));
    }
  };

  const validate = () => {
    const err = {};
    if (!profile.capitalDisponible || Number(profile.capitalDisponible) <= 0) err.capitalDisponible = 'Ingresa un monto válido';
    if (!profile.edad || Number(profile.edad) <= 0) err.edad = 'Edad inválida';
    const q = profile.riskQuestionnaire || {};
    const unanswered = QUESTIONS.map(qs => qs.key).filter(k => !q[k]);
    if (unanswered.length) err.riskQuestionnaire = 'Responde todas las preguntas del cuestionario de riesgo';
    if (profile.riskThresholdPct == null || Number(profile.riskThresholdPct) < 0 || Number(profile.riskThresholdPct) > 100) {
      err.riskThresholdPct = 'Define un porcentaje entre 0 y 100';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const computed = { ...profile, computedRiskScore: totalScore, computedRiskCategory: suggestedCategory };
      // guardar en servicio (mock o real)
      const res = await profileService.updateProfile({ financialProfile: computed });
      // actualizar contexto
      if (updateProfile) {
        await updateProfile({ financialProfile: computed, riskEstimate: res.riskEstimate || undefined, suggestedAssets: res.suggestedAssets || undefined });
      }

      // Mostrar el spinner "estimando perfil" para dar sensación de procesamiento (10s)
      setEstimating(true);
      await sleep(10000); // 10 segundos
      setEstimating(false);

      // redirigir al PortfolioIntro una vez finalice la "estimación"
      navigate('/portfolio-intro');
    } catch (err) {
      console.error('Error guardando perfil', err);
      alert('No se pudo guardar tu perfil. Intenta más tarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container py-5"><div className="card custom-card p-4">Cargando formulario...</div></div>;
  }

  const thresholdHelp = (val) => {
    const cap = Number(profile.capitalDisponible) || 1000000;
    const amount = Math.round((Number(val) / 100) * cap);
    if (val <= 10) return `Valor conservador: protege la mayor parte del capital. Ejemplo: ${amount.toLocaleString('es-CO')} COP (si tu capital es ${cap.toLocaleString('es-CO')} COP).`;
    if (val <= 25) return `Valor moderado: permite algo de riesgo buscando crecimiento. Ejemplo: ${amount.toLocaleString('es-CO')} COP.`;
    return `Valor agresivo: mayor exposición al riesgo para potenciales retornos altos. Ejemplo: ${amount.toLocaleString('es-CO')} COP.`;
  };

  return (
    <div className="container py-4 financial-profile-form">
      {/* InfoModal */}
      <InfoModal
        show={!!modalKey}
        title={modalKey ? (HELP_CONTENT[modalKey]?.title || 'Ayuda') : ''}
        onClose={() => setModalKey(null)}
      >
        <div>{modalKey ? (HELP_CONTENT[modalKey]?.body || '') : ''}</div>
      </InfoModal>

      {/* Estimating overlay (modal-like) */}
      {estimating && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-label="Estimando perfil">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content custom-modal text-center p-4">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <div className="spinner-border" role="status" aria-hidden="true" />
                </div>
                <h5>Estimando tu perfil de riesgo</h5>
                <p className="small text-muted">Esto puede tardar unos segundos. La plataforma está analizando tu perfil y generando recomendaciones personalizadas.</p>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      <div className="card custom-card p-4 mb-4">
        <h4>Perfil financiero y cuestionario de riesgo</h4>
        <p className="small text-muted">Responde las preguntas para estimar tu perfil de riesgo. Usa los iconos (i) para aprender más sobre cada pregunta o término.</p>

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Capital disponible (COP)</label>
              <input type="number" className={`form-control ${errors.capitalDisponible ? 'is-invalid' : ''}`} value={profile.capitalDisponible || ''} onChange={e => handleChange('capitalDisponible', e.target.value)} placeholder="Monto disponible para invertir" />
              {errors.capitalDisponible && <div className="invalid-feedback">{errors.capitalDisponible}</div>}
              <div className="form-text">Ej: 5.000.000</div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Edad</label>
              <input type="number" className={`form-control ${errors.edad ? 'is-invalid' : ''}`} value={profile.edad || ''} onChange={e => handleChange('edad', e.target.value)} />
              {errors.edad && <div className="invalid-feedback">{errors.edad}</div>}
            </div>
          </div>

          {/* Cuestionario de riesgo */}
          <div className="card custom-card p-3 mb-3">
            <h5 className="mb-2 d-flex align-items-center">
              Cuestionario de riesgo (8 preguntas)
              <button type="button" className="btn-help ms-2" onClick={() => setModalKey('q1')} title="Ejemplo: ayuda general">i</button>
            </h5>
            <p className="small text-muted mb-3">Selecciona la opción que mejor te represente. Pulsa (i) para explicaciones pedagógicas.</p>

            {QUESTIONS.map((qs) => (
              <div key={qs.key} className="mb-3 question-block">
                <div className="d-flex align-items-center">
                  <div className="fw-semibold">{qs.title}</div>
                  <button type="button" className="btn-help ms-2" onClick={() => setModalKey(qs.key)} aria-label={`Ayuda ${qs.key}`}>i</button>
                </div>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {qs.options.map(opt => (
                    <div className="form-check" key={opt.value}>
                      <input className="form-check-input" type="radio" name={qs.key} id={`${qs.key}_${opt.value}`} checked={profile.riskQuestionnaire?.[qs.key] === opt.value} onChange={() => handleChange(`riskQuestionnaire.${qs.key}`, opt.value)} />
                      <label className="form-check-label ms-2" htmlFor={`${qs.key}_${opt.value}`}>{opt.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {errors.riskQuestionnaire && <div className="text-danger small mb-2">{errors.riskQuestionnaire}</div>}

            {/* NOTE: Puntuación actual y nivel estimado fueron removidos del UI por petición */}
          </div>

          {/* Umbral de riesgo (permanece) */}
          <div className="card custom-card p-3 mb-3">
            <h5 className="mb-2 d-flex align-items-center">
              Umbral de riesgo (porcentaje)
              <button type="button" className="btn-help ms-2" onClick={() => setModalKey('threshold')} aria-label="Ayuda umbral">i</button>
            </h5>
            <p className="small text-muted mb-3">Define un umbral que la plataforma usará como referencia para límites, alertas y acciones automáticas.</p>

            <div className="row align-items-center">
              <div className="col-md-8 mb-3">
                <input type="range" className="form-range" min="0" max="100" value={Number(profile.riskThresholdPct ?? 0)} onChange={e => handleChange('riskThresholdPct', Number(e.target.value))} />
                <div className="d-flex justify-content-between small text-muted mt-1"><div>0%</div><div>100%</div></div>
              </div>

              <div className="col-md-4 mb-3 d-flex align-items-center gap-2">
                <input type="number" min="0" max="100" className={`form-control form-control-sm ${errors.riskThresholdPct ? 'is-invalid' : ''}`} style={{ width: 110 }} value={profile.riskThresholdPct ?? ''} onChange={e => handleChange('riskThresholdPct', Number(e.target.value))} />
                <div className="small text-muted">%</div>
                {errors.riskThresholdPct && <div className="invalid-feedback d-block">{errors.riskThresholdPct}</div>}
              </div>
            </div>

            <div className="mt-2">
              <div className="small text-muted">Sugerencia basada en tu perfil: <strong>{suggestedCategory ?? '—'}</strong></div>
              <div className="mt-1">
                {suggestedCategory ? (
                  <div className="small">
                    <strong>Recomendación:</strong> Límite por posición {recommendationsByCategory[suggestedCategory].positionLimit}, Stop-loss {recommendationsByCategory[suggestedCategory].stopLossAuto}, Instrumentos: {recommendationsByCategory[suggestedCategory].instruments}, Apalancamiento: {recommendationsByCategory[suggestedCategory].leverage}.
                  </div>
                ) : (
                  <div className="small text-muted">Responde el cuestionario para ver recomendaciones personalizadas.</div>
                )}
              </div>
            </div>

            <div className="mt-2 small text-muted"><strong>Qué significa el valor elegido:</strong> {thresholdHelp(Number(profile.riskThresholdPct ?? 0))}</div>
          </div>

          {/* Nota: La tarjeta "Ajustes adicionales de riesgo (opcional)" ha sido removida por petición */}

          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-cta" disabled={saving || estimating}>{saving ? 'Guardando...' : 'Guardar perfil y continuar'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialProfileForm;







