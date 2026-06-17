/**
 * @file Game API surface. CLOUD mode talks to Supabase tables; LOCAL mode
 * returns client-side objects so vs-bot / offline play works with no backend.
 *
 * Rating updates follow the MVP rule that each client updates *its own*
 * rating row on game end (this respects row-level security — a player may only
 * write their own ratings). A production build would move this into a trusted
 * Postgres function / edge function.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { storageService, uid, defaultRatings } from './storageService.js';
import { updateRatingForGame } from '../utils/elo.js';
import { RESULT } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * @typedef {object} GameRecord
 * @property {string} id
 * @property {string} time_control
 * @property {string|null} player1_id
 * @property {string|null} player2_id
 * @property {string} status
 * @property {object[]} moves_json
 */

export const gameService = {
  /**
   * Create / join a game. In CLOUD mode this looks for an open game with the
   * same time control and joins it, otherwise it opens a new one (simple
   * matchmaking). In LOCAL mode it returns an offline game stub.
   *
   * @param {string} timeControl bullet|blitz|rapid|classical
   * @param {string} mode 'online' | 'bot' | 'offline'
   * @param {string|null} userId
   * @returns {Promise<GameRecord>}
   */
  async createGame(timeControl, mode, userId) {
    if (!isSupabaseConfigured || mode !== 'online') {
      return {
        id: uid('game'),
        time_control: timeControl,
        player1_id: userId,
        player2_id: mode === 'bot' ? null : userId,
        status: 'active',
        mode,
        moves_json: [],
        is_offline: mode === 'offline',
        created_at: new Date().toISOString(),
      };
    }

    // Try to join an existing waiting game (not created by us).
    const { data: openGames } = await supabase
      .from('games')
      .select('*')
      .eq('time_control', timeControl)
      .is('player2_id', null)
      .neq('player1_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (openGames && openGames.length > 0) {
      const game = openGames[0];
      const { data: joined, error } = await supabase
        .from('games')
        .update({ player2_id: userId })
        .eq('id', game.id)
        .is('player2_id', null) // guard against a race
        .select()
        .single();
      if (!error && joined) return joined;
    }

    // Otherwise open a new game and wait for an opponent.
    const { data, error } = await supabase
      .from('games')
      .insert({ player1_id: userId, time_control: timeControl, moves_json: [] })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch a game by id.
   * @param {string} gameId
   * @returns {Promise<GameRecord|null>}
   */
  async getGame(gameId) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) {
      logger.warn('getGame:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Persist a move list to the game row (the realtime layer broadcasts it).
   * @param {string} gameId
   * @param {object[]} moves full move history (algebraic/coordinate objects)
   * @returns {Promise<boolean>}
   */
  async pushMoves(gameId, moves) {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('games')
      .update({ moves_json: moves })
      .eq('id', gameId);
    if (error) logger.warn('pushMoves:', error.message);
    return !error;
  },

  /**
   * End a game: write the result and update the current user's rating row.
   * @param {object} params
   * @param {GameRecord} params.game
   * @param {string} params.result RESULT.*
   * @param {string} params.userId current user id
   * @param {boolean} params.isPlayer1 whether the current user was player1
   * @param {{ rating: number, rd: number }} params.opponentRating
   * @returns {Promise<{ ratingDelta: number, newRating: number }>}
   */
  async endGame({ game, result, userId, isPlayer1, opponentRating }) {
    const score = scoreFor(result, isPlayer1);

    // Update local-only games immediately.
    if (!isSupabaseConfigured || game.is_offline || game.mode !== 'online') {
      return this.applyLocalRating(userId, game.time_control, opponentRating, score);
    }

    await supabase
      .from('games')
      .update({ result, end_time: new Date().toISOString() })
      .eq('id', game.id);

    return this.applyCloudRating(userId, game.time_control, opponentRating, score);
  },

  /** Apply a rating change to a Supabase ratings row. */
  async applyCloudRating(userId, timeControl, opponentRating, score) {
    const { data: row } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('time_control', timeControl)
      .single();
    const current = row ?? { rating: 1000, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0, draws: 0, current_streak: 0, highest_rating: 1000 };
    const next = updateRatingForGame(
      { rating: current.rating, rd: current.rd, volatility: current.volatility },
      opponentRating,
      score,
    );
    const tallies = applyTally(current, score);
    await supabase.from('ratings').upsert(
      {
        user_id: userId,
        time_control: timeControl,
        rating: next.rating,
        rd: next.rd,
        volatility: next.volatility,
        highest_rating: Math.max(current.highest_rating ?? next.rating, next.rating),
        last_game_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...tallies,
      },
      { onConflict: 'user_id,time_control' },
    );
    return { ratingDelta: next.rating - current.rating, newRating: next.rating };
  },

  /** Apply a rating change to the LOCAL profile registry. */
  async applyLocalRating(userId, timeControl, opponentRating, score) {
    const profiles = storageService.getLocalProfiles();
    const entry = Object.entries(profiles).find(([, p]) => p.id === userId);
    if (!entry) return { ratingDelta: 0, newRating: 1000 };
    const [key, profile] = entry;
    const ratings = profile.ratings ?? defaultRatings();
    const current = ratings[timeControl];
    const next = updateRatingForGame(
      { rating: current.rating, rd: current.rd, volatility: current.volatility },
      opponentRating,
      score,
    );
    const tallies = applyTally(current, score);
    ratings[timeControl] = {
      ...current,
      ...tallies,
      rating: next.rating,
      rd: next.rd,
      volatility: next.volatility,
      highest_rating: Math.max(current.highest_rating, next.rating),
    };
    profiles[key] = { ...profile, ratings };
    storageService.setLocalProfiles(profiles);

    // Keep the active session profile in sync.
    const active = storageService.getLocalAuth();
    if (active && active.id === userId) storageService.setLocalAuth({ ...active, ratings });

    return { ratingDelta: next.rating - current.rating, newRating: next.rating };
  },

  /**
   * Recent games for a user (history page).
   * @param {string} userId
   * @param {number} [limit]
   * @returns {Promise<object[]>}
   */
  async getGameHistory(userId, limit = 20) {
    const offline = storageService.getOfflineGames().filter((g) => g.user_id === userId || !userId);
    if (!isSupabaseConfigured) return offline.slice(-limit).reverse();

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .not('result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      logger.warn('getGameHistory:', error.message);
      return offline.slice(-limit).reverse();
    }
    return data ?? [];
  },

  /**
   * Sync a recorded offline game to the server (see PHASE 9 + cheat detection
   * in `syncService`). In LOCAL mode this just marks it synced locally.
   * @param {object} offlineGame
   * @returns {Promise<{ ok: boolean, flagged: boolean, reason?: string }>}
   */
  async syncOfflineGame(offlineGame) {
    if (!isSupabaseConfigured) {
      storageService.markGameSynced(offlineGame.id);
      return { ok: true, flagged: false };
    }
    const { error } = await supabase.from('games').insert({
      player1_id: offlineGame.user_id,
      time_control: offlineGame.time_control,
      result: offlineGame.result,
      moves_json: offlineGame.moves,
      is_offline: true,
      synced_at: new Date().toISOString(),
      start_time: offlineGame.startTime,
      end_time: offlineGame.endTime,
    });
    if (error) {
      logger.warn('syncOfflineGame:', error.message);
      return { ok: false, flagged: false, reason: error.message };
    }
    storageService.markGameSynced(offlineGame.id);
    return { ok: true, flagged: false };
  },
};

/** Map a DB result + side to a Glicko score (1/0.5/0). */
function scoreFor(result, isPlayer1) {
  if (result === RESULT.DRAW) return 0.5;
  if (result === RESULT.PLAYER1_WIN) return isPlayer1 ? 1 : 0;
  if (result === RESULT.PLAYER2_WIN) return isPlayer1 ? 0 : 1;
  return 0.5; // abandoned → treat as draw for rating purposes
}

/** Update win/loss/draw tallies + streak from a score. */
function applyTally(current, score) {
  const wins = current.wins + (score === 1 ? 1 : 0);
  const losses = current.losses + (score === 0 ? 1 : 0);
  const draws = current.draws + (score === 0.5 ? 1 : 0);
  let streak = current.current_streak ?? 0;
  if (score === 1) streak = streak >= 0 ? streak + 1 : 1;
  else if (score === 0) streak = streak <= 0 ? streak - 1 : -1;
  return {
    games_played: current.games_played + 1,
    wins,
    losses,
    draws,
    current_streak: streak,
  };
}

export default gameService;
