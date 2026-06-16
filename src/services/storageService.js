/**
 * @file LocalStorage persistence layer — powers offline mode and the LOCAL
 * (no-Supabase) fallback. All reads/writes are guarded so a disabled or full
 * storage never crashes the app.
 */

import { STORAGE_KEYS, RATING_DEFAULTS, TIME_CONTROL_KEYS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Safe JSON read.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    logger.warn(`storage read failed for ${key}:`, err);
    return fallback;
  }
}

/**
 * Safe JSON write.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} success
 */
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.error(`storage write failed for ${key}:`, err);
    return false;
  }
}

/** Generate a simple unique id (offline games, local users, etc.). */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a fresh per-time-control ratings map. */
export function defaultRatings() {
  const ratings = {};
  for (const tc of TIME_CONTROL_KEYS) {
    ratings[tc] = {
      rating: RATING_DEFAULTS.rating,
      rd: RATING_DEFAULTS.rd,
      volatility: RATING_DEFAULTS.volatility,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      current_streak: 0,
      highest_rating: RATING_DEFAULTS.rating,
    };
  }
  return ratings;
}

export const storageService = {
  // ── Offline games ──────────────────────────────────────────────────────
  /**
   * Persist a finished/in-progress offline game.
   * @param {object} gameData
   * @returns {object} the stored record (with id + synced=false)
   */
  saveGame(gameData) {
    const games = read(STORAGE_KEYS.OFFLINE_GAMES, []);
    const record = {
      id: gameData.id || uid('offline'),
      synced: false,
      synced_at: null,
      created_at: new Date().toISOString(),
      ...gameData,
    };
    const idx = games.findIndex((g) => g.id === record.id);
    if (idx >= 0) games[idx] = record;
    else games.push(record);
    write(STORAGE_KEYS.OFFLINE_GAMES, games);
    return record;
  },

  /** @returns {object[]} all offline games. */
  getOfflineGames() {
    return read(STORAGE_KEYS.OFFLINE_GAMES, []);
  },

  /** @returns {object[]} offline games not yet synced to the server. */
  getUnsyncedGames() {
    return read(STORAGE_KEYS.OFFLINE_GAMES, []).filter((g) => !g.synced);
  },

  /** Mark a stored game as synced. */
  markGameSynced(id) {
    const games = read(STORAGE_KEYS.OFFLINE_GAMES, []);
    const game = games.find((g) => g.id === id);
    if (game) {
      game.synced = true;
      game.synced_at = new Date().toISOString();
      write(STORAGE_KEYS.OFFLINE_GAMES, games);
    }
  },

  /** Remove every stored offline game. */
  clearOfflineGames() {
    write(STORAGE_KEYS.OFFLINE_GAMES, []);
  },

  // ── Preferences & settings ─────────────────────────────────────────────
  getPreferences() {
    return read(STORAGE_KEYS.USER_PREFERENCES, {
      boardTheme: 'klasik',
      pieceSet: 'standart',
      showCoordinates: true,
      whiteBottom: true,
      sound: false,
    });
  },
  setPreferences(prefs) {
    return write(STORAGE_KEYS.USER_PREFERENCES, prefs);
  },

  // ── Talim Alanı progress ───────────────────────────────────────────────
  /** @returns {Record<number, { completed: number[], gp: number }>} */
  getTalimProgress() {
    return read(STORAGE_KEYS.TALIM_PROGRESS, {});
  },
  setTalimProgress(progress) {
    return write(STORAGE_KEYS.TALIM_PROGRESS, progress);
  },

  // ── Local-mode auth & profile (used when Supabase is absent) ────────────
  getLocalAuth() {
    return read(STORAGE_KEYS.LOCAL_AUTH, null);
  },
  setLocalAuth(user) {
    return write(STORAGE_KEYS.LOCAL_AUTH, user);
  },
  clearLocalAuth() {
    try {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_AUTH);
    } catch (err) {
      logger.warn('clearLocalAuth failed:', err);
    }
  },

  /** Read the full local profile registry keyed by lowercased email. */
  getLocalProfiles() {
    return read(STORAGE_KEYS.LOCAL_PROFILE, {});
  },
  setLocalProfiles(profiles) {
    return write(STORAGE_KEYS.LOCAL_PROFILE, profiles);
  },

  // ── License keys (purchased cosmetics, offline-available) ───────────────
  getLicenseKeys() {
    return read(STORAGE_KEYS.LICENSE_KEYS, []);
  },
  addLicenseKey(key) {
    const keys = read(STORAGE_KEYS.LICENSE_KEYS, []);
    if (!keys.includes(key)) keys.push(key);
    return write(STORAGE_KEYS.LICENSE_KEYS, keys);
  },
};

export default storageService;
