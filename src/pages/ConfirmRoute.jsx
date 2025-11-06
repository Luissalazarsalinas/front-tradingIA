import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ConfirmRoute = () => {
  const { confirmEmail } = useAuth();
  const { token } = useParams();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await confirmEmail(token);
        if (mounted) setStatus('ok');
      } catch (e) {
        if (mounted) setStatus('error');
      }
    })();
    return () => {mounted = false;};
  }, [token, confirmEmail]);

  return (
    <div className="container py-5">
      {status === 'pending' && <div className="alert alert-info">Confirmando email...</div>}
      {status === 'ok' && <div className="alert alert-success">Email confirmado. Ya puedes iniciar sesión. <Link to="/login">Iniciar sesión</Link></div>}
      {status === 'error' && <div className="alert alert-danger">Token inválido o expirado.</div>}
    </div>
  );
}

export default ConfirmRoute;