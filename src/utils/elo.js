/**
 * @file Glicko-2 rating system (Mark Glickman's algorithm).
 *
 * The MVP stores three values per (user, time-control): `rating`, `rd`
 * (rating deviation) and `volatility`. Ratings are computed per game
 * (rating period = 1 game), which is how chess.com-style live ratings behave.
 *
 * Reference: http://www.glicko.net/glicko/glicko2.pdf
 */

import { RATING_DEFAULTS } from './constants.js';

/** Glicko-2 scale factor: 400 / ln(10). */
const SCALE = 173.7178;
/** Conventional anchor rating for the Glicko-2 transform. */
const ANCHOR = 1500;
/** System constant τ — constrains volatility change (0.3–1.2 typical). */
const TAU = 0.5;
/** Convergence tolerance for the volatility iteration. */
const EPSILON = 0.000001;

/**
 * @typedef {{ rating: number, rd: number, volatility: number }} Glicko
 * @typedef {{ rating: number, rd: number, volatility?: number, score: number }} GameResult
 *   score: 1 = win, 0.5 = draw, 0 = loss
 */

/** g(φ): impact of opponent RD. */
const g = (phi) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));

/** E: expected score of player (μ) vs opponent (μ_j, φ_j). */
const E = (mu, muJ, phiJ) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/**
 * Expected score (probability of winning) on the display scale, useful for UI.
 * @param {number} rating
 * @param {number} opponentRating
 * @returns {number} 0…1
 */
export function expectedScore(rating, opponentRating) {
  return 1 / (1 + Math.pow(10, -(rating - opponentRating) / 400));
}

/**
 * Approximate K-factor (spec display formula: 32 × (1 − RD/350)).
 * Used purely for showing "how volatile" a rating is in the UI.
 * @param {number} rd
 * @returns {number}
 */
export function getKFactor(rd) {
  return Math.round(32 * (1 - rd / 350));
}

/**
 * Update a player's Glicko-2 rating after one or more games in a period.
 *
 * @param {Glicko} player current { rating, rd, volatility }
 * @param {GameResult[]} results opponents faced this period
 * @returns {Glicko} new { rating, rd, volatility } (rating/rd rounded)
 */
export function updateGlicko2(player, results) {
  const vol = player.volatility ?? RATING_DEFAULTS.volatility;

  // Step 6 special-case: no games → only RD grows.
  if (!results || results.length === 0) {
    const phi = player.rd / SCALE;
    const phiStar = Math.sqrt(phi * phi + vol * vol);
    return {
      rating: Math.round(player.rating),
      rd: Math.round(Math.min(phiStar * SCALE, 350)),
      volatility: vol,
    };
  }

  // Step 2: to Glicko-2 scale.
  const mu = (player.rating - ANCHOR) / SCALE;
  const phi = player.rd / SCALE;

  // Step 3 & 4: variance (v) and estimated improvement (delta sum).
  let vInv = 0;
  let deltaSum = 0;
  for (const r of results) {
    const muJ = (r.rating - ANCHOR) / SCALE;
    const phiJ = r.rd / SCALE;
    const eVal = E(mu, muJ, phiJ);
    const gVal = g(phiJ);
    vInv += gVal * gVal * eVal * (1 - eVal);
    deltaSum += gVal * (r.score - eVal);
  }
  const v = 1 / vInv;
  const delta = v * deltaSum;

  // Step 5: new volatility via Illinois algorithm.
  const a = Math.log(vol * vol);
  const f = (x) => {
    const ex = Math.exp(x);
    const num = ex * (delta * delta - phi * phi - v - ex);
    const den = 2 * Math.pow(phi * phi + v + ex, 2);
    return num / den - (x - a) / (TAU * TAU);
  };

  let A = a;
  let B;
  const d2 = delta * delta;
  if (d2 > phi * phi + v) {
    B = Math.log(d2 - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k += 1;
    B = a - k * TAU;
  }
  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA /= 2;
    }
    B = C;
    fB = fC;
  }
  const newVol = Math.exp(A / 2);

  // Step 6 & 7: pre-rating-period RD then new RD.
  const phiStar = Math.sqrt(phi * phi + newVol * newVol);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);

  // Step 8: new rating (μ').
  const newMu = mu + newPhi * newPhi * deltaSum;

  return {
    rating: Math.round(newMu * SCALE + ANCHOR),
    rd: Math.round(Math.max(30, Math.min(newPhi * SCALE, 350))),
    volatility: Number(newVol.toFixed(6)),
  };
}

/**
 * Convenience wrapper for a single game.
 * @param {Glicko} player
 * @param {{ rating: number, rd: number }} opponent
 * @param {number} score 1 win / 0.5 draw / 0 loss
 * @returns {Glicko}
 */
export function updateRatingForGame(player, opponent, score) {
  return updateGlicko2(player, [{ rating: opponent.rating, rd: opponent.rd, score }]);
}

/**
 * Spec-compatibility shim: returns only the new integer rating.
 * Implemented on top of the full Glicko-2 update so callers relying on the
 * original `calculateNewRating(...)` signature keep working.
 *
 * @param {number} oldRating
 * @param {number} rd
 * @param {number} result 1 / 0.5 / 0
 * @param {number} opponentRating
 * @param {number} [opponentRd]
 * @returns {number}
 */
export function calculateNewRating(oldRating, rd, result, opponentRating, opponentRd = 350) {
  const next = updateRatingForGame(
    { rating: oldRating, rd, volatility: RATING_DEFAULTS.volatility },
    { rating: opponentRating, rd: opponentRd },
    result,
  );
  return next.rating;
}
