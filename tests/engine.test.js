/**
 * @file Unit tests for the v1.1 JS engine (aiEngine) and commander roster.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getBestMove, DIFFICULTY, evaluate } from '../src/utils/aiEngine.js';
import { createInitialPosition, coordsToSquare, piece, findKing, applyMove } from '../src/utils/board.js';
import { COLOR, PIECE } from '../src/utils/constants.js';
import { COMMANDERS, ratingToDifficulty, pickCommanderNear } from '../src/data/commanders.js';

test('engine finds a one-move king capture (mate in 1)', () => {
  const pos = new Array(110).fill(null);
  pos[coordsToSquare(5, 0)] = piece(COLOR.WHITE, PIECE.SAH);
  pos[coordsToSquare(2, 0)] = piece(COLOR.WHITE, PIECE.KALE);
  pos[coordsToSquare(2, 6)] = piece(COLOR.BLACK, PIECE.SAH); // rook can take down the file
  const mv = getBestMove(pos, COLOR.WHITE, 'hard');
  assert.ok(mv, 'a move is returned');
  const { position } = applyMove(pos, mv);
  assert.equal(findKing(position, COLOR.BLACK), -1, 'black king captured');
});

test('engine returns a legal move from the opening position and terminates', () => {
  const pos = createInitialPosition();
  const t0 = performance.now();
  const mv = getBestMove(pos, COLOR.WHITE, 'master');
  const elapsed = performance.now() - t0;
  assert.ok(mv && Number.isInteger(mv.from) && Number.isInteger(mv.to));
  assert.ok(pos[mv.from] && pos[mv.from].c === COLOR.WHITE, 'moves own piece');
  assert.ok(elapsed < 3000, `search bounded (took ${Math.round(elapsed)}ms)`);
});

test('symmetric start position evaluates to ~0', () => {
  // Material is mirrored; only floating-point residue from the centre term remains.
  assert.ok(Math.abs(evaluate(createInitialPosition())) < 1);
});

test('difficulty table has all five tiers', () => {
  for (const tier of ['easy', 'medium', 'hard', 'expert', 'master']) {
    assert.ok(DIFFICULTY[tier], `${tier} present`);
  }
});

test('commander roster has 50 entries across 8 tiers with valid difficulty', () => {
  assert.equal(COMMANDERS.length, 50);
  const tiers = new Set(COMMANDERS.map((c) => c.rating));
  assert.equal(tiers.size, 8);
  for (const c of COMMANDERS) {
    assert.equal(c.difficulty, ratingToDifficulty(c.rating));
  }
});

test('pickCommanderNear returns a nearby-rated commander', () => {
  const c = pickCommanderNear(1400);
  assert.ok(c && Math.abs(c.rating - 1400) <= 400);
});
