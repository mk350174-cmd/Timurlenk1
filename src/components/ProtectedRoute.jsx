/**
 * @file Route guard. Renders children when authenticated; otherwise shows a
 * friendly gate that opens the auth modal. Waits out the initial session load
 * so we don't flash the gate for already-signed-in users.
 */

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useUiStore } from '../store/uiStore.js';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) openAuth('login');
  }, [isLoading, isAuthenticated, openAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-timur-200">
        <span className="animate-pulse">Yükleniyor…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mb-3 text-4xl">🔒</div>
        <h2 className="mb-2 font-display text-xl font-bold text-gold-300">Giriş Gerekli</h2>
        <p className="mb-4 text-timur-200">Bu sayfayı görüntülemek için giriş yapın.</p>
        <button type="button" className="btn-primary" onClick={() => openAuth('login')}>
          Giriş Yap
        </button>
      </div>
    );
  }

  return children;
}
