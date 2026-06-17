/**
 * @file AchievementBadges — derives earned/locked badges from a user's ratings
 * map and renders them with progress bars for the locked ones.
 *
 * @param {object} props
 * @param {Record<string, object>} props.ratings per-time-control ratings
 */

import { useMemo } from 'react';

/** Badge catalogue: each computes progress from aggregate stats. */
const BADGES = [
  { id: 'first_game', icon: '🎯', name: 'İlk Oyun', target: 1, value: (s) => s.games },
  { id: 'first_win', icon: '🏅', name: 'İlk Zafer', target: 1, value: (s) => s.wins },
  { id: 'games_10', icon: '⚔️', name: '10 Oyun', target: 10, value: (s) => s.games },
  { id: 'games_100', icon: '🛡️', name: '100 Oyun', target: 100, value: (s) => s.games },
  { id: 'games_500', icon: '👑', name: '500 Oyun', target: 500, value: (s) => s.games },
  { id: 'streak_5', icon: '🔥', name: '5 Galibiyet Serisi', target: 5, value: (s) => s.bestStreak },
  { id: 'master_1600', icon: '🌟', name: 'Usta (1600+)', target: 1600, value: (s) => s.maxRating },
  { id: 'gm_2000', icon: '💎', name: 'Büyük Usta (2000+)', target: 2000, value: (s) => s.maxRating },
];

/** Aggregate per-time-control rows into single stat object. */
function aggregate(ratings) {
  const rows = Object.values(ratings ?? {});
  return rows.reduce(
    (acc, r) => ({
      games: acc.games + (r.games_played ?? 0),
      wins: acc.wins + (r.wins ?? 0),
      maxRating: Math.max(acc.maxRating, r.highest_rating ?? r.rating ?? 0),
      bestStreak: Math.max(acc.bestStreak, r.current_streak ?? 0),
    }),
    { games: 0, wins: 0, maxRating: 0, bestStreak: 0 },
  );
}

export default function AchievementBadges({ ratings }) {
  const stats = useMemo(() => aggregate(ratings), [ratings]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BADGES.map((b) => {
        const value = b.value(stats);
        const earned = value >= b.target;
        const pct = Math.min(100, Math.round((value / b.target) * 100));
        return (
          <div
            key={b.id}
            className={`rounded-xl border p-3 text-center transition ${
              earned
                ? 'border-gold-500/50 bg-gold-500/10'
                : 'border-timur-600/40 bg-timur-900/40 opacity-70'
            }`}
            title={earned ? 'Kazanıldı' : `${value}/${b.target}`}
          >
            <div className={`text-2xl ${earned ? '' : 'grayscale'}`}>{b.icon}</div>
            <div className="mt-1 text-xs font-semibold text-timur-100">{b.name}</div>
            {!earned && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-timur-700">
                <div className="h-full bg-gold-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
