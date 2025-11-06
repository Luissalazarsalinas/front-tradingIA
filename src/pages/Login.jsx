import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () =>{
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState(null);
    const navigate = useNavigate();

    const submit = async (ev) => {
        ev.preventDefault();
        setErr(null);
        try {
        const res = await login(email, password);
        const u = res.user;
        if (u && !u.profileCompleted) navigate('/onboarding');
        else navigate('/dashboard');
        } catch (e) {
        setErr(e.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="container py-5 form-section">
        <div className="row justify-content-center">
            <div className="col-md-5">
            <div className="card custom-card p-4 shadow-sm">
                <h3>Iniciar sesión</h3>
                {err && <div className="alert alert-danger">{err}</div>}
                <form onSubmit={submit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <button className="btn btn-cta" type="submit">Entrar</button>
                    <Link to="/forgot" className="text-muted">¿Olvidaste tu contraseña?</Link>
                </div>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
}

export default Login;