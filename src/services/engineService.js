/**
 * @file engineService — the single integration seam for the game "brain".
 *
 * It exposes the exact surface from APEX_TIMUR_REFERENCE (`isLegal`,
 * `solvePuzzle`, `getBotMove`, `analyzeGame`) and transparently uses, in order:
 *   1. the Apex Timur WASM motor, if `window.ApexMotor` exists or
 *      `/engine/apex_timur.js` can be loaded (drop the compiled binaries into
 *      `public/engine/` — see public/engine/README.md);
 *   2. otherwise the bundled JS engine (utils/aiEngine.js) + rule checks.
 *
 * This is exactly the v1.1 "Phase 1" abstraction: when you provide the WASM,
 * nothing else in the app changes.
 */

import { isLegalMove } from '../utils/moves.js';
import { getBestMove, solve, analyze, DIFFICULTY } from '../utils/aiEngine.js';
import { encodePosition, createInitialPosition, applyMove } from '../utils/board.js';
import { logger } from '../utils/logger.js';

/** Difficulty label → motor numeric level (1–5). */
const DIFF_TO_LEVEL = { easy: 1, medium: 2, hard: 3, expert: 4, master: 5 };

/** Talim level (1–8) → search depth, per spec MOTOR puzzle_solving mapping. */
function puzzleDepthForLevel(level) {
  if (level <= 2) return 2;
  if (level <= 4) return 3;
  if (level <= 6) return 3;
  return 4;
}

class EngineService {
  constructor() {
    /** @type {any} */ this.motor = null;
    this.usingMotor = false;
    this.ready = false;
    this._initPromise = null;
  }

  /** Detect + initialise the WASM motor if available (idempotent). */
  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && window.ApexMotor) {
          this.motor = window.ApexMotor;
        } else if (typeof window !== 'undefined') {
          // Optional: a user-dropped module at /engine/apex_timur.js. The URL is
          // a runtime variable (+ @vite-ignore) so the bundler never tries to
          // resolve it at build time — it simply won't exist until provided.
          const motorUrl = `${window.location.origin}/engine/apex_timur.js`;
          const mod = await import(/* @vite-ignore */ motorUrl).catch(() => null);
          if (mod) this.motor = mod.default ?? mod;
        }
        if (this.motor) {
          if (typeof this.motor.init === 'function') await this.motor.init();
          this.usingMotor = true;
          logger.info('Apex Timur motor loaded — using WASM engine.');
        } else {
          logger.info('Apex Timur motor not found — using JS fallback engine.');
        }
      } catch (err) {
        logger.warn('Motor init failed, using JS fallback:', err);
        this.motor = null;
        this.usingMotor = false;
      }
      this.ready = true;
    })();
    return this._initPromise;
  }

  /** Encode a position for the motor (hook for the future converter). */
  encodeForMotor(position) {
    return encodePosition(position);
  }

  /**
   * Is a move legal? (<5ms target.)
   * @returns {boolean}
   */
  isLegal(position, from, to, side) {
    if (this.usingMotor && this.motor.is_legal) {
      try {
        return !!this.motor.is_legal(this.encodeForMotor(position), { from, to });
      } catch (err) {
        logger.warn('motor.is_legal failed, falling back:', err);
      }
    }
    return isLegalMove(position, from, to, side);
  }

  /**
   * Generate a bot move asynchronously (kept off the paint path so the
   * "thinking" indicator can render first).
   * @param {import('../utils/board.js').Position} position
   * @param {{ difficulty?: string, color: string }} opts
   * @returns {Promise<{ from: number, to: number, evaluation: number }|null>}
   */
  async getBotMove(position, { difficulty = 'medium', color }) {
    if (this.usingMotor && this.motor.get_bot_move) {
      try {
        const res = this.motor.get_bot_move(this.encodeForMotor(position), DIFF_TO_LEVEL[difficulty] ?? 2);
        if (res) return res;
      } catch (err) {
        logger.warn('motor.get_bot_move failed, falling back:', err);
      }
    }
    // Yield a frame so React can paint the "düşünüyor…" state before the search.
    return new Promise((resolve) => {
      setTimeout(() => resolve(getBestMove(position, color, difficulty)), 12);
    });
  }

  /**
   * Solve a puzzle position (for hints / verification).
   * @returns {Promise<{ from: number, to: number, evaluation: number }|null>}
   */
  async solvePuzzle(position, color, level = 4) {
    const depth = puzzleDepthForLevel(level);
    if (this.usingMotor && this.motor.solve_puzzle) {
      try {
        const res = this.motor.solve_puzzle(this.encodeForMotor(position), depth);
        if (res) return res;
      } catch (err) {
        logger.warn('motor.solve_puzzle failed, falling back:', err);
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve(solve(position, color, depth)), 12));
  }

  /**
   * Analyse a finished game (per-move eval + blunders).
   * @param {object[]} moves [{from,to,promotion?}]
   * @returns {object} analysis
   */
  analyzeGame(moves) {
    if (this.usingMotor && this.motor.analyze_game) {
      try {
        return this.motor.analyze_game(moves);
      } catch (err) {
        logger.warn('motor.analyze_game failed, falling back:', err);
      }
    }
    const perMove = analyze(
      moves,
      createInitialPosition,
      (pos, m) => applyMove(pos, m).position,
    );
    return { perMove, blunders: perMove.filter((p) => p.blunder) };
  }

  /** Which difficulty labels are available. */
  get difficulties() {
    return Object.keys(DIFFICULTY);
  }
}

export const engineService = new EngineService();
export default engineService;
