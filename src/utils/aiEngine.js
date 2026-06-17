/**
 * @file JS chess engine — the **fallback brain** used until the Apex Timur WASM
 * motor is dropped in (see services/engineService.js + APEX_TIMUR_REFERENCE).
 *
 * Implements negamax + alpha-beta with capture-ordered moves, iterative
 * deepening and a strict node/time budget so the UI stays at 60 FPS. Difficulty
 * maps to search depth + move randomisation.
 *
 * NOTE: depths here are intentionally shallow (1–4) because a JS engine on a
 * 110-square board cannot match the C++/NNUE motor's depth 6–24. When the real
 * WASM motor loads, engineService delegates to it and these depths are unused.
 */

import { COLOR, PIECE } from './constants.js';
import { generateAllMoves } from './moves.js';
import { findKing, squareToCoords } from './board.js';

/** Centipawn material values for this MVP's 7-piece model. */
const VALUE = {
  [PIECE.SAH]: 0,
  [PIECE.VEZIR]: 900,
  [PIECE.KALE]: 500,
  [PIECE.DEVE]: 400,
  [PIECE.FIL]: 330,
  [PIECE.AT]: 300,
  [PIECE.PIYADE]: 100,
};

const MATE = 1_000_000;
const INF = Infinity;
const other = (c) => (c === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE);

/**
 * Difficulty tuning. `randomCp` = how far below the best score a move may be and
 * still be considered; `topK` = pool size to pick from; `timeMs`/`maxNodes`
 * bound the search.
 */
export const DIFFICULTY = {
  easy: { maxDepth: 1, randomCp: 150, topK: 6, timeMs: 120, maxNodes: 20_000 },
  medium: { maxDepth: 2, randomCp: 70, topK: 4, timeMs: 220, maxNodes: 60_000 },
  hard: { maxDepth: 3, randomCp: 30, topK: 2, timeMs: 350, maxNodes: 120_000 },
  expert: { maxDepth: 3, randomCp: 10, topK: 1, timeMs: 500, maxNodes: 180_000 },
  master: { maxDepth: 4, randomCp: 0, topK: 1, timeMs: 900, maxNodes: 250_000 },
};

/** Static evaluation from White's perspective (centipawns). */
function evaluate(pos) {
  let score = 0;
  for (let sq = 0; sq < pos.length; sq += 1) {
    const p = pos[sq];
    if (!p) continue;
    let v = VALUE[p.t] ?? 0;
    // Small central-control bonus so the bot develops sensibly.
    const { file, rank } = squareToCoords(sq);
    const centre = 5 - (Math.abs(file - 5) + Math.abs(rank - 4.5)) * 0.4;
    v += Math.max(0, centre);
    score += p.c === COLOR.WHITE ? v : -v;
  }
  return score;
}

/** In-place move application for fast search. Returns undo info. */
function make(pos, m) {
  const moving = pos[m.from];
  const captured = pos[m.to];
  pos[m.to] = moving;
  pos[m.from] = null;
  // Auto-promote pawns reaching the far rank (matches board.applyMove).
  if (moving.t === PIECE.PIYADE) {
    const rank = Math.floor(m.to / 11);
    const promoteRank = moving.c === COLOR.WHITE ? 9 : 0;
    if (rank === promoteRank) pos[m.to] = { c: moving.c, t: PIECE.VEZIR };
  }
  return { moving, captured };
}

/** Reverse a {@link make}. */
function undo(pos, m, info) {
  pos[m.from] = info.moving;
  pos[m.to] = info.captured;
}

/** Order moves: king captures, then high-value captures, then quiet. */
function orderMoves(pos, moves) {
  return moves
    .map((m) => {
      const target = pos[m.to];
      const score = target ? (target.t === PIECE.SAH ? 100000 : VALUE[target.t] ?? 0) : 0;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

/** Negamax with alpha-beta. Returns score from `side`'s perspective. */
function negamax(pos, depth, alpha, beta, side, ply, ctx) {
  ctx.nodes += 1;
  if (ctx.nodes > ctx.maxNodes || performance.now() - ctx.start > ctx.timeMs) {
    ctx.stop = true;
    const sign = side === COLOR.WHITE ? 1 : -1;
    return sign * evaluate(pos);
  }

  // King-capture terminal (this game ends when a king is taken).
  if (findKing(pos, side) === -1) return -(MATE - ply);
  if (findKing(pos, other(side)) === -1) return MATE - ply;

  if (depth <= 0) {
    const sign = side === COLOR.WHITE ? 1 : -1;
    return sign * evaluate(pos);
  }

  const moves = orderMoves(pos, generateAllMoves(pos, side));
  if (moves.length === 0) {
    const sign = side === COLOR.WHITE ? 1 : -1;
    return sign * evaluate(pos);
  }

  let best = -INF;
  for (const m of moves) {
    const info = make(pos, m);
    const score = -negamax(pos, depth - 1, -beta, -alpha, other(side), ply + 1, ctx);
    undo(pos, m, info);
    if (ctx.stop) return best === -INF ? score : best;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Choose a move for `side` at the given difficulty.
 * @param {import('./board.js').Position} position
 * @param {string} side COLOR.WHITE | COLOR.BLACK
 * @param {string} [difficulty] key of DIFFICULTY
 * @returns {{ from: number, to: number, evaluation: number }|null}
 */
export function getBestMove(position, side, difficulty = 'medium') {
  const cfg = DIFFICULTY[difficulty] ?? DIFFICULTY.medium;
  const pos = position.slice(); // single working copy; make/undo mutate in place
  const rootMoves = orderMoves(pos, generateAllMoves(pos, side));
  if (rootMoves.length === 0) return null;

  const ctx = { nodes: 0, maxNodes: cfg.maxNodes, start: performance.now(), timeMs: cfg.timeMs, stop: false };
  let scored = rootMoves.map((m) => ({ m, score: -INF }));

  // Iterative deepening keeps a valid move ready even if we run out of budget.
  for (let depth = 1; depth <= cfg.maxDepth; depth += 1) {
    const partial = [];
    let alpha = -INF;
    for (const { m } of scored.length ? scored : rootMoves.map((m) => ({ m }))) {
      const info = make(pos, m);
      const score = -negamax(pos, depth - 1, -INF, INF, other(side), 1, ctx);
      undo(pos, m, info);
      partial.push({ m, score });
      if (score > alpha) alpha = score;
      if (ctx.stop) break;
    }
    if (partial.length) {
      partial.sort((a, b) => b.score - a.score);
      scored = partial;
    }
    if (ctx.stop) break;
  }

  scored.sort((a, b) => b.score - a.score);
  const bestScore = scored[0].score;

  // Randomise among near-best moves for lower difficulties (human-like).
  const pool = scored.filter((s) => bestScore - s.score <= cfg.randomCp).slice(0, cfg.topK);
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? scored[0];
  return { from: choice.m.from, to: choice.m.to, evaluation: choice.score };
}

/**
 * Solve a puzzle position — find the best move (used by Talim Alanı hints when
 * the motor is absent). Higher `maxDepth` for tougher levels.
 * @returns {{ from: number, to: number, evaluation: number }|null}
 */
export function solve(position, side, maxDepth = 3) {
  const difficulty = maxDepth >= 4 ? 'master' : maxDepth >= 3 ? 'expert' : 'hard';
  return getBestMove(position, side, difficulty);
}

/**
 * Lightweight game analysis: per-move evaluation swing + blunder flags.
 * @param {{ from: number, to: number, promotion?: string }[]} moves
 * @param {() => import('./board.js').Position} initialPositionFactory
 * @param {(pos: import('./board.js').Position, m: object) => import('./board.js').Position} apply
 * @returns {{ ply: number, evalCp: number, blunder: boolean }[]}
 */
export function analyze(moves, initialPositionFactory, apply) {
  let pos = initialPositionFactory();
  const out = [];
  let prevEval = 0;
  moves.forEach((m, i) => {
    pos = apply(pos, m);
    const evalCp = evaluate(pos);
    const swing = Math.abs(evalCp - prevEval);
    out.push({ ply: i + 1, evalCp, blunder: swing > 250 });
    prevEval = evalCp;
  });
  return out;
}

export { evaluate, VALUE };
