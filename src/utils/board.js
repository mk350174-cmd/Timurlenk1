/**
 * @file Board model & position utilities for the 11×10 Timurlenk board.
 *
 * Coordinate system
 * -----------------
 *   square = rank * 11 + file        (0 … 109)
 *   file:  0 … 10  → labels 'a' … 'k'
 *   rank:  0 … 9   → labels '1' … '10'
 *   rank 0 is White's home rank, rank 9 is Black's home rank.
 *
 * A "position" is a flat Array(110) where each entry is either `null` (empty)
 * or a piece object `{ c, t }` (color, type). Flat arrays keep encode/decode
 * trivial and are fast enough for the Canvas renderer to hit 60 FPS.
 *
 * The eventual Apex Timur WASM engine will replace move generation, but the
 * encoding here is intentionally engine-agnostic.
 */

import { BOARD_SIZE, COLOR, PIECE } from './constants.js';

const { files: FILES, ranks: RANKS, squares: SQUARES } = BOARD_SIZE;

/** File index → label ('a'…'k'). */
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];

/**
 * @typedef {{ c: string, t: string }} Piece  color + type
 * @typedef {(Piece|null)[]} Position           length === 110
 * @typedef {{ from: number, to: number, promotion?: string }} MoveInput
 * @typedef {{ from: number, to: number, piece: Piece, captured: Piece|null,
 *             promotion?: string, color: string }} Move
 */

/**
 * Build a piece object.
 * @param {string} c color (COLOR.WHITE | COLOR.BLACK)
 * @param {string} t type (PIECE.*)
 * @returns {Piece}
 */
export const piece = (c, t) => ({ c, t });

/**
 * Convert a square index to file/rank coordinates.
 * @param {number} sq 0…109
 * @returns {{ file: number, rank: number }}
 */
export function squareToCoords(sq) {
  return { file: sq % FILES, rank: Math.floor(sq / FILES) };
}

/**
 * Convert file/rank coordinates to a square index.
 * @param {number} file 0…10
 * @param {number} rank 0…9
 * @returns {number} 0…109
 */
export function coordsToSquare(file, rank) {
  return rank * FILES + file;
}

/**
 * Bounds check for coordinates.
 * @param {number} file
 * @param {number} rank
 * @returns {boolean}
 */
export function inBounds(file, rank) {
  return file >= 0 && file < FILES && rank >= 0 && rank < RANKS;
}

/**
 * Human-readable square label, e.g. 0 → 'a1', 109 → 'k10'.
 * @param {number} sq
 * @returns {string}
 */
export function squareToLabel(sq) {
  const { file, rank } = squareToCoords(sq);
  return `${FILE_LABELS[file]}${rank + 1}`;
}

/**
 * Parse a square label back to an index. Returns -1 if invalid.
 * @param {string} label e.g. 'c4'
 * @returns {number}
 */
export function labelToSquare(label) {
  if (typeof label !== 'string' || label.length < 2) return -1;
  const file = FILE_LABELS.indexOf(label[0].toLowerCase());
  const rank = parseInt(label.slice(1), 10) - 1;
  if (file < 0 || Number.isNaN(rank) || !inBounds(file, rank)) return -1;
  return coordsToSquare(file, rank);
}

/**
 * Create a fresh starting position for Timurlenk chess.
 * Back rank (symmetric, 11 files): Kale At Fil Deve Vezir Şah Vezir Deve Fil At Kale.
 * Pawns fill the second rank for each side.
 * @returns {Position}
 */
export function createInitialPosition() {
  const pos = new Array(SQUARES).fill(null);
  const backRank = [
    PIECE.KALE, PIECE.AT, PIECE.FIL, PIECE.DEVE, PIECE.VEZIR,
    PIECE.SAH,
    PIECE.VEZIR, PIECE.DEVE, PIECE.FIL, PIECE.AT, PIECE.KALE,
  ];

  for (let file = 0; file < FILES; file += 1) {
    // White home (rank 0) + pawns (rank 1)
    pos[coordsToSquare(file, 0)] = piece(COLOR.WHITE, backRank[file]);
    pos[coordsToSquare(file, 1)] = piece(COLOR.WHITE, PIECE.PIYADE);
    // Black home (rank 9) + pawns (rank 8)
    pos[coordsToSquare(file, RANKS - 1)] = piece(COLOR.BLACK, backRank[file]);
    pos[coordsToSquare(file, RANKS - 2)] = piece(COLOR.BLACK, PIECE.PIYADE);
  }
  return pos;
}

/** Immutable template; callers must NOT mutate — clone via `clonePosition`. */
export const STARTING_POSITION = Object.freeze(createInitialPosition());

/**
 * Deep-clone a position (pieces are small plain objects).
 * @param {Position} pos
 * @returns {Position}
 */
export function clonePosition(pos) {
  return pos.map((p) => (p ? { c: p.c, t: p.t } : null));
}

/**
 * Encode a position to a compact JSON string for Supabase / LocalStorage.
 * Empty squares become 0; pieces become "<c><typeInitial>" e.g. "ws" (white şah).
 * @param {Position} pos
 * @returns {string}
 */
export function encodePosition(pos) {
  const compact = pos.map((p) => (p ? `${p.c}${p.t[0]}` : 0));
  return JSON.stringify(compact);
}

/** Reverse map from type-initial → full type. */
const TYPE_FROM_INITIAL = {
  s: PIECE.SAH,
  v: PIECE.VEZIR,
  k: PIECE.KALE,
  f: PIECE.FIL,
  a: PIECE.AT,
  d: PIECE.DEVE,
  p: PIECE.PIYADE,
};

/**
 * Decode a string produced by {@link encodePosition}.
 * @param {string} encoded
 * @returns {Position}
 */
export function decodePosition(encoded) {
  try {
    const compact = JSON.parse(encoded);
    return compact.map((cell) => {
      if (!cell || cell === 0) return null;
      const c = cell[0];
      const t = TYPE_FROM_INITIAL[cell[1]] ?? PIECE.PIYADE;
      return { c, t };
    });
  } catch {
    return createInitialPosition();
  }
}

/**
 * Find a side's king square.
 * @param {Position} pos
 * @param {string} color
 * @returns {number} square index, or -1 if the king is missing (captured).
 */
export function findKing(pos, color) {
  for (let sq = 0; sq < SQUARES; sq += 1) {
    const p = pos[sq];
    if (p && p.c === color && p.t === PIECE.SAH) return sq;
  }
  return -1;
}

/**
 * Apply a move immutably. Handles capture and pawn promotion to Vezir.
 * Does NOT validate legality — call {@link import('./moves.js').isLegalMove}
 * first. Returns the new position plus the captured piece (if any).
 *
 * @param {Position} pos
 * @param {MoveInput} move
 * @returns {{ position: Position, captured: Piece|null, move: Move }}
 */
export function applyMove(pos, move) {
  const next = clonePosition(pos);
  const moving = next[move.from];
  const captured = next[move.to] ?? null;

  next[move.to] = moving;
  next[move.from] = null;

  // Pawn promotion: reaching the far rank becomes a Vezir (auto-queen for MVP).
  if (moving && moving.t === PIECE.PIYADE) {
    const { rank } = squareToCoords(move.to);
    const promoteRank = moving.c === COLOR.WHITE ? RANKS - 1 : 0;
    if (rank === promoteRank) {
      next[move.to] = piece(moving.c, move.promotion || PIECE.VEZIR);
    }
  }

  return {
    position: next,
    captured,
    move: {
      from: move.from,
      to: move.to,
      piece: moving,
      captured,
      promotion: move.promotion,
      color: moving?.c,
    },
  };
}

/**
 * Render a move in compact coordinate notation, e.g. "a2-a4", "c3xK e5".
 * @param {Move} move
 * @returns {string}
 */
export function moveToNotation(move) {
  const sep = move.captured ? 'x' : '-';
  const promo = move.promotion ? '=V' : '';
  return `${squareToLabel(move.from)}${sep}${squareToLabel(move.to)}${promo}`;
}

export { FILE_LABELS, FILES, RANKS, SQUARES };
