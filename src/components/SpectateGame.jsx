/**
 * @file SpectateGame — read-only "broadcast" of a game between two commanders.
 * The engine plays both sides automatically (~900ms/move) on a non-interactive
 * board, with the spec's 2-second broadcast-delay nod. Used by the tournament
 * page's game broadcast / spectate feature.
 *
 * @param {object} props
 * @param {{name:string,rating:number,difficulty:string}} props.white
 * @param {{name:string,rating:number,difficulty:string}} props.black
 * @param {()=>void} props.onClose
 */

import { useEffect, useRef, useState } from 'react';
import BoardView from './BoardView.jsx';
import { createInitialPosition, applyMove } from '../utils/board.js';
import { getGameStatus } from '../utils/moves.js';
import { engineService } from '../services/engineService.js';
import { COLOR } from '../utils/constants.js';

const MAX_PLIES = 80;

export default function SpectateGame({ white, black, onClose }) {
  const [position, setPosition] = useState(() => createInitialPosition());
  const [lastMove, setLastMove] = useState(null);
  const [turn, setTurn] = useState(COLOR.WHITE);
  const [status, setStatus] = useState('Yayın başlıyor…');
  const stateRef = useRef({ position: null, turn: COLOR.WHITE, plies: 0, stopped: false });

  useEffect(() => {
    stateRef.current = { position: createInitialPosition(), turn: COLOR.WHITE, plies: 0, stopped: false };
    engineService.init();
    let timer;

    const step = async () => {
      if (stateRef.current.stopped) return;
      const s = stateRef.current;
      const side = s.turn;
      const player = side === COLOR.WHITE ? white : black;
      const mv = await engineService.getBotMove(s.position, { difficulty: player.difficulty, color: side });
      if (stateRef.current.stopped) return;
      if (!mv) {
        setStatus('Oyun bitti.');
        return;
      }
      const { position: next } = applyMove(s.position, mv);
      s.position = next;
      s.turn = side === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
      s.plies += 1;
      setPosition(next);
      setLastMove({ from: mv.from, to: mv.to });
      setTurn(s.turn);
      const result = getGameStatus(next);
      if (result.over) {
        setStatus(result.winner === COLOR.WHITE ? `${white.name} kazandı` : `${black.name} kazandı`);
        return;
      }
      if (s.plies >= MAX_PLIES) {
        setStatus('Yayın özeti tamamlandı.');
        return;
      }
      setStatus('Canlı yayın (2 sn gecikmeli)');
      timer = setTimeout(step, 900);
    };

    timer = setTimeout(step, 800);
    return () => {
      stateRef.current.stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-2xl animate-pop p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-gold-300">📡 Maç Yayını</h3>
            <p className="text-sm text-timur-200">
              {white.name} ({white.rating}) — {black.name} ({black.rating})
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        <BoardView
          position={position}
          lastMove={lastMove}
          legalTargets={[]}
          selected={null}
          onSquareClick={() => {}}
          interactive={false}
          showCoordinates={false}
        />
        <p className="mt-2 text-center text-sm text-timur-300">
          {status} · Sıra: {turn === COLOR.WHITE ? white.name : black.name}
        </p>
      </div>
    </div>
  );
}
