/**
 * @file Supabase client bootstrap.
 *
 * The app is designed to run in two modes:
 *   1. CLOUD  — when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are present,
 *               auth, online games, ratings and leaderboards use Supabase.
 *   2. LOCAL  — when they are absent, everything falls back to LocalStorage so
 *               the game is fully playable offline (Talim Alanı, vs-bot, etc.).
 *
 * `isSupabaseConfigured` lets the rest of the app branch cleanly without
 * sprinkling env checks everywhere.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const env = import.meta.env ?? {};
const url = env.VITE_SUPABASE_URL?.trim();
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * True when valid-looking Supabase credentials were provided at build time.
 * @type {boolean}
 */
export const isSupabaseConfigured = Boolean(url && anonKey && url.startsWith('http'));

/**
 * Shared Supabase client, or `null` in LOCAL mode.
 * @type {import('@supabase/supabase-js').SupabaseClient|null}
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'timurlenk.supabase.auth',
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

if (isSupabaseConfigured) {
  logger.info('Supabase client initialised (CLOUD mode).');
} else {
  logger.warn('Supabase not configured — running in LOCAL/OFFLINE mode.');
}

/**
 * Lightweight connection probe used by health checks / dev tooling.
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      logger.warn('Supabase connection test returned an error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('Supabase connection test threw:', err);
    return false;
  }
}

export default supabase;
