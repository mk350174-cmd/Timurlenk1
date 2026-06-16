/**
 * @file Home / landing page. Hero, three primary calls-to-action and a stats
 * banner for signed-in players.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useUiStore } from '../store/uiStore.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';
import { TIME_CONTROL_KEYS } from '../utils/constants.js';
import RatingDisplay from '../components/RatingDisplay.jsx';

const CTAS = [
  { to: '/talim', icon: '🎓', title: 'Talim Alanı', desc: '8 seviyelik bulmacalarla ustalaş.' },
  { to: '/play', icon: '⚔️', title: 'Oyna', desc: 'Çevrimiçi eşleş ya da bota karşı oyna.' },
  { to: '/leaderboard', icon: '🏆', title: 'Sıralama', desc: 'Küresel sıralamada yerini gör.' },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="card relative overflow-hidden p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -right-10 -top-10 text-[12rem] opacity-10">♛</div>
        <h1 className="font-display text-3xl font-extrabold text-white sm:text-5xl">
          Timurlenk Satranç <span className="text-gold-400">Online</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-timur-200">
          11×10 tahtada, develerin ve vezirlerin hüküm sürdüğü tarihi Timurlenk satrancı.
          Gerçek zamanlı çok oyunculu, Glicko-2 puanlama ve çevrimdışı mod.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => navigate('/play')}>
            Hemen Oyna
          </button>
          <Link to="/talim" className="btn-secondary">
            Talim Alanı
          </Link>
          {!isAuthenticated && (
            <button type="button" className="btn-ghost" onClick={() => openAuth('register')}>
              Ücretsiz Kayıt
            </button>
          )}
        </div>
        {!isSupabaseConfigured && (
          <p className="mt-4 text-xs text-timur-300">
            ℹ️ Yerel mod etkin — hesaplar ve oyunlar bu cihazda saklanıyor.
          </p>
        )}
      </section>

      {/* Stats banner */}
      {isAuthenticated && user?.ratings && (
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gold-300">
              Hoş geldin, {user.username}
            </h2>
            <Link to="/profile" className="text-sm text-gold-300 hover:underline">
              Profili gör →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIME_CONTROL_KEYS.map((tc) => (
              <div key={tc} className="rounded-xl bg-timur-900/50 p-3 text-center">
                <RatingDisplay timeControl={tc} rating={user.ratings[tc]?.rating ?? 1000} />
                <div className="mt-1 text-xs text-timur-400">
                  {user.ratings[tc]?.games_played ?? 0} oyun
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTAs */}
      <section className="grid gap-4 sm:grid-cols-3">
        {CTAS.map((c) => (
          <Link key={c.to} to={c.to} className="card group p-6 transition hover:border-gold-500/50">
            <div className="text-4xl transition-transform group-hover:scale-110">{c.icon}</div>
            <h3 className="mt-3 font-display text-xl font-bold text-white">{c.title}</h3>
            <p className="mt-1 text-sm text-timur-300">{c.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
