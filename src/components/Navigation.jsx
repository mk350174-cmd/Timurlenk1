/**
 * @file Top navigation bar with brand, primary links, and the user menu.
 * Collapses to a hamburger menu on small screens (mobile responsive).
 */

import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useUiStore } from '../store/uiStore.js';

const LINKS = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/talim', label: 'Talim Alanı' },
  { to: '/play', label: 'Oyna' },
  { to: '/leaderboard', label: 'Sıralama' },
];

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClass = ({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <header className="sticky top-0 z-30 border-b border-timur-600/40 bg-timur-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-gold-300">
          <span className="text-2xl" aria-hidden>♛</span>
          <span className="hidden sm:inline">Timurlenk Satranç</span>
          <span className="sm:hidden">Timurlenk</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* User area */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className={navClass}>
                <span className="inline-flex items-center gap-2">
                  <Avatar user={user} />
                  {user?.username}
                </span>
              </NavLink>
              <button type="button" className="btn-ghost text-sm" onClick={logout}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-ghost text-sm" onClick={() => openAuth('login')}>
                Giriş Yap
              </button>
              <button type="button" className="btn-primary text-sm" onClick={() => openAuth('register')}>
                Kayıt Ol
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="btn-ghost md:hidden"
          aria-label="Menü"
          onClick={() => setMobileOpen((v) => !v)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-timur-600/40 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="my-2 h-px bg-timur-600/40" />
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className={navClass} onClick={() => setMobileOpen(false)}>
                  {user?.username} — Profil
                </NavLink>
                <button
                  type="button"
                  className="btn-ghost justify-start"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  Çıkış
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => {
                    openAuth('login');
                    setMobileOpen(false);
                  }}
                >
                  Giriş
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() => {
                    openAuth('register');
                    setMobileOpen(false);
                  }}
                >
                  Kayıt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/** Small circular avatar (initial or image). */
function Avatar({ user }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />;
  }
  const initial = (user?.username ?? '?').charAt(0).toUpperCase();
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-timur-950">
      {initial}
    </span>
  );
}
