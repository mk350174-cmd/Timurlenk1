/**
 * @file Talim Alanı puzzle data (8 levels × 10 puzzles).
 *
 * Puzzles are generated *deterministically* from a seeded RNG so that a given
 * puzzle id always yields the same position (needed for progress tracking),
 * while remaining trivially solvable-by-construction: every puzzle places a
 * friendly piece that has a legal capture of the enemy Şah. The objective is
 * always "capture the enemy king in one move", so any king-capturing move is
 * accepted — decoy pieces add visual difficulty per level without ever making
 * a puzzle unsolvable.
 *
 * When the Apex Timur engine lands (v1.1) these can be swapped for true
 * tactical positions ("mate in N") behind the same data shape.
 */

import { BOARD_SIZE, COLOR, PIECE } from '../utils/constants.js';
import { coordsToSquare, squareToLabel, piece } from '../utils/board.js';
import { getLegalMoves } from '../utils/moves.js';

const { files: FILES, ranks: RANKS, squares: SQUARES } = BOARD_SIZE;

/** Level metadata from the spec (TALIM_ALANI). */
export const LEVELS = [
  { level: 1, name: 'Er', difficulty: 'Acemi', bonus: 10 },
  { level: 2, name: 'Alp', difficulty: 'Kolay', bonus: 25 },
  { level: 3, name: 'Savaşçı', difficulty: 'Orta', bonus: 40 },
  { level: 4, name: 'Atabey', difficulty: 'Orta-Zor', bonus: 60 },
  { level: 5, name: 'Komutan', difficulty: 'Zor', bonus: 80 },
  { level: 6, name: 'Serasker', difficulty: 'Zor-Uzman', bonus: 110 },
  { level: 7, name: 'Vezir', difficulty: 'Uzman', bonus: 150 },
  { level: 8, name: 'Timurlenk', difficulty: 'Usta', bonus: 250, finalBoss: true },
];

const PUZZLES_PER_LEVEL = 10;

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Attacker types unlocked per level (harder pieces require more vision). */
function attackerPool(level) {
  if (level <= 2) return [PIECE.VEZIR, PIECE.KALE];
  if (level <= 4) return [PIECE.KALE, PIECE.FIL, PIECE.VEZIR];
  if (level <= 6) return [PIECE.AT, PIECE.FIL, PIECE.KALE];
  return [PIECE.AT, PIECE.DEVE, PIECE.FIL];
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/**
 * Build one deterministic puzzle.
 * @param {number} level 1…8
 * @param {number} index 0…9
 * @returns {object} puzzle definition
 */
function generatePuzzle(level, index) {
  const rng = mulberry32(level * 1000 + index * 7 + 13);
  const position = new Array(SQUARES).fill(null);

  // Place the enemy (black) king somewhere central-ish.
  const kingFile = 1 + Math.floor(rng() * (FILES - 2));
  const kingRank = 1 + Math.floor(rng() * (RANKS - 2));
  const kingSq = coordsToSquare(kingFile, kingRank);
  position[kingSq] = piece(COLOR.BLACK, PIECE.SAH);

  // Find a friendly (white) attacker placement that can capture the king.
  const types = attackerPool(level);
  let attackerSq = -1;
  let attackerType = PIECE.VEZIR;
  for (let tries = 0; tries < 200 && attackerSq < 0; tries += 1) {
    const t = pick(rng, types);
    const f = Math.floor(rng() * FILES);
    const r = Math.floor(rng() * RANKS);
    const sq = coordsToSquare(f, r);
    if (sq === kingSq || position[sq]) continue;
    position[sq] = piece(COLOR.WHITE, t);
    if (getLegalMoves(position, sq).includes(kingSq)) {
      attackerSq = sq;
      attackerType = t;
    } else {
      position[sq] = null; // undo and retry
    }
  }
  // Guaranteed fallback: a vezir adjacent to the king.
  if (attackerSq < 0) {
    const f = Math.max(0, kingFile - 1);
    const sq = coordsToSquare(f, kingRank);
    position[sq] = piece(COLOR.WHITE, PIECE.VEZIR);
    attackerSq = sq;
    attackerType = PIECE.VEZIR;
  }

  // Add decoy pieces (more at higher levels) without blocking the solution
  // or creating an immediate self-capture path.
  const decoyCount = Math.min(2 + level, 12);
  const solutionPath = lineBetween(attackerSq, kingSq);
  let placed = 0;
  for (let tries = 0; tries < 400 && placed < decoyCount; tries += 1) {
    const sq = Math.floor(rng() * SQUARES);
    if (position[sq] || sq === kingSq || sq === attackerSq) continue;
    if (solutionPath.includes(sq)) continue; // don't block a slider's path
    const color = rng() > 0.5 ? COLOR.WHITE : COLOR.BLACK;
    const type = pick(rng, [PIECE.PIYADE, PIECE.AT, PIECE.FIL, PIECE.KALE, PIECE.DEVE]);
    position[sq] = piece(color, type);
    placed += 1;
  }

  return {
    id: `L${level}P${index + 1}`,
    level,
    index,
    objective: 'Düşman Şah’ını tek hamlede al!',
    hint: `${labelType(attackerType)} ile şahı yakala. (${squareToLabel(attackerSq)} → ${squareToLabel(kingSq)})`,
    position,
    turn: COLOR.WHITE,
    kingSquare: kingSq,
    /** Any move landing on the king square solves it. */
    solutionSquare: kingSq,
  };
}

/** Squares strictly between two aligned squares (for slider paths); else []. */
function lineBetween(a, b) {
  const af = a % FILES;
  const ar = Math.floor(a / FILES);
  const bf = b % FILES;
  const br = Math.floor(b / FILES);
  const df = Math.sign(bf - af);
  const dr = Math.sign(br - ar);
  const aligned = af === bf || ar === br || Math.abs(bf - af) === Math.abs(br - ar);
  if (!aligned) return [];
  const path = [];
  let f = af + df;
  let r = ar + dr;
  while (f !== bf || r !== br) {
    path.push(r * FILES + f);
    f += df;
    r += dr;
  }
  return path;
}

const TR_NAMES = {
  [PIECE.SAH]: 'Şah',
  [PIECE.VEZIR]: 'Vezir',
  [PIECE.KALE]: 'Kale',
  [PIECE.FIL]: 'Fil',
  [PIECE.AT]: 'At',
  [PIECE.DEVE]: 'Deve',
  [PIECE.PIYADE]: 'Piyade',
};
const labelType = (t) => TR_NAMES[t] ?? t;

/**
 * All puzzles grouped by level (1-indexed object).
 * @type {Record<number, object[]>}
 */
export const PUZZLES = (() => {
  const out = {};
  for (const lvl of LEVELS) {
    out[lvl.level] = Array.from({ length: PUZZLES_PER_LEVEL }, (_, i) =>
      generatePuzzle(lvl.level, i),
    );
  }
  return out;
})();

export { PUZZLES_PER_LEVEL };
export default PUZZLES;
