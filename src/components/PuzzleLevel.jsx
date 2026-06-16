/**
 * @file PuzzleLevel — plays through the 10 puzzles of one Talim Alanı level.
 *
 * Each puzzle asks the player to capture the enemy Şah in a single move. A
 * move onto the king square solves it; any other legal move is a wrong attempt
 * (the board is left untouched so the puzzle can be retried). Completing all 10
 * awards the level's GP bonus once.
 *
 * @param {object} props
 * @param {number} props.level 1…8
 * @param {() => void} props.onExit
 */

import { useEffect, useMemo, useState } from 'react';
import GameBoard from './GameBoard.jsx';
import { PUZZLES, PUZZLES_PER_LEVEL, LEVELS } from '../data/puzzles.js';
import { clonePosition, applyMove } from '../utils/board.js';
import { getLegalMoves } from '../utils/moves.js';
import { storageService } from '../services/storageService.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { toast } from '../store/toastStore.js';

export default function PuzzleLevel({ level, onExit }) {
  const puzzles = PUZZLES[level] ?? [];
  const meta = LEVELS.find((l) => l.level === level);
  const showCoordinates = useSettingsStore((s) => s.showCoordinates);

  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(() => clonePosition(puzzles[0].position));
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [solved, setSolved] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const puzzle = puzzles[index];

  // Load completed set from storage once.
  const initialCompleted = useMemo(() => {
    const progress = storageService.getTalimProgress();
    return new Set(progress[level]?.completed ?? []);
  }, [level]);
  const [completed, setCompleted] = useState(initialCompleted);

  // Reset board state whenever the puzzle changes.
  useEffect(() => {
    setPosition(clonePosition(puzzle.position));
    setSelected(null);
    setLegalTargets([]);
    setSolved(false);
    setLastMove(null);
    setShowHint(false);
    setAttempts(0);
  }, [puzzle]);

  /** Persist progress + award the level bonus when all puzzles are solved. */
  const persist = (nextCompleted) => {
    const progress = storageService.getTalimProgress();
    const prev = progress[level] ?? { completed: [], gp: 0 };
    const fullyDone = nextCompleted.size >= PUZZLES_PER_LEVEL;
    const gp = fullyDone && prev.completed.length < PUZZLES_PER_LEVEL ? (meta?.bonus ?? 0) : prev.gp;
    progress[level] = { completed: [...nextCompleted], gp };
    storageService.setTalimProgress(progress);
    if (fullyDone && prev.completed.length < PUZZLES_PER_LEVEL) {
      toast.success(`🎉 ${meta?.name} seviyesi tamamlandı! +${meta?.bonus} GP`);
    }
  };

  const handleSquareClick = (sq) => {
    if (solved) return;

    // Completing a move?
    if (selected != null && legalTargets.includes(sq)) {
      if (sq === puzzle.solutionSquare) {
        // Correct — apply the capturing move for visual feedback.
        const { position: next } = applyMove(position, { from: selected, to: sq });
        setPosition(next);
        setLastMove({ from: selected, to: sq });
        setSelected(null);
        setLegalTargets([]);
        setSolved(true);
        const nextCompleted = new Set(completed).add(index);
        setCompleted(nextCompleted);
        persist(nextCompleted);
        toast.success('Doğru! Şah alındı. ✅');
      } else {
        setAttempts((a) => a + 1);
        setSelected(null);
        setLegalTargets([]);
        toast.warn('Bu hamle şahı almıyor — tekrar dene.');
      }
      return;
    }

    // Select one of the player's (white) pieces.
    const p = position[sq];
    if (p && p.c === puzzle.turn) {
      setSelected(sq);
      setLegalTargets(getLegalMoves(position, sq));
    } else {
      setSelected(null);
      setLegalTargets([]);
    }
  };

  const goNext = () => setIndex((i) => Math.min(PUZZLES_PER_LEVEL - 1, i + 1));
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  const completionPct = Math.round((completed.size / PUZZLES_PER_LEVEL) * 100);
  const isLast = index === PUZZLES_PER_LEVEL - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <GameBoard
          position={position}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
          showCoordinates={showCoordinates}
          interactive={!solved}
        />
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-gold-300">
              {meta?.name} · Seviye {level}
            </h2>
            <button type="button" className="btn-ghost text-sm" onClick={onExit}>
              ← Seviyeler
            </button>
          </div>
          <p className="text-sm text-timur-300">{meta?.difficulty}</p>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-timur-300">
              <span>İlerleme</span>
              <span>
                {completed.size}/{PUZZLES_PER_LEVEL} ({completionPct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-timur-700">
              <div className="h-full bg-gold-500 transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-timur-400">
            Bulmaca {index + 1}/{PUZZLES_PER_LEVEL}
          </div>
          <p className="mt-1 font-semibold text-white">{puzzle.objective}</p>
          {solved ? (
            <p className="mt-2 rounded-lg bg-emerald-700/40 px-3 py-2 text-sm text-emerald-200">
              ✅ Çözüldü!
            </p>
          ) : (
            <p className="mt-2 text-sm text-timur-300">Beyaz oynar. Deneme: {attempts}</p>
          )}

          {!solved && (
            <button
              type="button"
              className="btn-ghost mt-2 text-sm"
              onClick={() => setShowHint((v) => !v)}
            >
              💡 {showHint ? 'İpucunu gizle' : 'İpucu göster'}
            </button>
          )}
          {showHint && !solved && (
            <p className="mt-1 rounded-lg bg-timur-900/60 px-3 py-2 text-xs text-timur-200">
              {puzzle.hint}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={goPrev} disabled={index === 0}>
              ← Önceki
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={isLast ? onExit : goNext}
            >
              {isLast ? 'Seviyeyi Bitir' : 'Sonraki →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
