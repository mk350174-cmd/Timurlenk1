/**
 * @file Unified bot commander roster (50 bots, 2 categories).
 *
 * The roster merges:
 *   - 40 mythological persona bots (6 groups)  → src/data/mythologicalBots.js
 *   - 10 historical commander bots (rich data) → src/data/historicalBots.js
 *
 * Every bot is a playable opponent. The shape stays backward-compatible with
 * existing consumers (tournamentStore, OnlineGame) which read
 * `{ id, name, rating, rd, difficulty }`; richer fields (category, personaGroup,
 * psyche, portrait, and — for historical — title/era/sections) are additive.
 */

import { MYTHOLOGICAL_BOTS } from './mythologicalBots.js';
import { HISTORICAL_BOTS, historicalBySlug } from './historicalBots.js';
import { ratingToDifficulty } from '../utils/rating.js';
import { PERSONA_GROUPS, PERSONA_ORDER } from '../utils/constants.js';

/**
 * @typedef {Object} Commander
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {number} rating ELO
 * @property {number} rd rating deviation
 * @property {string} difficulty JS-engine difficulty label
 * @property {'mythological'|'historical'} category
 * @property {string} personaGroup one of PERSONA_GROUPS keys
 * @property {number|{value:number,label:string}} psyche
 * @property {string} portrait S3 asset key
 * @property {string} [title] (historical) gallery title
 * @property {string} [epithet] (historical) profile epithet
 * @property {object} [era] (historical)
 * @property {object[]} [sections] (historical) profile content blocks
 * @property {boolean} [featured] (historical) 2×2 gallery highlight
 */

/** All 50 bots (mythological first, then historical). @type {Commander[]} */
export const COMMANDERS = [...MYTHOLOGICAL_BOTS, ...HISTORICAL_BOTS];

/** Distinct ELO tiers present (ascending). */
export const RATING_TIERS = [...new Set(COMMANDERS.map((c) => c.rating))].sort((a, b) => a - b);

/**
 * Bots in a category.
 * @param {'mythological'|'historical'} category
 * @returns {Commander[]}
 */
export function byCategory(category) {
  return COMMANDERS.filter((c) => c.category === category);
}

/**
 * Mythological bots grouped by persona family, in faction-tab order.
 * @returns {{ group: object, bots: Commander[] }[]}
 */
export function mythologicalByGroup() {
  return PERSONA_ORDER.map((key) => ({
    group: PERSONA_GROUPS[key],
    bots: MYTHOLOGICAL_BOTS.filter((c) => c.personaGroup === key),
  }));
}

/**
 * Pick a commander near a target rating (fair matchmaking).
 * @param {number} rating
 * @returns {Commander}
 */
export function pickCommanderNear(rating) {
  const sorted = [...COMMANDERS].sort(
    (a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating),
  );
  const pool = sorted.slice(0, 5);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Lookup by id. */
export function commanderById(id) {
  return COMMANDERS.find((c) => c.id === id) ?? null;
}

/** Lookup by slug (used by the profile route). */
export function commanderBySlug(slug) {
  return COMMANDERS.find((c) => c.slug === slug) ?? null;
}

export { ratingToDifficulty, historicalBySlug };
export default COMMANDERS;
