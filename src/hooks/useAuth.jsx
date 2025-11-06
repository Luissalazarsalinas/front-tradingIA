// src/hooks/useAuth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

// Estructura del contexto y valores por defecto
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar user desde localStorage (si usas)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tradingia_user_v1');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('AuthProvider: error leyendo user desde localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (creds) => {
    // Mock: en producción llamas a tu API aquí
    const demoUser = {
      id: Date.now().toString(36),
      email: creds.email,
      firstName: 'Demo',
      lastName: 'User',
      portfolios: [],
      portfolio: null,
      financialProfile: null,
      // cualquier otro campo que tu app espere
    };
    setUser(demoUser);
    localStorage.setItem('tradingia_user_v1', JSON.stringify(demoUser));
    return demoUser;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('tradingia_user_v1');
  };

  const updateProfile = async (patch) => {
    // patch: objeto parcial para merge con user
    setUser(prev => {
      const updated = { ...(prev || {}), ...patch };
      try { localStorage.setItem('tradingia_user_v1', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook que obliga a usar el provider (lanza error legible si no)
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    // Mensaje claro para debugging
    throw new Error('useAuth must be used within an AuthProvider. Asegúrate de envolver <App /> con <AuthProvider>.');
  }
  return ctx;
};



