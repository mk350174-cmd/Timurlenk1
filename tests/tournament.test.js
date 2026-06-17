/**
 * @file Unit tests for the tournament engine (pairing, standings, awards).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createSwissPairings,
  createKnockoutPairings,
  simulateGameResult,
  applyResult,
  rankStandings,
  computeAward,
  pairKey,
} from '../src/utils/tournamentEngine.js';

const players = [
  { id: 'a', rating: 2400 },
  { id: 'b', rating: 1800 },
  { id: 'c', rating: 1400 },
  { id: 'd', rating: 1000 },
];

test('swiss pairs everyone (even field, no byes)', () => {
  const pairings = createSwissPairings(players, {}, new Set());
  assert.equal(pairings.length, 2);
  const ids = pairings.flatMap((p) => [p.a.id, p.b.id]).sort();
  assert.deepEqual(ids, ['a', 'b', 'c', 'd']);
});

test('swiss gives a bye when the field is odd', () => {
  const odd = players.slice(0, 3);
  const pairings = createSwissPairings(odd, {}, new Set());
  assert.ok(pairings.some((p) => p.b === null), 'one pairing is a bye');
});

test('swiss avoids an immediate rematch when possible', () => {
  const played = new Set([pairKey('a', 'b')]);
  const pairings = createSwissPairings(players, { a: 1, b: 1 }, played);
  const aPair = pairings.find((p) => p.a.id === 'a' || p.b?.id === 'a');
  const aOpp = aPair.a.id === 'a' ? aPair.b?.id : aPair.a.id;
  assert.notEqual(aOpp, 'b');
});

test('knockout pairs adjacent survivors', () => {
  const pairings = createKnockoutPairings(players);
  assert.equal(pairings.length, 2);
  assert.equal(pairings[0].a.id, 'a');
  assert.equal(pairings[0].b.id, 'b');
});

test('simulateGameResult returns a valid score and a bye is a win', () => {
  assert.equal(simulateGameResult(players[0], null), 1);
  for (let i = 0; i < 50; i += 1) {
    const s = simulateGameResult(players[0], players[3]);
    assert.ok(s === 0 || s === 0.5 || s === 1);
  }
});

test('applyResult tallies points and games for both sides', () => {
  let standings = {};
  standings = applyResult(standings, 'a', 'b', 1);
  standings = applyResult(standings, 'a', 'c', 0.5);
  assert.equal(standings.a.points, 1.5);
  assert.equal(standings.a.games, 2);
  assert.equal(standings.a.wins, 1);
  assert.equal(standings.b.points, 0);
  assert.equal(standings.c.points, 0.5);
});

test('rankStandings orders by points then rating', () => {
  let s = {};
  s = applyResult(s, 'd', 'a', 1); // upset: d beats a
  const ranked = rankStandings(players, s);
  assert.equal(ranked[0].id, 'd');
  assert.equal(ranked[0].rank, 1);
});

test('awards map placement to the right badge', () => {
  assert.equal(computeAward('swiss', 1, 12).badge, 'champion');
  assert.equal(computeAward('swiss', 3, 12).badge, 'finalist');
  assert.equal(computeAward('swiss', 9, 12).badge, 'participant');
  assert.equal(computeAward('ladder', 2, 16).badge, 'ladder_master');
  assert.equal(computeAward('ladder', 8, 16).badge, 'ladder_elite');
});
