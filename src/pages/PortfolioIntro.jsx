// src/pages/PortfolioIntro.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { profileService } from '../services/profileService';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * PortfolioIntro
 * - Muestra la estimación de riesgo y assets sugeridos (desde user context o profileService).
 * - Permite crear un portafolio pedagógico usando los assets sugeridos (distribución equitativa).
 * - Respeta la regla de máximo 2 portafolios (botón deshabilitado).
 */

const fmtCurrency = (v) => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  } catch {
    return v;
  }
};

// Fallback assets por categoría (si no vienen desde profileService)
// Cada set contiene 5 activos con nombres legibles; el mock del portfolio tomará estos simbolos si no llegan recomendaciones reales.
const FALLBACK_ASSETS = {
  CONSERVADOR: [
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond' },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' }
  ],
  MODERADO: [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'IJH', name: 'iShares Core S&P Mid-Cap' },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets' }
  ],
  AGRESIVO: [
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'ARKK', name: 'ARK Innovation ETF' },
    { symbol: 'BTC', name: 'Bitcoin (proxy)' },
    { symbol: 'SOXL', name: 'Direxion Semiconductor 3x' }
  ],
  DEFAULT: [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' }
  ]
};

const PortfolioIntro = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [creating, setCreating] = useState(false);

  // derive count of existing portfolios for limiting creation
  const existingCount = (user?.portfolios && Array.isArray(user.portfolios) ? user.portfolios.length : 0) + (user?.portfolio ? 1 : 0);
  const canCreate = existingCount < 2;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // prefer user from context (fast) else call profileService
        if (user && (user.financialProfile || user.riskEstimate || user.suggestedAssets)) {
          if (!mounted) return;
          setProfileData({
            financialProfile: user.financialProfile || null,
            riskEstimate: user.riskEstimate || { level: user.computedRiskCategory || null, score: user.computedRiskScore || null },
            suggestedAssets: user.suggestedAssets || []
          });
        } else {
          const data = await profileService.getProfile();
          if (!mounted) return;
          setProfileData(data);
        }
      } catch (e) {
        console.error('Error fetching profile data', e);
        // fallback empty
        if (mounted) setProfileData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Build a canonical risk level string to show and to pick fallback assets
  const riskLevel = useMemo(() => {
    if (!profileData) return null;
    const levelFromEstimate = profileData?.riskEstimate?.level;
    const computed = profileData?.computedRiskCategory;
    return (levelFromEstimate || computed || (profileData?.financialProfile?.computedRiskCategory) || null);
  }, [profileData]);

  // compute suggestedAssets normalized: if none, use fallback set by riskLevel
  const suggestedAssets = useMemo(() => {
    if (!profileData) return [];
    if (profileData.suggestedAssets && profileData.suggestedAssets.length) {
      return profileData.suggestedAssets.slice(0, 8); // limit just in case
    }
    const key = (riskLevel || 'DEFAULT').toString().toUpperCase();
    return (FALLBACK_ASSETS[key] || FALLBACK_ASSETS.DEFAULT).slice(0, 5);
  }, [profileData, riskLevel]);

  const baseCapital = useMemo(() => {
    const val = Number(profileData?.financialProfile?.capitalDisponible ?? profileData?.capitalDisponible ?? 1000000);
    return isNaN(val) ? 1000000 : Math.round(val);
  }, [profileData]);

  const handleCreatePortfolio = async () => {
    if (!profileData || !canCreate) return;
    setCreating(true);
    try {
      // create holdings: distribute equitativamente entre suggestedAssets
      const count = suggestedAssets.length || 3;
      const per = Math.floor(100 / count);
      const remainder = 100 - per * count;

      const holdings = suggestedAssets.map((a, i) => ({
        symbol: a.symbol,
        name: a.name,
        allocationPct: i === 0 ? per + remainder : per // add remainder to first item
      }));

      const payload = {
        value: baseCapital,
        holdings,
        riskThresholdPct: Number(profileData?.financialProfile?.riskThresholdPct ?? profileData?.riskThresholdPct ?? 0)
      };

      // call portfolioService (mock or real)
      const created = await portfolioService.createPortfolio(payload);

      // update user context: keep at most 2 portafolios (UI will only allow 2)
      if (updateProfile) {
        const existing = user?.portfolios && Array.isArray(user.portfolios) ? user.portfolios : [];
        const newList = [created, ...existing].slice(0, 2);
        await updateProfile({ portfolio: created, portfolios: newList });
      }

      // navigate to portfolio page to inspect metrics
      navigate('/portfolio');
    } catch (err) {
      console.error('create portfolio err', err);
      alert('No se pudo crear el portafolio. Revisa la consola para más detalles.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="container py-4"><div className="card custom-card p-3">Cargando estimación...</div></div>;

  return (
    <div className="container py-4">
      <div className="card custom-card p-3 mb-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="mb-1">Estimación de perfil de riesgo</h4>
            <p className="small text-muted mb-2">Basado en tu perfil y el umbral que elegiste.</p>
            <div className="mb-1"><strong>Nivel estimado:</strong> {riskLevel ?? '—'}</div>
            {profileData?.riskEstimate?.reason && <div className="mb-2 small text-muted">{profileData.riskEstimate.reason}</div>}
          </div>

          <div className="text-end">
            <div className="small text-muted">Capital base</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{fmtCurrency(baseCapital)}</div>
            <div className="small text-muted mt-2">Umbral: <strong>{profileData?.financialProfile?.riskThresholdPct ?? profileData?.riskThresholdPct ?? '—'}%</strong></div>
          </div>
        </div>

        <hr />

        <h5 className="mb-2">Activos sugeridos</h5>
        {suggestedAssets.length ? (
          <div className="row g-2">
            {suggestedAssets.map((a, idx) => (
              <div key={a.symbol + idx} className="col-md-6">
                <div className="suggested-asset-card p-2">
                  <div className="suggested-asset-card__left">
                    <div className="suggested-asset-card__symbol">{a.symbol}</div>
                    <div className="small text-muted">{a.name}</div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted">Alloc. sugerida</div>
                    <div style={{ fontWeight: 800 }}>{Math.round(100 / suggestedAssets.length)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="small text-muted">No hay recomendaciones de activos aún.</div>
        )}

        <div className="mt-3 d-flex gap-2">
          <button
            className="btn btn-cta"
            onClick={handleCreatePortfolio}
            disabled={!canCreate || creating}
            title={!canCreate ? 'Solo puedes tener hasta 2 portafolios activos' : 'Crear un portafolio con las recomendaciones sugeridas'}
          >
            {creating ? 'Creando...' : 'Crear portafolio'}
          </button>

          <button className="btn btn-outline-secondary" onClick={() => navigate('/profile-setup')}>Editar perfil</button>

          {!canCreate && <div className="ms-2 small text-muted align-self-center">Has alcanzado el límite de 2 portafolios.</div>}
        </div>
      </div>
    </div>
  );
};

export default PortfolioIntro;



