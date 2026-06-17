/**
 * @file sfxService — basic sound effects synthesised with the Web Audio API
 * (no asset files needed; spec "Sound effects: Basic"). Gated behind the
 * `sound` preference so it's silent by default. Full immersive audio (Turkish
 * instruments, ambient music) is a later phase.
 */

import { useSettingsStore } from '../store/settingsStore.js';
import { logger } from '../utils/logger.js';

/** @type {AudioContext|null} */
let ctx = null;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Play a short tone. */
function tone({ freq = 440, dur = 0.08, type = 'sine', gain = 0.08, slideTo }) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

const PATTERNS = {
  move: () => tone({ freq: 320, dur: 0.06, type: 'triangle' }),
  capture: () => tone({ freq: 220, dur: 0.12, type: 'sawtooth', slideTo: 140 }),
  select: () => tone({ freq: 520, dur: 0.04, type: 'sine', gain: 0.05 }),
  win: () => {
    tone({ freq: 523, dur: 0.12 });
    setTimeout(() => tone({ freq: 659, dur: 0.12 }), 110);
    setTimeout(() => tone({ freq: 784, dur: 0.18 }), 230);
  },
  lose: () => {
    tone({ freq: 392, dur: 0.16, type: 'triangle' });
    setTimeout(() => tone({ freq: 262, dur: 0.24, type: 'triangle' }), 150);
  },
};

export const sfxService = {
  /**
   * Play a named effect if the `sound` preference is on.
   * @param {'move'|'capture'|'select'|'win'|'lose'} type
   */
  play(type) {
    if (!useSettingsStore.getState().sound) return;
    try {
      PATTERNS[type]?.();
    } catch (err) {
      logger.warn('sfx failed:', err);
    }
  },
};

export default sfxService;
