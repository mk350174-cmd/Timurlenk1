/**
 * @file Authentication service. Wraps Supabase Auth in CLOUD mode and a
 * LocalStorage-backed account system in LOCAL mode, exposing one interface.
 *
 * SECURITY NOTE: the LOCAL fallback hashes passwords with a non-cryptographic
 * digest purely so demo accounts aren't stored in plaintext. Real security is
 * provided by Supabase Auth (bcrypt + JWT) whenever credentials are present.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { storageService, defaultRatings, uid } from './storageService.js';
import { PASSWORD_POLICY } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/** Non-cryptographic djb2 digest (LOCAL mode only). */
function weakHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/** Validate a password against the spec policy. @returns {string|null} error message */
export function validatePassword(password) {
  if (!password || password.length < PASSWORD_POLICY.minLength) return PASSWORD_POLICY.hint;
  if (!PASSWORD_POLICY.regex.test(password)) return PASSWORD_POLICY.hint;
  return null;
}

/**
 * Normalise a raw DB/local record into the app's profile shape.
 * @returns {object}
 */
function toProfile({ id, email, username, avatar_url, joined_date, ratings }) {
  return {
    id,
    email,
    username,
    avatar_url: avatar_url ?? null,
    joined_date: joined_date ?? new Date().toISOString(),
    ratings: ratings ?? defaultRatings(),
  };
}

// ── LOCAL-mode implementation ──────────────────────────────────────────────
const localAuth = {
  async register(email, password, username) {
    const profiles = storageService.getLocalProfiles();
    const key = email.toLowerCase();
    if (profiles[key]) return { user: null, error: { message: 'Bu e-posta zaten kayıtlı.' } };
    if (Object.values(profiles).some((p) => p.username === username)) {
      return { user: null, error: { message: 'Bu kullanıcı adı alınmış.' } };
    }
    const profile = toProfile({
      id: uid('user'),
      email,
      username,
      joined_date: new Date().toISOString(),
      ratings: defaultRatings(),
    });
    profiles[key] = { ...profile, passwordHash: weakHash(password) };
    storageService.setLocalProfiles(profiles);
    storageService.setLocalAuth(profile);
    logger.info('LOCAL register:', username);
    return { user: profile, error: null };
  },

  async login(email, password) {
    const profiles = storageService.getLocalProfiles();
    const record = profiles[email.toLowerCase()];
    if (!record || record.passwordHash !== weakHash(password)) {
      return { user: null, error: { message: 'E-posta veya şifre hatalı.' } };
    }
    const profile = toProfile(record);
    storageService.setLocalAuth(profile);
    return { user: profile, error: null };
  },

  async logout() {
    storageService.clearLocalAuth();
    return { error: null };
  },

  async getSession() {
    const user = storageService.getLocalAuth();
    return { user, error: null };
  },

  async getProfile(userId) {
    const profiles = storageService.getLocalProfiles();
    const record = Object.values(profiles).find((p) => p.id === userId);
    return record ? toProfile(record) : null;
  },

  /** LOCAL mode has no realtime auth events; return a no-op unsubscribe. */
  onAuthChange() {
    return () => {};
  },
};

// ── CLOUD-mode implementation (Supabase Auth) ───────────────────────────────
const cloudAuth = {
  async register(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { user: null, error };
    const authUser = data.user;
    if (!authUser) return { user: null, error: { message: 'Kayıt başarısız.' } };

    // Create the public profile row + initial per-time-control ratings.
    const { error: profileError } = await supabase.from('users').insert({
      id: authUser.id,
      username,
      email,
    });
    if (profileError && profileError.code !== '23505') {
      logger.warn('profile insert failed:', profileError.message);
    }
    await this.ensureRatings(authUser.id);

    const profile = await this.getProfile(authUser.id);
    return { user: profile ?? toProfile({ id: authUser.id, email, username }), error: null };
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error };
    const profile = await this.getProfile(data.user.id);
    return { user: profile, session: data.session, error: null };
  },

  async logout() {
    return supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return { user: null, error: null };
    const profile = await this.getProfile(data.session.user.id);
    return { user: profile, error: null };
  },

  /** Make sure all four time-control rating rows exist for a user. */
  async ensureRatings(userId) {
    const tcs = ['bullet', 'blitz', 'rapid', 'classical'];
    const rows = tcs.map((tc) => ({ user_id: userId, time_control: tc }));
    const { error } = await supabase.from('ratings').upsert(rows, {
      onConflict: 'user_id,time_control',
      ignoreDuplicates: true,
    });
    if (error) logger.warn('ensureRatings:', error.message);
  },

  async getProfile(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !user) return null;

    const { data: ratingRows } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId);

    const ratings = defaultRatings();
    for (const row of ratingRows ?? []) {
      ratings[row.time_control] = {
        rating: row.rating,
        rd: row.rd,
        volatility: Number(row.volatility ?? 0.06),
        games_played: row.games_played,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        current_streak: row.current_streak,
        highest_rating: row.highest_rating,
      };
    }
    return toProfile({ ...user, ratings });
  },

  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        callback(profile);
      } else {
        callback(null);
      }
    });
    return () => data.subscription.unsubscribe();
  },
};

/**
 * Unified auth service — automatically CLOUD or LOCAL based on configuration.
 * @type {typeof cloudAuth}
 */
export const authService = isSupabaseConfigured ? cloudAuth : localAuth;

export default authService;
