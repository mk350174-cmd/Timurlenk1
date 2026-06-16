/**
 * @file BoardView — renders the 2D Canvas board or the 3D WebGL board based on
 * the `boardMode` preference, with a small in-corner toggle. The 3D board is
 * lazy-loaded (separate chunk with Three.js) so it never weighs down initial
 * load for 2D users.
 *
 * Accepts the same props as GameBoard and forwards them to whichever renderer
 * is active.
 */

import { Suspense, lazy } from 'react';
import GameBoard from './GameBoard.jsx';
import { useSettingsStore } from '../store/settingsStore.js';

const GameBoard3D = lazy(() => import('./GameBoard3D.jsx'));

export default function BoardView(props) {
  const boardMode = useSettingsStore((s) => s.boardMode);
  const update = useSettingsStore((s) => s.update);
  const is3D = boardMode === '3d';

  return (
    <div className="relative w-full">
      {/* 2D / 3D toggle */}
      <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded-lg border border-timur-600/50 bg-timur-900/80 text-xs backdrop-blur">
        {['2d', '3d'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => update({ boardMode: mode })}
            className={`px-2.5 py-1 font-semibold uppercase transition ${
              boardMode === mode ? 'bg-gold-500 text-timur-950' : 'text-timur-200 hover:bg-timur-700/60'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {is3D ? (
        <Suspense
          fallback={
            <div className="flex aspect-[11/9] w-full items-center justify-center rounded-xl border-4 border-timur-700 bg-timur-900/50 text-timur-300">
              3B tahta yükleniyor…
            </div>
          }
        >
          <GameBoard3D {...props} />
        </Suspense>
      ) : (
        <GameBoard {...props} />
      )}
    </div>
  );
}
