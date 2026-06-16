/**
 * @file Komutan store — holds the current narrator line for the widget and
 * drives Text-to-Speech. Uses the browser Web Speech API now (zero-dependency,
 * Modern Turkish); swap `speakViaTTS` for ElevenLabs streaming later.
 */

import { create } from 'zustand';
import { komutanLine } from '../data/komutanScripts.js';
import { useSettingsStore } from './settingsStore.js';
import { logger } from '../utils/logger.js';

/** Speak text with the Web Speech API (Turkish voice when available). */
function speakViaTTS(text) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 1.0;
    u.pitch = 0.9; // slightly lower → authoritative
    const voices = window.speechSynthesis.getVoices();
    const tr = voices.find((v) => v.lang?.toLowerCase().startsWith('tr'));
    if (tr) u.voice = tr;
    window.speechSynthesis.speak(u);
  } catch (err) {
    logger.warn('TTS failed:', err);
  }
}

let seq = 0;

export const useKomutanStore = create((set) => ({
  /** @type {{ id:number, scenario:string, text:string }|null} */
  current: null,

  /**
   * Narrate a scenario: update the widget line and (if enabled) speak it.
   * @param {string} scenario
   * @param {Record<string,string>} [vars]
   * @returns {string} the chosen line
   */
  say(scenario, vars) {
    const text = komutanLine(scenario, vars);
    if (!text) return '';
    set({ current: { id: (seq += 1), scenario, text } });
    if (useSettingsStore.getState().komutanVoice) speakViaTTS(text);
    return text;
  },

  /** Stop any in-progress speech. */
  silence() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
}));

/** Imperative helper for non-component code. */
export const komutan = {
  say: (scenario, vars) => useKomutanStore.getState().say(scenario, vars),
  silence: () => useKomutanStore.getState().silence(),
};

export default useKomutanStore;
