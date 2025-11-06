import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OnboardingIntro = () => {
    
    const { user } = useAuth();

    return (
        <div className="container py-5">
        <div className="row justify-content-center">
            <div className="col-md-8">
            <div className="card onboarding-card p-4 shadow-sm">
                <div className="card-header">
                <h3>¡Bienvenido, {user?.firstName}!</h3>
                </div>
                <div className="card-body">
                <p className="hint">Para comenzar a invertir con TradingIA, por favor configura tu perfil financiero y define tus objetivos de inversión. Esto nos permite adaptar las estrategias y la gestión de riesgo a tu situación.</p>

                <div className="d-flex gap-2 mt-3">
                    <Link className="btn btn-cta" to="/profile-setup">Crear mi perfil financiero</Link>
                    <Link className="btn btn-ghost" to="/dashboard">Quizás luego (ir al panel)</Link>
                </div>

                <hr />
                <p className="text-muted small">Tu información será tratada con confidencialidad. Puedes actualizarla en cualquier momento desde tu panel.</p>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}

export default OnboardingIntro;