/**
 * @file Tournament engine — Swiss pairing, knockout brackets, result simulation,
 * standings and award/badge logic (spec TOURNAMENT_SYSTEM).
 *
 * The human plays one real game per round (on the board); all other pairings
 * are *simulated* from Glicko expectancy so a full field + live leaderboard can
 * exist without 50 live bot games. This works identically in cloud and local
 * mode. A server-driven, fully-live tournament is the production evolution.
 */

import { expectedScore } from './elo.js';

/** Unordered pair key for rematch avoidance. */
const pairKey = (a, b) => [a, b].sort().join('|');

/**
 * Swiss pairing for one round: sort by score then rating, pair nearest players
 * avoiding rematches; an odd one out gets a bye.
 * @param {{id:string,rating:number}[]} players
 * @param {Record<string,number>} scoreById
 * @param {Set<string>} playedPairs keys from {@link pairKey}
 * @returns {{ a: object, b: object|null }[]} pairings (b=null → bye)
 */
export function createSwissPairings(players, scoreById, playedPairs) {
  const sorted = [...players].sort(
    (a, b) => (scoreById[b.id] ?? 0) - (scoreById[a.id] ?? 0) || b.rating - a.rating,
  );
  const pool = [...sorted];
  const pairings = [];
  while (pool.length > 1) {
    const a = pool.shift();
    let idx = pool.findIndex((o) => !playedPairs.has(pairKey(a.id, o.id)));
    if (idx < 0) idx = 0; // forced rematch if everyone already played
    const b = pool.splice(idx, 1)[0];
    pairings.push({ a, b });
  }
  if (pool.length === 1) pairings.push({ a: pool[0], b: null }); // bye
  return pairings;
}

/**
 * Knockout pairing: adjacent survivors face off.
 * @param {object[]} survivors
 * @returns {{ a: object, b: object|null }[]}
 */
export function createKnockoutPairings(survivors) {
  const pairings = [];
  for (let i = 0; i < survivors.length; i += 2) {
    pairings.push({ a: survivors[i], b: survivors[i + 1] ?? null });
  }
  return pairings;
}

/**
 * Simulate a single game result from rating expectancy.
 * @returns {number} score for `a`: 1 win / 0.5 draw / 0 loss
 */
export function simulateGameResult(a, b) {
  if (!b) return 1; // bye
  const e = expectedScore(a.rating, b.rating);
  const roll = Math.random();
  const pWin = e * 0.9;
  if (roll < pWin) return 1;
  if (roll < pWin + 0.1) return 0.5;
  return 0;
}

/** Apply a pairing's result to the standings map (mutates a copy). */
export function applyResult(standings, aId, bId, scoreA) {
  const next = { ...standings };
  const bump = (id, pts) => {
    const s = next[id] ?? { points: 0, games: 0, wins: 0 };
    next[id] = {
      points: s.points + pts,
      games: s.games + 1,
      wins: s.wins + (pts === 1 ? 1 : 0),
    };
  };
  bump(aId, scoreA);
  if (bId) bump(bId, 1 - scoreA);
  return next;
}

/**
 * Final ranked standings (points desc, then rating desc).
 * @returns {{ id, name, rating, points, games, wins, rank, isBot }[]}
 */
export function rankStandings(players, standings) {
  return players
    .map((p) => ({
      ...p,
      points: standings[p.id]?.points ?? 0,
      games: standings[p.id]?.games ?? 0,
      wins: standings[p.id]?.wins ?? 0,
    }))
    .sort((x, y) => y.points - x.points || y.rating - x.rating)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Compute the award (trophy + badge) for a final placement.
 * @param {string} format 'swiss' | 'knockout' | 'ladder'
 * @param {number} rank 1-based final rank
 * @param {number} fieldSize
 * @returns {{ badge: string, label: string, medal: string }}
 */
export function computeAward(format, rank, fieldSize) {
  if (format === 'ladder') {
    if (rank <= 3) return { badge: 'ladder_master', label: 'Ladder Ustası', medal: '🥇' };
    if (rank <= Math.max(10, fieldSize / 2)) return { badge: 'ladder_elite', label: 'Ladder Eliti', medal: '🎖️' };
    return { badge: 'participant', label: 'Katılımcı', medal: '🎗️' };
  }
  // arena (swiss) + knockout
  if (rank === 1) return { badge: 'champion', label: 'Şampiyon', medal: '🏆' };
  if (rank <= 4) return { badge: 'finalist', label: 'Finalist', medal: '🥈' };
  return { badge: 'participant', label: 'Katılımcı', medal: '🎗️' };
}

export { pairKey };
