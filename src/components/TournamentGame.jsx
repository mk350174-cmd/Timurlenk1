/**
 * @file TournamentGame — plays the human's single game for a round vs the paired
 * commander, reusing the shared gameStore + board + bot driver. Calls
 * `onComplete(scoreForUser)` (1/0.5/0) when the game ends.
 *
 * @param {object} props
 * @param {{ name:string, rating:number, difficulty:string }} props.commander
 * @param {string} props.timeControl
 * @param {(score:number)=>void} props.onComplete
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useBotGameDriver } from '../hooks/useBotGameDriver.js';
import { useSettingsStore } from '../store/settingsStore.js';
import BoardView from './BoardView.jsx';
import GameTimer from './GameTimer.jsx';
import MoveInput from './MoveInput.jsx';
import KomutanWidget from './KomutanWidget.jsx';
import { COLOR, PIECE_VISUAL } from '../utils/constants.js';
import { komutan } from '../store/komutanStore.js';
import { sfxService } from '../services/sfxService.js';

export default function TournamentGame({ commander, timeControl, onComplete }) {
  const game = useGameStore();
  const { botThinking } = useBotGameDriver(true);
  const showCoordinates = useSettingsStore((s) => s.showCoordinates);
  const startedRef = useRef(false);
  const reportedRef = useRef(false);

  // Start the game once.
  useEffect(() => {
    if (startedRef.current) return undefined;
    startedRef.current = true;
    useGameStore.getState().newGame({
      mode: 'bot',
      timeControl,
      playerColor: COLOR.WHITE,
      botDifficulty: commander.difficulty,
      botCommander: commander,
    });
    komutan.say('opponentIntro', { name: commander.name });
    return () => useGameStore.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report result on end.
  useEffect(() => {
    if (game.status !== 'ended' || reportedRef.current) return;
    reportedRef.current = true;
    const winner = game.winner;
    const score = winner == null ? 0.5 : winner === COLOR.WHITE ? 1 : 0;
    if (score === 1) {
      komutan.say('victory');
      sfxService.play('win');
    } else if (score === 0) {
      komutan.say('defeat');
      sfxService.play('lose');
    }
    const id = setTimeout(() => onComplete(score), 1100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  const playerActive = game.turn === COLOR.WHITE;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <Strip name={commander.name} rating={commander.rating} time={game.blackTime} active={!playerActive} captured={game.captured[COLOR.WHITE]} thinking={botThinking} />
        <BoardView
          position={game.position}
          selected={game.selected}
          legalTargets={game.legalTargets}
          lastMove={game.lastMove}
          onSquareClick={(sq) => useGameStore.getState().select(sq)}
          whiteBottom
          showCoordinates={showCoordinates}
          interactive={game.status === 'active' && playerActive}
        />
        <Strip name="Sen" rating={game.botCommander ? '—' : ''} time={game.whiteTime} active={playerActive} captured={game.captured[COLOR.BLACK]} you />
      </div>
      <div className="flex flex-col gap-4">
        <KomutanWidget />
        <MoveInput moves={game.moves} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => useGameStore.getState().resign()}
          disabled={game.status !== 'active'}
        >
          Pes Et
        </button>
      </div>
    </div>
  );
}

function Strip({ name, rating, time, active, captured, you, thinking }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-2 ${
        active ? 'border-gold-400/60 bg-timur-800/70' : 'border-timur-600/40 bg-timur-900/50'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-white">{name}</span>
          {you && <span className="rounded bg-timur-700 px-1.5 text-[10px] text-timur-200">SEN</span>}
          {rating !== '' && <span className="text-sm text-gold-300">{rating}</span>}
          {thinking && <span className="animate-pulse text-xs text-timur-300">düşünüyor…</span>}
        </div>
        <div className="h-4 text-sm leading-4 text-timur-300">
          {captured.map((t, i) => (
            <span key={`${t}-${i}`}>{PIECE_VISUAL[t]?.glyph ?? PIECE_VISUAL[t]?.label ?? ''}</span>
          ))}
        </div>
      </div>
      <GameTimer seconds={time} active={active} />
    </div>
  );
}
