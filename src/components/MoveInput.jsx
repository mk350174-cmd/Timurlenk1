/**
 * @file MoveInput — live move list for the active game, shown as numbered
 * white/black pairs in coordinate notation. (The board itself handles the
 * from→to selection; this panel records what has been played.)
 *
 * @param {object} props
 * @param {import('../utils/board.js').Move[]} props.moves
 */

import { useEffect, useRef } from 'react';
import { moveToNotation } from '../utils/board.js';
import { COLOR } from '../utils/constants.js';

export default function MoveInput({ moves }) {
  const endRef = useRef(null);

  // Auto-scroll to the latest move.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [moves.length]);

  // Group into [white, black] pairs by ply.
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ no: i / 2 + 1, white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className="card flex h-full flex-col p-3">
      <h3 className="mb-2 text-sm font-semibold text-timur-100">Hamleler</h3>
      <div className="max-h-64 flex-1 overflow-y-auto pr-1 text-sm lg:max-h-[28rem]">
        {rows.length === 0 ? (
          <p className="text-timur-300/70">Henüz hamle yapılmadı.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {rows.map((row) => (
                <tr key={row.no} className="odd:bg-timur-900/30">
                  <td className="w-8 py-1 pl-1 text-timur-400">{row.no}.</td>
                  <td className="py-1 font-mono text-timur-50">
                    {row.white ? moveToNotation(row.white) : ''}
                  </td>
                  <td className="py-1 font-mono text-timur-100">
                    {row.black ? moveToNotation(row.black) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={endRef} />
      </div>
      {moves.length > 0 && (
        <p className="mt-2 border-t border-timur-600/30 pt-2 text-xs text-timur-300">
          Sıra: {moves.length % 2 === 0 ? 'Beyaz' : 'Siyah'} · {moves.length} hamle
          {moves.at(-1)?.color === COLOR.WHITE ? '' : ''}
        </p>
      )}
    </div>
  );
}
