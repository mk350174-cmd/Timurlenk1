/**
 * @file Zustand rating store. Mirrors the signed-in user's per-time-control
 * Glicko-2 ratings for quick reads by the board/profile UI without re-fetching.
 * The authoritative copy lives on the user profile (authStore); this keeps a
 * convenient, reactive snapshot.
 */

import { create } from 'zustand';
import { defaultRatings } from '../services/storageService.js';

export const useRatingStore = create((set) => ({
  /** @type {Record<string, object>} keyed by time control */
  ratings: defaultRatings(),

  /** Replace the full ratings map (e.g. after profile load). */
  setRatings(ratings) {
    set({ ratings: ratings ?? defaultRatings() });
  },

  /**
   * Patch a single time-control rating.
   * @param {string} timeControl
   * @param {object} patch
   */
  updateRating(timeControl, patch) {
    set((state) => ({
      ratings: {
        ...state.ratings,
        [timeControl]: { ...state.ratings[timeControl], ...patch },
      },
    }));
  },

  reset() {
    set({ ratings: defaultRatings() });
  },
}));

export default useRatingStore;
