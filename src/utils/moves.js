/**
 * @file Move generation for Timurlenk chess (MVP, JS reference implementation).
 *
 * IMPORTANT — MVP scope (see TIMURLENK_SPEC NOTES.motor_integration):
 *   This generates *pseudo-legal* moves and detects game end by KING CAPTURE.
 *   It deliberately does NOT implement check / checkmate / pin / stalemate /
 *   castling / en-passant. The real rules engine (Apex Timur, C++ → WASM) lands
 *   in v1.1 and will replace this module behind the same function signatures.
 *
 * Piece movement
 *   sah    King   — one step in any of 8 directions
 *   vezir  Queen  — slides orthogonally + diagonally
 *   kale   Rook   — slides orthogonally
 *   fil    Bishop — slides diagonally
 *   at     Knight — (2,1) leaper
 *   deve   Camel  — (3,1) leaper  (Tamerlane flavour)
 *   piyade Pawn   — forward 1 (or 2 from home rank), captures diagonally,
 *                   auto-promotes to Vezir on the far rank
 */

import { COLOR, PIECE } from './constants.js';
import {
  squareToCoords,
  coordsToSquare,
  inBounds,
  findKing,
  applyMove,
} from './board.js';

const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KING_STEPS = [...ORTHO, ...DIAG];
const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const CAMEL = [[3, 1], [1, 3], [-3, 1], [-1, 3], [3, -1], [1, -3], [-3, -1], [-1, -3]];

/**
 * Generate pseudo-legal target squares for the piece sitting on `square`.
 * @param {import('./board.js').Position} pos
 * @param {number} square 0…109
 * @returns {number[]} target square indices
 */
export function getLegalMoves(pos, square) {
  const p = pos[square];
  if (!p) return [];
  const { file, rank } = squareToCoords(square);
  const targets = [];

  /** Push a target if it is on-board and not occupied by a friendly piece. */
  const tryAdd = (f, r) => {
    if (!inBounds(f, r)) return false;
    const sq = coordsToSquare(f, r);
    const occupant = pos[sq];
    if (occupant && occupant.c === p.c) return false; // blocked by own piece
    targets.push(sq);
    return !occupant; // true → square was empty, sliders may continue
  };

  /** Slide along a set of directions until blocked. */
  const slide = (dirs) => {
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (tryAdd(f, r)) {
        f += df;
        r += dr;
      }
    }
  };

  /** Jump to a fixed set of offsets (leapers). */
  const leap = (offsets) => {
    for (const [df, dr] of offsets) tryAdd(file + df, rank + dr);
  };

  switch (p.t) {
    case PIECE.SAH:
      leap(KING_STEPS);
      break;
    case PIECE.VEZIR:
      slide([...ORTHO, ...DIAG]);
      break;
    case PIECE.KALE:
      slide(ORTHO);
      break;
    case PIECE.FIL:
      slide(DIAG);
      break;
    case PIECE.AT:
      leap(KNIGHT);
      break;
    case PIECE.DEVE:
      leap(CAMEL);
      break;
    case PIECE.PIYADE:
      addPawnMoves(pos, p, file, rank, targets);
      break;
    default:
      break;
  }
  return targets;
}

/**
 * Pawn move generation (mutates `targets`).
 * @param {import('./board.js').Position} pos
 * @param {import('./board.js').Piece} p
 * @param {number} file
 * @param {number} rank
 * @param {number[]} targets
 */
function addPawnMoves(pos, p, file, rank, targets) {
  const dir = p.c === COLOR.WHITE ? 1 : -1;
  const homeRank = p.c === COLOR.WHITE ? 1 : 8;

  // Forward one
  const oneRank = rank + dir;
  if (inBounds(file, oneRank) && !pos[coordsToSquare(file, oneRank)]) {
    targets.push(coordsToSquare(file, oneRank));
    // Forward two from the home rank (both squares must be empty)
    const twoRank = rank + 2 * dir;
    if (rank === homeRank && inBounds(file, twoRank) && !pos[coordsToSquare(file, twoRank)]) {
      targets.push(coordsToSquare(file, twoRank));
    }
  }

  // Diagonal captures
  for (const df of [-1, 1]) {
    const cf = file + df;
    const cr = rank + dir;
    if (!inBounds(cf, cr)) continue;
    const occupant = pos[coordsToSquare(cf, cr)];
    if (occupant && occupant.c !== p.c) targets.push(coordsToSquare(cf, cr));
  }
}

/**
 * Is the move from→to pseudo-legal for the side to move?
 * @param {import('./board.js').Position} pos
 * @param {number} from
 * @param {number} to
 * @param {string} [sideToMove] optional color guard
 * @returns {boolean}
 */
export function isLegalMove(pos, from, to, sideToMove) {
  const p = pos[from];
  if (!p) return false;
  if (sideToMove && p.c !== sideToMove) return false;
  return getLegalMoves(pos, from).includes(to);
}

/**
 * Generate every pseudo-legal move for a color.
 * @param {import('./board.js').Position} pos
 * @param {string} color
 * @returns {{ from: number, to: number }[]}
 */
export function generateAllMoves(pos, color) {
  const moves = [];
  for (let sq = 0; sq < pos.length; sq += 1) {
    const p = pos[sq];
    if (!p || p.c !== color) continue;
    for (const to of getLegalMoves(pos, sq)) moves.push({ from: sq, to });
  }
  return moves;
}

/**
 * Game status by king presence (MVP rule: capture the king to win).
 * @param {import('./board.js').Position} pos
 * @returns {{ over: boolean, winner: string|null }}
 */
export function getGameStatus(pos) {
  const whiteKing = findKing(pos, COLOR.WHITE);
  const blackKing = findKing(pos, COLOR.BLACK);
  if (whiteKing === -1) return { over: true, winner: COLOR.BLACK };
  if (blackKing === -1) return { over: true, winner: COLOR.WHITE };
  return { over: false, winner: null };
}

/**
 * Lightweight greedy bot used for offline / "vs bot" play (no WASM engine yet).
 * Strategy: capture the king if possible, otherwise take the most valuable
 * piece available, otherwise a random legal move. Good enough to make offline
 * games and the Talim Alanı feel alive at 60 FPS.
 *
 * @param {import('./board.js').Position} pos
 * @param {string} color color to move
 * @returns {{ from: number, to: number }|null}
 */
export function pickBotMove(pos, color) {
  const moves = generateAllMoves(pos, color);
  if (moves.length === 0) return null;

  const VALUE = {
    [PIECE.SAH]: 1000,
    [PIECE.VEZIR]: 9,
    [PIECE.KALE]: 5,
    [PIECE.FIL]: 3,
    [PIECE.AT]: 3,
    [PIECE.DEVE]: 4,
    [PIECE.PIYADE]: 1,
  };

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const target = pos[m.to];
    // Small random jitter keeps the bot from being fully deterministic.
    const score = (target ? VALUE[target.t] ?? 0 : 0) + Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

/**
 * Convenience helper: apply a move only if legal.
 * @param {import('./board.js').Position} pos
 * @param {number} from
 * @param {number} to
 * @param {string} [sideToMove]
 * @returns {ReturnType<typeof applyMove>|null}
 */
export function tryMove(pos, from, to, sideToMove) {
  if (!isLegalMove(pos, from, to, sideToMove)) return null;
  return applyMove(pos, { from, to });
}
