// src/router/AppRouter.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotFound from '../pages/NotFound';

const HomePage = lazy(() => import('../pages/Home'));
const RegisterPage = lazy(() => import('../pages/Register'));
const LoginPage = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const OnboardingIntro = lazy(() => import('../pages/OnboardingIntro'));
const FinancialProfileForm = lazy(() => import('../pages/FinancialProfileForm'));
// const ConfirmRoute = lazy(() => import('../pages/ConfirmRoute'));
const PortfolioIntro = lazy(() => import('../pages/PortfolioIntro'));
const Portfolio = lazy(() => import('../pages/Portfolio'));
const Trading = lazy(() => import('../pages/Trading'));
const NotFoundPage = NotFound;

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PostLoginRedirect = ({ children }) => {
  const { user } = useAuth();
  // Si quieres forzar onboarding: if user && !user.profileCompleted -> redirect to /onboarding
  if (user && !user.profileCompleted) return <Navigate to="/onboarding" replace />;
  return children;
};

export const AppRouter = () => {
  return (
    <Suspense fallback={<div className="container py-5"><div className="card p-4">Cargando...</div></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/onboarding" element={<RequireAuth><OnboardingIntro /></RequireAuth>} />
        <Route path="/profile-setup" element={<RequireAuth><FinancialProfileForm /></RequireAuth>} />

        <Route path="/portfolio-intro" element={<RequireAuth><PortfolioIntro /></RequireAuth>} />
        <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />

        <Route path="/trading" element={<RequireAuth><Trading /></RequireAuth>} />

        <Route path="/dashboard" element={<RequireAuth><PostLoginRedirect><Dashboard /></PostLoginRedirect></RequireAuth>} />

        {/* <Route path="/confirm/:token" element={<ConfirmRoute />} /> */}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
