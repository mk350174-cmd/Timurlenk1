/**
 * @file TalimAlani — the 8-level puzzle training ground. Shows level cards with
 * completion %, and hands off to <PuzzleLevel/> when a level is opened.
 */

import { useState, useCallback } from 'react';
import PuzzleLevel from '../components/PuzzleLevel.jsx';
import { LEVELS, PUZZLES_PER_LEVEL } from '../data/puzzles.js';
import { storageService } from '../services/storageService.js';

export default function TalimAlani() {
  const [activeLevel, setActiveLevel] = useState(null);
  // Bump to re-read progress after returning from a level.
  const [, setRefresh] = useState(0);

  const progress = storageService.getTalimProgress();

  const exitLevel = useCallback(() => {
    setActiveLevel(null);
    setRefresh((n) => n + 1);
  }, []);

  if (activeLevel) {
    return <PuzzleLevel level={activeLevel} onExit={exitLevel} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Talim Alanı</h1>
        <p className="mt-1 text-timur-300">
          Er'den Timurlenk'e — 8 seviye, her birinde {PUZZLES_PER_LEVEL} bulmaca. Şah'ı tek
          hamlede alarak ustalaş.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map((lvl) => {
          const done = progress[lvl.level]?.completed?.length ?? 0;
          const pct = Math.round((done / PUZZLES_PER_LEVEL) * 100);
          const complete = done >= PUZZLES_PER_LEVEL;
          return (
            <button
              key={lvl.level}
              type="button"
              onClick={() => setActiveLevel(lvl.level)}
              className={`card p-5 text-left transition hover:border-gold-500/50 ${
                complete ? 'border-gold-500/60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-timur-700 font-bold text-gold-300">
                  {lvl.level}
                </span>
                {lvl.finalBoss && <span title="Final" className="text-xl">👑</span>}
                {complete && <span title="Tamamlandı" className="text-xl">✅</span>}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-white">{lvl.name}</h3>
              <p className="text-xs text-timur-300">{lvl.difficulty}</p>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-timur-400">
                  <span>{done}/{PUZZLES_PER_LEVEL}</span>
                  <span>+{lvl.bonus} GP</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-timur-700">
                  <div className="h-full bg-gold-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <span className="mt-4 inline-block text-sm font-semibold text-gold-300">
                {done > 0 ? 'Devam Et →' : 'Başla →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
