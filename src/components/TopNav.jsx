// src/components/TopNav.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <div style={{ width:36, height:36, background:'#10b981', borderRadius:6, marginRight:8 }} />
          <strong>TradingIA</strong>
        </NavLink>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/">Inicio</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/dashboard">Dashboard</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/portfolio">Portafolios</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/trading">Trading</NavLink></li>
          </ul>

          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item nav-link">Hola, {user.firstName}</li>
                <li className="nav-item"><button className="btn btn-outline-secondary" onClick={handleLogout}>Cerrar sesión</button></li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/login">Iniciar sesión</NavLink></li>
                <li className="nav-item"><NavLink className="btn btn-success" to="/register">Regístrate</NavLink></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
