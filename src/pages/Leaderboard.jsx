/**
 * @file Leaderboard — global rankings per time control. Reads from Supabase in
 * cloud mode, or the local profile registry in offline mode. Highlights the
 * signed-in user's row.
 */

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { storageService } from '../services/storageService.js';
import { useAuth } from '../hooks/useAuth.js';
import { TIME_CONTROLS, TIME_CONTROL_KEYS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const PAGE_SIZE = 50;

/** Fetch the ranked list for a time control (cloud or local). */
async function fetchLeaderboard(timeControl) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating, rd, games_played, wins, user_id, users(username)')
        .eq('time_control', timeControl)
        .order('rating', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        userId: r.user_id,
        username: r.users?.username ?? 'Oyuncu',
        rating: r.rating,
        games: r.games_played,
        wins: r.wins,
      }));
    } catch (err) {
      logger.warn('leaderboard cloud fetch failed:', err);
    }
  }
  // Local fallback: aggregate the local profile registry.
  const profiles = Object.values(storageService.getLocalProfiles());
  return profiles
    .map((p) => {
      const r = p.ratings?.[timeControl];
      return r
        ? { userId: p.id, username: p.username, rating: r.rating, games: r.games_played, wins: r.wins }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, PAGE_SIZE);
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [timeControl, setTimeControl] = useState('blitz');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLeaderboard(timeControl)
      .then((data) => active && setRows(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [timeControl]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Sıralama</h1>
        <p className="mt-1 text-timur-300">Küresel en iyi oyuncular.</p>
      </header>

      {/* Time control filter */}
      <div className="flex flex-wrap gap-2">
        {TIME_CONTROL_KEYS.map((tc) => (
          <button
            key={tc}
            type="button"
            onClick={() => setTimeControl(tc)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              timeControl === tc ? 'bg-gold-500 text-timur-950' : 'bg-timur-800/60 text-timur-200 hover:bg-timur-700'
            }`}
          >
            {TIME_CONTROLS[tc].icon} {TIME_CONTROLS[tc].name}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-4">
        {loading ? (
          <p className="text-timur-300">Yükleniyor…</p>
        ) : rows.length === 0 ? (
          <p className="text-timur-300">Henüz sıralama verisi yok. İlk oyununu oynayarak listeye gir!</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-timur-600/40 text-left text-xs uppercase tracking-wide text-timur-400">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Oyuncu</th>
                <th className="py-2 pr-2 text-right">Puan</th>
                <th className="py-2 pr-2 text-right">Oyun</th>
                <th className="py-2 pr-2 text-right">Kazanma</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = user && r.userId === user.id;
                const winRate = r.games ? Math.round((r.wins / r.games) * 100) : 0;
                return (
                  <tr
                    key={r.userId ?? i}
                    className={`border-b border-timur-700/30 ${isMe ? 'bg-gold-500/10' : ''}`}
                  >
                    <td className="py-2 pr-2 font-bold text-gold-300">{i + 1}</td>
                    <td className="py-2 pr-2 text-white">
                      {r.username} {isMe && <span className="text-xs text-gold-300">(siz)</span>}
                    </td>
                    <td className="py-2 pr-2 text-right font-semibold text-white">{r.rating}</td>
                    <td className="py-2 pr-2 text-right text-timur-300">{r.games}</td>
                    <td className="py-2 pr-2 text-right text-timur-300">{winRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
