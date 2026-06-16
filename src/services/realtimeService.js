/**
 * @file Hybrid realtime layer (spec REAL_TIME_ARCHITECTURE).
 *   Primary : Supabase Postgres Changes (WebSocket) on the `games` row.
 *   Fallback: HTTP polling every POLL_INTERVAL_MS, auto-engaged if the channel
 *             fails to subscribe (e.g. behind a restrictive proxy).
 *
 * Uses the Supabase v2 channel API (`.channel().on('postgres_changes', …)`),
 * not the deprecated v1 `.from().on()` shown in the spec sketch.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { POLL_INTERVAL_MS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const realtimeService = {
  /**
   * Subscribe to live updates for a single game.
   * @param {string} gameId
   * @param {(game: object) => void} onUpdate called with the new row on change
   * @returns {() => void} unsubscribe function
   */
  subscribeToGame(gameId, onUpdate) {
    if (!isSupabaseConfigured) return () => {};

    let pollTimer = null;
    let lastSerialized = '';

    const emit = (row) => {
      if (!row) return;
      const serialized = JSON.stringify(row.moves_json ?? []) + (row.result ?? '');
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        onUpdate(row);
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      logger.warn('Realtime channel unavailable — falling back to HTTP polling.');
      pollTimer = setInterval(async () => {
        const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
        emit(data);
      }, POLL_INTERVAL_MS);
    };

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => emit(payload.new),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') logger.info(`Realtime subscribed: game ${gameId}`);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') startPolling();
      });

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to presence (online users) for a lobby/game.
   * @param {string} room
   * @param {object} meta presence payload (e.g. { user, username })
   * @param {(state: object) => void} onSync
   * @returns {() => void}
   */
  subscribePresence(room, meta, onSync) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase.channel(`presence:${room}`, {
      config: { presence: { key: meta.user ?? 'anon' } },
    });
    channel
      .on('presence', { event: 'sync' }, () => onSync(channel.presenceState()))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track(meta);
      });
    return () => supabase.removeChannel(channel);
  },
};

export default realtimeService;
