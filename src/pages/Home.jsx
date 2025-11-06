import React from 'react';
import { Link } from 'react-router-dom';
import {FeatureCard} from '../components/FeatureCard';

const Home = () => {
    return (
        <div className="hero-section">
        <div className="container text-center py-5">
            <h1 className="hero-title">Trading Inteligente</h1>
            <p className="hero-sub">Potencia tus inversiones con inteligencia artificial avanzada</p>

            <div className="hero-cta d-flex justify-content-center gap-3 my-4">
            <Link className="btn btn-cta" to="/register">Comenzar a Invertir</Link>
            <Link className="btn btn-ghost" to="/register">Ver Portafolio</Link>
            </div>

            <div className="row mt-5 feature-grid">
            <FeatureCard title="IA Avanzada" text="Agentes epecializados que analizan el mercado 24/7 para encontrar oportunidades." icon="🤖" />
            <FeatureCard title="Análisis Técnico" text="Análisis automatizado con diversos indicadores para maximizar ganancias." icon="📊" />
            <FeatureCard title="Gestión de Riesgo" text="Sistema inteligente que protege tu capital y optimiza la relación riesgo/beneficio." icon="🛡️" />
            </div>
        </div>
        </div>
        );
    }

export default Home;  