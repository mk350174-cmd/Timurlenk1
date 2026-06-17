/**
 * @file Shared rating→difficulty mapping (leaf module, no deps) so both the bot
 * data files and commanders.js can use it without a circular import.
 */

/**
 * Map an ELO to a JS-engine difficulty label (matches aiEngine.DIFFICULTY keys).
 * @param {number} rating
 * @returns {'easy'|'medium'|'hard'|'expert'|'master'}
 */
export function ratingToDifficulty(rating) {
  if (rating <= 1100) return 'easy';
  if (rating <= 1500) return 'medium';
  if (rating <= 1900) return 'hard';
  if (rating <= 2200) return 'expert';
  return 'master';
}

export default ratingToDifficulty;
