/**
 * @file useBotGameDriver — drives a vs-bot game running in the shared gameStore:
 * ticks the clock, asks engineService for the bot's reply on its turn, and
 * plays move/capture sound effects. Used by the tournament game (and mirrors
 * the inline logic in OnlineGame so both behave identically).
 *
 * @param {boolean} enabled whether the driver is active (e.g. board is shown)
 * @returns {{ botThinking: boolean }}
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { engineService } from '../services/engineService.js';
import { sfxService } from '../services/sfxService.js';
import { COLOR } from '../utils/constants.js';

export function useBotGameDriver(enabled) {
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.mode);
  const turn = useGameStore((s) => s.turn);
  const moves = useGameStore((s) => s.moves);
  const playerColor = useGameStore((s) => s.playerColor);
  const botDifficulty = useGameStore((s) => s.botDifficulty);

  const [botThinking, setBotThinking] = useState(false);
  const prevLen = useRef(0);
  const botColor = playerColor === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;

  // Make sure the engine (WASM motor or JS fallback) is initialised.
  useEffect(() => {
    engineService.init();
  }, []);

  // Clock.
  useEffect(() => {
    if (!enabled || status !== 'active') return undefined;
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, [enabled, status]);

  // Bot reply on its turn.
  useEffect(() => {
    if (!enabled || mode !== 'bot' || status !== 'active' || turn !== botColor) return undefined;
    let cancelled = false;
    setBotThinking(true);
    engineService
      .getBotMove(useGameStore.getState().position, { difficulty: botDifficulty, color: botColor })
      .then((mv) => {
        if (cancelled) return;
        setBotThinking(false);
        if (mv) useGameStore.getState().makeMove(mv.from, mv.to);
        else useGameStore.getState().finish(playerColor);
      });
    return () => {
      cancelled = true;
      setBotThinking(false);
    };
  }, [enabled, mode, status, turn, botColor, botDifficulty, moves.length, playerColor]);

  // Sound on each new move.
  useEffect(() => {
    if (moves.length > prevLen.current && moves.length > 0) {
      const last = moves[moves.length - 1];
      sfxService.play(last.captured ? 'capture' : 'move');
    }
    prevLen.current = moves.length;
  }, [moves]);

  return { botThinking };
}

export default useBotGameDriver;
