/**
 * @file Zustand game store — the in-memory state of a single active game.
 * Drives the board, clocks, move list and end-of-game detection. Works
 * identically for vs-bot, offline and online games (the page wires the
 * transport).
 */

import { create } from 'zustand';
import {
  createInitialPosition,
  applyMove as applyMoveToPosition,
  clonePosition,
} from '../utils/board.js';
import { getLegalMoves, getGameStatus, pickBotMove } from '../utils/moves.js';
import { COLOR, TIME_CONTROLS, RESULT } from '../utils/constants.js';

/** Opposite color helper. */
const other = (c) => (c === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE);

/** @returns {object} a fresh, idle game state slice. */
function freshState() {
  return {
    gameId: null,
    mode: 'bot', // 'bot' | 'online' | 'offline' | 'puzzle'
    timeControl: 'rapid',
    botDifficulty: 'medium', // engine difficulty for vs-bot games
    botCommander: null, // { name, rating, rd, difficulty }
    position: createInitialPosition(),
    moves: [], // Move[] (see board.applyMove)
    turn: COLOR.WHITE,
    playerColor: COLOR.WHITE, // side the local human controls
    selected: null,
    legalTargets: [],
    lastMove: null,
    whiteTime: TIME_CONTROLS.rapid.initial,
    blackTime: TIME_CONTROLS.rapid.initial,
    increment: TIME_CONTROLS.rapid.increment,
    status: 'idle', // 'idle' | 'active' | 'ended'
    result: null,
    winner: null,
    captured: { w: [], b: [] }, // captured pieces grouped by their own color
  };
}

export const useGameStore = create((set, get) => ({
  ...freshState(),

  /**
   * Start a new game.
   * @param {{ mode?: string, timeControl?: string, playerColor?: string, gameId?: string }} cfg
   */
  newGame(cfg = {}) {
    const tc = TIME_CONTROLS[cfg.timeControl] ?? TIME_CONTROLS.rapid;
    set({
      ...freshState(),
      gameId: cfg.gameId ?? null,
      mode: cfg.mode ?? 'bot',
      timeControl: cfg.timeControl ?? 'rapid',
      botDifficulty: cfg.botDifficulty ?? 'medium',
      botCommander: cfg.botCommander ?? null,
      playerColor: cfg.playerColor ?? COLOR.WHITE,
      whiteTime: tc.initial,
      blackTime: tc.initial,
      increment: tc.increment,
      status: 'active',
    });
  },

  /**
   * Click a square — handles select / move / re-select / deselect.
   * @param {number} sq
   */
  select(sq) {
    const { position, turn, selected, legalTargets, status } = get();
    if (status !== 'active') return;

    // Second click: a legal destination → make the move.
    if (selected != null && legalTargets.includes(sq)) {
      get().makeMove(selected, sq);
      return;
    }

    const piece = position[sq];
    // Select one of the side-to-move's pieces.
    if (piece && piece.c === turn) {
      set({ selected: sq, legalTargets: getLegalMoves(position, sq) });
      return;
    }
    // Anything else clears the selection.
    set({ selected: null, legalTargets: [] });
  },

  /**
   * Apply a move (assumed legal — `select` validates via getLegalMoves).
   * @param {number} from
   * @param {number} to
   * @param {string} [promotion]
   * @returns {object|null} the applied Move
   */
  makeMove(from, to, promotion) {
    const state = get();
    if (state.status !== 'active') return null;

    const { position, captured, move } = applyMoveToPosition(state.position, { from, to, promotion });
    const mover = state.turn;

    const newCaptured = { w: [...state.captured.w], b: [...state.captured.b] };
    if (captured) newCaptured[captured.c].push(captured.t);

    // Fischer increment to the side that just moved.
    const timeKey = mover === COLOR.WHITE ? 'whiteTime' : 'blackTime';
    const updatedTime = state[timeKey] + state.increment;

    set({
      position,
      moves: [...state.moves, move],
      turn: other(mover),
      selected: null,
      legalTargets: [],
      lastMove: { from, to },
      captured: newCaptured,
      [timeKey]: updatedTime,
    });

    // King-capture ends the game (MVP rule).
    const status = getGameStatus(position);
    if (status.over) {
      get().finish(status.winner);
    }
    return move;
  },

  /**
   * Have the built-in bot reply (vs-bot / offline modes).
   * @returns {object|null} the bot's move
   */
  botMove() {
    const { position, turn, mode, status } = get();
    if (status !== 'active' || mode !== 'bot') return null;
    const choice = pickBotMove(position, turn);
    if (!choice) {
      get().finish(other(turn)); // no moves → opponent wins (MVP)
      return null;
    }
    return get().makeMove(choice.from, choice.to);
  },

  /** Decrement the active player's clock by one second; flag on flag-fall. */
  tick() {
    const { status, turn, whiteTime, blackTime } = get();
    if (status !== 'active') return;
    if (turn === COLOR.WHITE) {
      const t = Math.max(0, whiteTime - 1);
      set({ whiteTime: t });
      if (t === 0) get().finish(COLOR.BLACK);
    } else {
      const t = Math.max(0, blackTime - 1);
      set({ blackTime: t });
      if (t === 0) get().finish(COLOR.WHITE);
    }
  },

  /**
   * Finish the game.
   * @param {string|null} winnerColor 'w' | 'b' | null (draw)
   */
  finish(winnerColor) {
    if (get().status === 'ended') return;
    let result = RESULT.DRAW;
    if (winnerColor === COLOR.WHITE) result = RESULT.PLAYER1_WIN;
    else if (winnerColor === COLOR.BLACK) result = RESULT.PLAYER2_WIN;
    set({ status: 'ended', winner: winnerColor, result, selected: null, legalTargets: [] });
  },

  /** Resign as the local player. */
  resign() {
    const { playerColor } = get();
    get().finish(other(playerColor));
  },

  /**
   * Replace local state from a remote game row (online sync). Replays the
   * server's move list onto a fresh board so both clients converge.
   * @param {object[]} remoteMoves array of { from, to, promotion? }
   */
  syncFromRemote(remoteMoves) {
    let position = createInitialPosition();
    const captured = { w: [], b: [] };
    let turn = COLOR.WHITE;
    let lastMove = null;
    const moves = [];
    for (const m of remoteMoves) {
      const res = applyMoveToPosition(position, m);
      position = res.position;
      if (res.captured) captured[res.captured.c].push(res.captured.t);
      moves.push(res.move);
      lastMove = { from: m.from, to: m.to };
      turn = other(turn);
    }
    set({ position, moves, turn, lastMove, captured, selected: null, legalTargets: [] });
    const status = getGameStatus(position);
    if (status.over) get().finish(status.winner);
  },

  /** Reset back to idle. */
  reset() {
    set({ ...freshState() });
  },

  /** Snapshot used by the offline recorder. */
  snapshot() {
    const s = get();
    return {
      mode: s.mode,
      time_control: s.timeControl,
      moves: s.moves.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion })),
      result: s.result,
      winner: s.winner,
      position: clonePosition(s.position),
    };
  },
}));

export default useGameStore;
