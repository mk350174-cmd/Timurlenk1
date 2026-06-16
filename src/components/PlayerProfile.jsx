/**
 * @file PlayerProfile — reusable profile card for any user (current or other).
 * Shows identity, per-time-control ratings and achievement badges.
 *
 * @param {object} props
 * @param {object} props.profile { username, joined_date, avatar_url, ratings }
 * @param {boolean} [props.isCurrentUser]
 * @param {() => void} [props.onChallenge]
 */

import RatingDisplay from './RatingDisplay.jsx';
import AchievementBadges from './AchievementBadges.jsx';
import { TIME_CONTROL_KEYS } from '../utils/constants.js';

function formatJoined(iso) {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
  } catch {
    return '—';
  }
}

export default function PlayerProfile({ profile, isCurrentUser = false, onChallenge }) {
  if (!profile) return null;
  const ratings = profile.ratings ?? {};

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-500 text-3xl font-bold text-timur-950">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (profile.username ?? '?').charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-display text-2xl font-bold text-white">{profile.username}</h2>
          <p className="text-sm text-timur-300">Üyelik: {formatJoined(profile.joined_date)}</p>
        </div>
        {!isCurrentUser && onChallenge && (
          <button type="button" className="btn-primary" onClick={onChallenge}>
            Meydan Oku
          </button>
        )}
      </div>

      {/* Ratings grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {TIME_CONTROL_KEYS.map((tc) => {
          const r = ratings[tc] ?? { rating: 1000, rd: 350, games_played: 0, wins: 0, losses: 0, draws: 0, current_streak: 0 };
          const winRate = r.games_played ? Math.round((r.wins / r.games_played) * 100) : 0;
          return (
            <div key={tc} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <RatingDisplay timeControl={tc} rating={r.rating} rd={r.rd} />
                <span
                  className={`text-sm font-semibold ${
                    r.current_streak > 0 ? 'text-emerald-300' : r.current_streak < 0 ? 'text-rose-300' : 'text-timur-300'
                  }`}
                >
                  Seri: {r.current_streak > 0 ? `+${r.current_streak}` : r.current_streak}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-timur-200">
                <Stat label="Oyun" value={r.games_played} />
                <Stat label="Galibiyet" value={r.wins} />
                <Stat label="Mağlubiyet" value={r.losses} />
                <Stat label="Kazanma" value={`${winRate}%`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div className="card p-4">
        <h3 className="mb-3 font-display text-lg font-bold text-gold-300">Başarımlar</h3>
        <AchievementBadges ratings={ratings} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-timur-900/50 py-2">
      <div className="text-base font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-timur-400">{label}</div>
    </div>
  );
}
