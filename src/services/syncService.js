/**
 * @file Offline → online sync with auto cheat detection (spec PHASE 9).
 *
 * When connectivity returns, recorded offline games are validated and uploaded.
 * A heuristic suspicion score flags improbable games for manual review instead
 * of silently rejecting them — mirroring the spec's "manual review queue".
 */

import { storageService } from './storageService.js';
import { gameService } from './gameService.js';
import { logger } from '../utils/logger.js';

/** Suspicion score at/above which a game is flagged for manual review. */
export const SUSPICION_THRESHOLD = 80;

/**
 * Heuristic cheat detection on a recorded offline game.
 * @param {object} game offline game record { moves, durationMs, ratingJump, ... }
 * @returns {{ score: number, reasons: string[], flagged: boolean }}
 */
export function detectCheating(game) {
  let score = 0;
  const reasons = [];

  const moveCount = game.moves?.length ?? 0;
  const durationMs = game.endTime && game.startTime
    ? new Date(game.endTime).getTime() - new Date(game.startTime).getTime()
    : 0;
  const avgMoveSec = moveCount > 0 && durationMs > 0 ? durationMs / 1000 / moveCount : Infinity;

  if (avgMoveSec < 0.5) {
    score += 30; // implausibly fast
    reasons.push('Hamle başına süre çok düşük (<0.5s)');
  }
  if ((game.bestMovePercentage ?? 0) > 0.95) {
    score += 40; // engine-perfect
    reasons.push('Hamlelerin %95+ı kusursuz');
  }
  if (Math.abs(game.ratingJump ?? 0) > 300) {
    score += 25; // inconsistent result vs rating
    reasons.push('Beklenmeyen puan sıçraması (>300)');
  }
  if ((game.openingQuality ?? 1) < 0.3 && game.endgamePerfect) {
    score += 20; // weak opening but flawless endgame
    reasons.push('Zayıf açılış / kusursuz oyun sonu çelişkisi');
  }

  return { score, reasons, flagged: score >= SUSPICION_THRESHOLD };
}

/**
 * Sync every unsynced offline game.
 * @param {(progress: { done: number, total: number, current?: object }) => void} [onProgress]
 * @returns {Promise<{ synced: number, flagged: number, failed: number }>}
 */
export async function syncAllOfflineGames(onProgress) {
  const pending = storageService.getUnsyncedGames();
  let synced = 0;
  let flagged = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += 1) {
    const game = pending[i];
    onProgress?.({ done: i, total: pending.length, current: game });

    const verdict = detectCheating(game);
    if (verdict.flagged) {
      flagged += 1;
      logger.warn(`Game ${game.id} flagged for review (score ${verdict.score})`, verdict.reasons);
      // Still uploaded, but tagged for manual review by the server.
      game.flagged = true;
      game.suspicionReasons = verdict.reasons;
    }

    const res = await gameService.syncOfflineGame(game);
    if (res.ok) synced += 1;
    else failed += 1;
  }

  onProgress?.({ done: pending.length, total: pending.length });
  return { synced, flagged, failed };
}

export default { detectCheating, syncAllOfflineGames, SUSPICION_THRESHOLD };
