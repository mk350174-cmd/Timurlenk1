/**
 * @file Unit tests for the pure game-logic modules (board, moves, elo).
 * Run with `npm test` (node:test, no browser needed).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  coordsToSquare,
  squareToCoords,
  squareToLabel,
  labelToSquare,
  createInitialPosition,
  encodePosition,
  decodePosition,
  findKing,
  applyMove,
  piece,
} from '../src/utils/board.js';
import { getLegalMoves, getGameStatus, pickBotMove, isLegalMove } from '../src/utils/moves.js';
import { updateRatingForGame, expectedScore } from '../src/utils/elo.js';
import { COLOR, PIECE, BOARD_SIZE } from '../src/utils/constants.js';

// ── board ──────────────────────────────────────────────────────────────────
test('coords ↔ square round-trip across the whole board', () => {
  for (let sq = 0; sq < BOARD_SIZE.squares; sq += 1) {
    const { file, rank } = squareToCoords(sq);
    assert.equal(coordsToSquare(file, rank), sq);
  }
});

test('square labels map correctly', () => {
  assert.equal(squareToLabel(0), 'a1');
  assert.equal(squareToLabel(109), 'k10');
  assert.equal(labelToSquare('a1'), 0);
  assert.equal(labelToSquare('k10'), 109);
  assert.equal(labelToSquare('zz'), -1);
});

test('initial position has 44 pieces and kings on the centre file', () => {
  const pos = createInitialPosition();
  assert.equal(pos.length, 110);
  assert.equal(pos.filter(Boolean).length, 44);
  const whiteKing = pos[coordsToSquare(5, 0)];
  const blackKing = pos[coordsToSquare(5, 9)];
  assert.deepEqual(whiteKing, { c: COLOR.WHITE, t: PIECE.SAH });
  assert.deepEqual(blackKing, { c: COLOR.BLACK, t: PIECE.SAH });
});

test('encode / decode is loss-less', () => {
  const pos = createInitialPosition();
  const restored = decodePosition(encodePosition(pos));
  assert.deepEqual(restored, pos);
});

// ── moves ────────────────────────────────────────────────────────────────
test('pawn has single + double advance from home rank', () => {
  const pos = createInitialPosition();
  const from = coordsToSquare(3, 1); // a white pawn
  const targets = getLegalMoves(pos, from);
  assert.ok(targets.includes(coordsToSquare(3, 2)), 'single step');
  assert.ok(targets.includes(coordsToSquare(3, 3)), 'double step');
});

test('knight never lands on a friendly piece', () => {
  const pos = createInitialPosition();
  const from = coordsToSquare(1, 0); // white knight
  const targets = getLegalMoves(pos, from);
  assert.ok(targets.length > 0);
  for (const t of targets) {
    const occ = pos[t];
    assert.ok(!occ || occ.c !== COLOR.WHITE);
  }
});

test('rook slides until blocked by its own pawn', () => {
  const pos = new Array(110).fill(null);
  pos[coordsToSquare(0, 0)] = piece(COLOR.WHITE, PIECE.KALE);
  pos[coordsToSquare(0, 4)] = piece(COLOR.WHITE, PIECE.PIYADE);
  const targets = getLegalMoves(pos, coordsToSquare(0, 0));
  assert.ok(targets.includes(coordsToSquare(0, 3)), 'reaches square before blocker');
  assert.ok(!targets.includes(coordsToSquare(0, 4)), 'cannot capture own piece');
  assert.ok(!targets.includes(coordsToSquare(0, 5)), 'cannot jump the blocker');
});

test('game status detects a missing king', () => {
  const pos = new Array(110).fill(null);
  pos[coordsToSquare(5, 0)] = piece(COLOR.WHITE, PIECE.SAH);
  const status = getGameStatus(pos);
  assert.equal(status.over, true);
  assert.equal(status.winner, COLOR.WHITE);
});

test('bot prefers capturing the king when available', () => {
  const pos = new Array(110).fill(null);
  pos[coordsToSquare(5, 0)] = piece(COLOR.WHITE, PIECE.SAH);
  const kingSq = coordsToSquare(2, 2);
  pos[kingSq] = piece(COLOR.BLACK, PIECE.SAH);
  pos[coordsToSquare(2, 0)] = piece(COLOR.WHITE, PIECE.KALE); // can capture down the file
  const move = pickBotMove(pos, COLOR.WHITE);
  assert.ok(move);
  assert.equal(isLegalMove(pos, move.from, move.to, COLOR.WHITE), true);
  const { position } = applyMove(pos, move);
  assert.equal(findKing(position, COLOR.BLACK), -1, 'king was captured');
});

// ── elo (Glicko-2) ─────────────────────────────────────────────────────────
test('winning raises rating and shrinks RD', () => {
  const before = { rating: 1500, rd: 350, volatility: 0.06 };
  const after = updateRatingForGame(before, { rating: 1500, rd: 50 }, 1);
  assert.ok(after.rating > before.rating, 'rating up after a win');
  assert.ok(after.rd < before.rd, 'RD shrinks after a rated game');
});

test('losing lowers rating', () => {
  const before = { rating: 1500, rd: 200, volatility: 0.06 };
  const after = updateRatingForGame(before, { rating: 1500, rd: 50 }, 0);
  assert.ok(after.rating < before.rating);
});

test('expected score is symmetric around equal ratings', () => {
  assert.ok(Math.abs(expectedScore(1500, 1500) - 0.5) < 1e-9);
  assert.ok(expectedScore(1700, 1500) > 0.5);
  assert.ok(expectedScore(1300, 1500) < 0.5);
});
