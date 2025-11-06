import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container py-5 text-center">
      <div className="card custom-card p-4">
        <h3>404 — No encontrado</h3>
        <p className="text-muted">La página que buscas no existe.</p>
        <Link className="btn btn-ghost" to="/">Volver al inicio</Link>
      </div>
    </div>
  );
}

export default NotFound;