/**
 * @file User & rating JSDoc typedefs.
 */

/**
 * @typedef {Object} Rating
 * @property {number} rating Glicko-2 rating
 * @property {number} rd rating deviation
 * @property {number} volatility
 * @property {number} games_played
 * @property {number} wins
 * @property {number} losses
 * @property {number} draws
 * @property {number} current_streak
 * @property {number} highest_rating
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string|null} avatar_url
 * @property {string} joined_date ISO timestamp
 * @property {Record<string, Rating>} ratings keyed by time control
 */

export {};
