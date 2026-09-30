import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api';

export default function RequireAuth() {
  const [status, setStatus] = useState('loading');
  const location = useLocation();
  useEffect(() => {
    let active = true;
    const invalidate = () => { if (active) setStatus('signed-out'); };
    window.addEventListener('auth-changed', invalidate);
    api.getSession().then(() => { if (active) setStatus('signed-in'); })
      .catch(error => { if (active) setStatus(error.status === 401 ? 'signed-out' : 'error'); });
    return () => { active = false; window.removeEventListener('auth-changed', invalidate); };
  }, [location.pathname]);
  if (status === 'loading') return <p role="status">Oturum kontrol ediliyor…</p>;
  if (status === 'error') return <p role="alert">Sunucuya ulaşılamadı. Sunucuyu kontrol edip sayfayı yenileyin.</p>;
  if (status === 'signed-out') return <Navigate to="/" replace />;
  return <Outlet />;
}
