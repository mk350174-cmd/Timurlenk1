/**
 * @file Tournament store — drives an active tournament for the three formats:
 *   - swiss     (Arena): N rounds, points-based pairing, full-field standings.
 *   - knockout         : single elimination bracket.
 *   - ladder           : continuous rating climb vs nearest commanders.
 *
 * The human plays one real game per round/challenge (on the board); every other
 * pairing is simulated, so a populated live leaderboard exists without 50 live
 * bot games. Awards/trophies are persisted on finish.
 */

import { create } from 'zustand';
import { COMMANDERS, pickCommanderNear } from '../data/commanders.js';
import {
  createSwissPairings,
  createKnockoutPairings,
  simulateGameResult,
  applyResult,
  rankStandings,
  computeAward,
  pairKey,
} from '../utils/tournamentEngine.js';
import { updateRatingForGame } from '../utils/elo.js';
import { storageService } from '../services/storageService.js';

/** Format config (field size + rounds). */
const FORMAT = {
  swiss: { fieldSize: 12, rounds: 5 },
  knockout: { fieldSize: 8, rounds: 3 },
  ladder: { fieldSize: 16, rounds: 0 },
};

/** Map a tournament definition's `type` to an engine format. */
const typeToFormat = (type) => (type === 'ladder' ? 'ladder' : type === 'knockout' ? 'knockout' : 'swiss');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pointsMap = (standings) => {
  const m = {};
  for (const [id, s] of Object.entries(standings)) m[id] = s.points;
  return m;
};

const freshState = () => ({
  tournament: null,
  format: null,
  fieldSize: 0,
  totalRounds: 0,
  status: 'idle', // idle | awaiting_user_game | active | finished
  players: [],
  youId: null,
  standings: {},
  playedPairs: new Set(),
  round: 0,
  roundPairings: [],
  userPairing: null, // { self, opp }
  survivors: [],
  userEliminated: false,
  eliminationRound: 0,
  ladderRating: 1200,
  finalStandings: [],
  userRank: null,
  award: null,
  log: [],
});

export const useTournamentStore = create((set, get) => ({
  ...freshState(),

  /** Join a tournament; builds the bot field and starts it. */
  join(tournament, user) {
    const format = typeToFormat(tournament.type);
    const cfg = FORMAT[format];
    const userRating = user?.ratings?.[tournament.timeControl]?.rating ?? 1200;
    const you = {
      id: user?.id ?? 'you',
      name: user?.username ?? 'Sen',
      rating: userRating,
      rd: 80,
      isBot: false,
      difficulty: 'expert',
    };
    const bots = shuffle(COMMANDERS)
      .slice(0, cfg.fieldSize - 1)
      .map((c) => ({ id: c.id, name: c.name, rating: c.rating, rd: c.rd, isBot: true, difficulty: c.difficulty }));

    set({
      ...freshState(),
      tournament,
      format,
      fieldSize: cfg.fieldSize,
      totalRounds: cfg.rounds,
      players: [you, ...bots],
      youId: you.id,
      ladderRating: userRating,
      playedPairs: new Set(),
    });

    if (format === 'ladder') {
      set({ status: 'active' });
      get().ladderNext();
    } else {
      get().startRound();
    }
  },

  /** Begin the next round (swiss/knockout): pair, find the user's game. */
  startRound() {
    const { format, players, standings, round, survivors, playedPairs, youId } = get();
    const nextRound = round + 1;
    let pairings;
    if (format === 'knockout') {
      const field = round === 0 ? [...players].sort((a, b) => b.rating - a.rating) : survivors;
      pairings = createKnockoutPairings(field);
    } else {
      pairings = createSwissPairings(players, pointsMap(standings), playedPairs);
    }

    const pp = new Set(playedPairs);
    pairings.forEach(({ a, b }) => b && pp.add(pairKey(a.id, b.id)));

    const up = pairings.find((p) => p.a.id === youId || p.b?.id === youId);
    let userPairing = null;
    if (up) {
      userPairing = up.a.id === youId ? { self: up.a, opp: up.b } : { self: up.b, opp: up.a };
    }

    set({ round: nextRound, roundPairings: pairings, userPairing, playedPairs: pp, status: 'awaiting_user_game' });

    // Bye (or user not paired) → auto-resolve the user's "game" as a win.
    if (!userPairing || !userPairing.opp) get().resolveRound(userPairing ? 1 : null);
  },

  /** Report the user's real game result (1/0.5/0) and resolve the round. */
  reportUserResult(scoreForUser) {
    get().resolveRound(scoreForUser);
  },

  /** Auto-simulate the user's own game (skip playing). */
  autoPlayUser() {
    const { userPairing } = get();
    if (!userPairing?.opp) return get().resolveRound(1);
    return get().resolveRound(simulateGameResult(userPairing.self, userPairing.opp));
  },

  /** Resolve every pairing in the current round, then advance or finish. */
  resolveRound(userScore) {
    const { format, roundPairings, standings, youId, round } = get();
    let next = standings;
    const winners = [];
    for (const { a, b } of roundPairings) {
      const involvesUser = a.id === youId || b?.id === youId;
      let scoreA;
      if (involvesUser && userScore != null) {
        scoreA = a.id === youId ? userScore : 1 - userScore;
      } else {
        scoreA = simulateGameResult(a, b);
      }
      next = applyResult(next, a.id, b?.id, scoreA);
      if (!b) winners.push(a);
      else winners.push(scoreA > 0.5 ? a : scoreA < 0.5 ? b : a.rating >= b.rating ? a : b);
    }

    let { userEliminated, eliminationRound } = get();
    if (format === 'knockout' && !winners.some((w) => w.id === youId) && !userEliminated) {
      userEliminated = true;
      eliminationRound = round;
    }

    set({ standings: next, survivors: winners, userEliminated, eliminationRound, status: 'active' });

    if (format === 'knockout') {
      if (userEliminated || winners.length <= 1) get().finish();
    } else if (round >= get().totalRounds) {
      get().finish();
    }
  },

  // ── Ladder flow ──────────────────────────────────────────────────────────
  /** Queue the next ladder challenge (opponent within reach of your rating). */
  ladderNext() {
    const { ladderRating } = get();
    const opp = pickCommanderNear(ladderRating);
    set({ userPairing: { self: { id: get().youId, rating: ladderRating }, opp }, status: 'awaiting_user_game' });
  },

  /** Apply a ladder game result and re-rank. */
  reportLadderResult(scoreForUser) {
    const { ladderRating, userPairing } = get();
    const opp = userPairing.opp;
    const updated = updateRatingForGame(
      { rating: ladderRating, rd: 80, volatility: 0.06 },
      { rating: opp.rating, rd: opp.rd },
      scoreForUser,
    );
    set({
      ladderRating: updated.rating,
      status: 'active',
      log: [`${opp.name}: ${scoreForUser === 1 ? 'Galibiyet' : scoreForUser === 0 ? 'Mağlubiyet' : 'Beraberlik'} → ${updated.rating}`, ...get().log].slice(0, 6),
    });
  },

  /** End the ladder run and award based on final standing. */
  leaveLadder() {
    const { ladderRating, fieldSize, tournament } = get();
    const ahead = COMMANDERS.filter((c) => c.rating > ladderRating).length;
    const rank = ahead + 1;
    get().awardAndFinish(rank, tournament, 'ladder', fieldSize);
  },

  /** Compute final rank, persist trophy, mark finished. */
  finish() {
    const { format, players, standings, fieldSize, tournament, youId, userEliminated, eliminationRound } = get();
    const ranked = rankStandings(players, standings);
    let userRank;
    if (format === 'knockout') {
      userRank = userEliminated
        ? Math.floor(fieldSize / Math.pow(2, eliminationRound)) + 1
        : 1;
    } else {
      userRank = ranked.find((p) => p.id === youId)?.rank ?? players.length;
    }
    set({ finalStandings: ranked });
    get().awardAndFinish(userRank, tournament, format, fieldSize);
  },

  /** Shared award + persistence path. */
  awardAndFinish(rank, tournament, format, fieldSize) {
    const award = computeAward(format, rank, fieldSize);
    storageService.addTrophy({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format,
      placement: rank,
      badge: award.badge,
      label: award.label,
      medal: award.medal,
    });
    set({ status: 'finished', award, userRank: rank });
  },

  /** Live leaderboard rows (works for all formats). */
  leaderboard() {
    const { format, players, standings, ladderRating, youId } = get();
    if (format === 'ladder') {
      const rows = [
        ...COMMANDERS.map((c) => ({ id: c.id, name: c.name, rating: c.rating, isBot: true })),
        { id: youId, name: 'Sen', rating: ladderRating, isBot: false },
      ];
      return rows.sort((a, b) => b.rating - a.rating).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return rankStandings(players, standings);
  },

  reset() {
    set({ ...freshState(), playedPairs: new Set() });
  },
}));

export default useTournamentStore;
