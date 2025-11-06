// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const err = {};
    if (!form.email || !form.email.includes('@')) err.email = 'Email inválido';
    if (!form.password || form.password.length < 8) err.password = 'La contraseña debe tener al menos 8 caracteres';
    if (form.password !== form.confirmPassword) err.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.firstName) err.firstName = 'Ingresa tu nombre';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone
      });

      // Registro exitoso: NO hay confirmación por email en esta versión.
      // Redirigir a login para que el usuario inicie sesión.
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      console.error('Register error', err);
      alert(err?.message || 'Error registrando usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card custom-card p-4 mx-auto" style={{ maxWidth: 720 }}>
        <h4>Crear cuenta</h4>
        <p className="small text-muted">Regístrate para acceder a trading inteligente. No es necesaria confirmación por email en esta versión.</p>

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Nombre</label>
              <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Apellido</label>
              <input className="form-control" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={e => handleChange('email', e.target.value)} />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={e => handleChange('password', e.target.value)} />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              <div className="form-text">Mínimo 8 caracteres. Incluye números y mayúsculas para mayor seguridad.</div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Confirmar contraseña</label>
              <input type="password" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono (opcional)</label>
            <input className="form-control" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-cta" type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
            <Link to="/login" className="btn btn-outline-secondary">Ir a iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
