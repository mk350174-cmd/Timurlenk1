/**
 * @file Komutan narrator store. Holds the current line for the widget and plays
 * audio with a three-tier strategy:
 *   1. S3/CloudFront MP3 by line id, when `VITE_VOICE_CDN_URL` is configured
 *      (the 73 ElevenLabs files: `<cdn>/<lineId>.mp3`), cached per session.
 *   2. Web Speech API (browser TTS, Turkish) as the zero-config fallback.
 *   3. Text only (the widget always shows the line).
 * Audio is gated behind the `komutanVoice` preference.
 */

import { create } from 'zustand';
import { pickLine } from '../data/komutanScripts.js';
import { useSettingsStore } from './settingsStore.js';
import { logger } from '../utils/logger.js';

const VOICE_CDN = (import.meta.env ?? {}).VITE_VOICE_CDN_URL?.trim().replace(/\/+$/, '') ?? '';

/** Session cache of <id> → HTMLAudioElement. */
const audioCache = new Map();
let currentAudio = null;

/** Speak via the Web Speech API (Turkish voice when available). */
function speakViaTTS(text) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 1.0;
    u.pitch = 0.9;
    const tr = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('tr'));
    if (tr) u.voice = tr;
    window.speechSynthesis.speak(u);
  } catch (err) {
    logger.warn('TTS failed:', err);
  }
}

/** Play the pre-generated MP3 for a line id, falling back to TTS on error. */
function playMp3(id, fallbackText) {
  try {
    let audio = audioCache.get(id);
    if (!audio) {
      audio = new Audio(`${VOICE_CDN}/${id}.mp3`);
      audioCache.set(id, audio);
    }
    if (currentAudio && currentAudio !== audio) currentAudio.pause();
    currentAudio = audio;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => speakViaTTS(fallbackText));
  } catch (err) {
    logger.warn('voice mp3 failed, using TTS:', err);
    speakViaTTS(fallbackText);
  }
}

let seq = 0;

export const useKomutanStore = create((set) => ({
  /** @type {{ id:number, scenario:string, text:string, lineId:string|null }|null} */
  current: null,

  /**
   * Narrate a scenario: update the widget line and (if enabled) speak it.
   * @param {string} scenario
   * @param {Record<string,string>} [vars]
   * @returns {string} the chosen line text
   */
  say(scenario, vars) {
    const { id: lineId, text } = pickLine(scenario, vars);
    if (!text) return '';
    set({ current: { id: (seq += 1), scenario, text, lineId } });
    if (useSettingsStore.getState().komutanVoice) {
      if (VOICE_CDN && lineId) playMp3(lineId, text);
      else speakViaTTS(text);
    }
    return text;
  },

  /** Stop any in-progress speech/audio. */
  silence() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (currentAudio) currentAudio.pause();
  },
}));

/** Imperative helper for non-component code. */
export const komutan = {
  say: (scenario, vars) => useKomutanStore.getState().say(scenario, vars),
  silence: () => useKomutanStore.getState().silence(),
};

export default useKomutanStore;
