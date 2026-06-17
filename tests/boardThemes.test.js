/**
 * @file Board theme catalog tests.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_THEMES, boardThemeById, DEFAULT_BOARD_THEME } from '../src/data/boardThemes.js';

test('there are 5 themes with the expected ids', () => {
  assert.equal(BOARD_THEMES.length, 5);
  const ids = BOARD_THEMES.map((t) => t.id).sort();
  assert.deepEqual(ids, ['phoenix', 'wolfGold', 'wolfRed', 'wolfTeal', 'wolfWood'].sort());
});

test('each theme has an accent hex and a texture key', () => {
  for (const t of BOARD_THEMES) {
    assert.match(t.accentColor, /^#[0-9a-fA-F]{6}$/, `${t.id} accent`);
    assert.ok(t.texture.startsWith('textures/'), `${t.id} texture`);
    assert.ok(t.title && Array.isArray(t.tags), `${t.id} metadata`);
  }
});

test('boardThemeById falls back to the default for unknown ids', () => {
  assert.equal(boardThemeById('nope').id, DEFAULT_BOARD_THEME);
  assert.equal(boardThemeById('phoenix').id, 'phoenix');
});
