/**
 * @file Data-integrity tests for the unified 50-bot commander roster.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COMMANDERS,
  byCategory,
  RATING_TIERS,
  ratingToDifficulty,
  commanderBySlug,
  mythologicalByGroup,
} from '../src/data/commanders.js';
import { PERSONA_ORDER } from '../src/utils/constants.js';

test('roster has 50 bots: 40 mythological + 10 historical', () => {
  assert.equal(COMMANDERS.length, 50);
  assert.equal(byCategory('mythological').length, 40);
  assert.equal(byCategory('historical').length, 10);
});

test('every bot has a category, persona group, and consistent difficulty', () => {
  for (const c of COMMANDERS) {
    assert.ok(c.category === 'mythological' || c.category === 'historical', `${c.name} category`);
    assert.ok(PERSONA_ORDER.includes(c.personaGroup), `${c.name} personaGroup ${c.personaGroup}`);
    assert.equal(c.difficulty, ratingToDifficulty(c.rating), `${c.name} difficulty`);
    assert.ok(typeof c.rating === 'number' && c.rating > 0);
  }
});

test('ids and slugs are unique', () => {
  assert.equal(new Set(COMMANDERS.map((c) => c.id)).size, 50);
  assert.equal(new Set(COMMANDERS.map((c) => c.slug)).size, 50);
});

test('mythologicalByGroup covers 6 families summing to 40', () => {
  const groups = mythologicalByGroup();
  assert.equal(groups.length, 6);
  assert.equal(groups.reduce((n, g) => n + g.bots.length, 0), 40);
});

test('historical bots carry full profile data', () => {
  for (const c of byCategory('historical')) {
    assert.ok(c.title && c.epithet, `${c.name} titles`);
    assert.ok(c.era && c.era.dynasty, `${c.name} era`);
    assert.ok(Array.isArray(c.sections) && c.sections.length >= 1, `${c.name} sections`);
    assert.equal(typeof c.psyche.value, 'number', `${c.name} psyche.value`);
    assert.ok(c.portrait.startsWith('commanders/'), `${c.name} portrait key`);
    assert.ok(c.rating >= 2600, `${c.name} uses the canonical gallery ELO`);
  }
});

test('commanderBySlug resolves a known slug', () => {
  const sample = COMMANDERS[0];
  assert.equal(commanderBySlug(sample.slug)?.id, sample.id);
  assert.equal(commanderBySlug('does-not-exist'), null);
});

test('RATING_TIERS is sorted ascending and non-empty', () => {
  assert.ok(RATING_TIERS.length > 0);
  for (let i = 1; i < RATING_TIERS.length; i += 1) assert.ok(RATING_TIERS[i] > RATING_TIERS[i - 1]);
});
