/**
 * @file API/transport JSDoc typedefs (request/response shapes used by the
 * service layer). Endpoint reference lives in README.md → API surface.
 */

/**
 * @typedef {Object} AuthResult
 * @property {import('./user.js').UserProfile|null} user
 * @property {{ message: string }|null} error
 * @property {object} [session]
 */

/**
 * @typedef {Object} SyncResult
 * @property {boolean} ok
 * @property {boolean} flagged whether the game was flagged for manual review
 * @property {string} [reason]
 */

/**
 * @typedef {Object} RatingUpdate
 * @property {number} ratingDelta
 * @property {number} newRating
 */

export {};
