/**
 * @file Optional Socket.io fallback for realtime moves.
 *
 * This is the secondary fallback in the hybrid architecture and only activates
 * when `VITE_SOCKET_URL` is configured. With no socket server set (the default
 * for the MVP), every method is a safe no-op, so the app relies on Supabase
 * Realtime + HTTP polling instead.
 */

import { io } from 'socket.io-client';
import { logger } from '../utils/logger.js';

const SOCKET_URL = (import.meta.env ?? {}).VITE_SOCKET_URL?.trim();

/** @type {import('socket.io-client').Socket|null} */
let socket = null;

export const socketService = {
  /** @returns {boolean} whether a socket server is configured. */
  get enabled() {
    return Boolean(SOCKET_URL);
  },

  /**
   * Connect and join a game room.
   * @param {string} gameId
   * @param {(move: object) => void} onOpponentMove
   * @returns {boolean} connected
   */
  connect(gameId, onOpponentMove) {
    if (!SOCKET_URL) return false;
    try {
      socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
      socket.on('connect', () => {
        socket.emit('join_game', { gameId });
        logger.info('socket connected, joined', gameId);
      });
      socket.on('opponent_move', (move) => onOpponentMove(move));
      socket.on('connect_error', (err) => logger.warn('socket error:', err.message));
      return true;
    } catch (err) {
      logger.error('socket connect failed:', err);
      return false;
    }
  },

  /**
   * Emit a move to the opponent.
   * @param {string} gameId
   * @param {object} move
   */
  sendMove(gameId, move) {
    if (socket?.connected) socket.emit('move', { gameId, move });
  },

  /** Tear down the connection. */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};

export default socketService;
