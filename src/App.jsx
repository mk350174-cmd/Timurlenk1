/**
 * @file Root application component: routing, global chrome (nav, toasts,
 * offline badge, auth modal) and one-time bootstrapping (auth session + the
 * online → offline auto-sync trigger from spec PHASE 9).
 */

import { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navigation from './components/Navigation.jsx';
import AuthModal from './components/AuthModal.jsx';
import ToastContainer from './components/Toast.jsx';
import OfflineBadge from './components/OfflineBadge.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import TalimAlani from './pages/TalimAlani.jsx';
import OnlineGame from './pages/OnlineGame.jsx';
import Profile from './pages/Profile.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import NotFound from './pages/NotFound.jsx';

import { useAuthStore } from './store/authStore.js';
import { useRatingStore } from './store/ratingStore.js';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { syncAllOfflineGames } from './services/syncService.js';
import { storageService } from './services/storageService.js';
import { toast } from './store/toastStore.js';

/** Minimum time offline games wait before auto-sync fires (spec: 2 minutes). */
const SYNC_DELAY_MS = 2 * 60 * 1000;

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);
  const setRatings = useRatingStore((s) => s.setRatings);
  const isOnline = useOnlineStatus();
  const wasOnline = useRef(isOnline);

  // Hydrate auth session once on mount.
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Keep the rating store mirrored to the signed-in profile.
  useEffect(() => {
    if (user?.ratings) setRatings(user.ratings);
  }, [user, setRatings]);

  // Auto-sync offline games when connectivity is (re)gained.
  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      toast.success('⚪ Tekrar çevrimiçisiniz.');
      const pending = storageService.getUnsyncedGames();
      if (pending.length > 0) {
        // Respect the 2-minute settle window unless games are already old.
        const oldest = Math.min(...pending.map((g) => new Date(g.created_at).getTime()));
        const wait = Math.max(0, SYNC_DELAY_MS - (Date.now() - oldest));
        const timer = setTimeout(async () => {
          const res = await syncAllOfflineGames();
          if (res.synced > 0 || res.flagged > 0) {
            toast.info(
              `Senkronizasyon: ${res.synced} oyun gönderildi` +
                (res.flagged ? `, ${res.flagged} inceleme kuyruğunda` : ''),
            );
          }
        }, wait);
        return () => clearTimeout(timer);
      }
    }
    if (!isOnline && wasOnline.current) {
      toast.warn('🔴 Bağlantı koptu — çevrimdışı moddasınız.', { duration: 6000 });
    }
    wasOnline.current = isOnline;
    return undefined;
  }, [isOnline]);

  return (
    <div className="flex min-h-full flex-col">
      <Navigation />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/talim" element={<TalimAlani />} />
          <Route path="/play" element={<OnlineGame />} />
          <Route path="/play/:gameId" element={<OnlineGame />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <OfflineBadge />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
