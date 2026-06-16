/**
 * @file Zustand settings store for user preferences (board orientation, theme,
 * coordinates, sound). Persisted to LocalStorage so choices survive reloads
 * and are available offline.
 */

import { create } from 'zustand';
import { storageService } from '../services/storageService.js';

const initial = storageService.getPreferences();

export const useSettingsStore = create((set, get) => ({
  ...initial,

  /**
   * Update one or more preferences and persist them.
   * @param {Partial<typeof initial>} patch
   */
  update(patch) {
    set(patch);
    const s = get();
    // Persist only data fields (not the action functions).
    storageService.setPreferences({
      boardTheme: s.boardTheme,
      pieceSet: s.pieceSet,
      showCoordinates: s.showCoordinates,
      whiteBottom: s.whiteBottom,
      sound: s.sound,
      komutanVoice: s.komutanVoice,
    });
  },

  /** Toggle a boolean preference. @param {string} key */
  toggle(key) {
    get().update({ [key]: !get()[key] });
  },
}));

export default useSettingsStore;
