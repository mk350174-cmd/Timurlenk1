/**
 * @file GameHistory — last 20 games for a user with result and time control.
 * Loads from gameService (cloud) or LocalStorage (offline) transparently.
 *
 * @param {object} props
 * @param {string} props.userId
 */

import { useEffect, useState } from 'react';
import { gameService } from '../services/gameService.js';
import { RESULT, TIME_CONTROLS } from '../utils/constants.js';

const RESULT_LABEL = {
  [RESULT.PLAYER1_WIN]: { text: 'Beyaz kazandı', cls: 'text-emerald-300' },
  [RESULT.PLAYER2_WIN]: { text: 'Siyah kazandı', cls: 'text-rose-300' },
  [RESULT.DRAW]: { text: 'Berabere', cls: 'text-timur-200' },
  [RESULT.ABANDONED]: { text: 'Terk', cls: 'text-amber-300' },
};

export default function GameHistory({ userId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    gameService
      .getGameHistory(userId, 20)
      .then((data) => active && setGames(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) return <p className="text-timur-300">Yükleniyor…</p>;
  if (games.length === 0) return <p className="text-timur-300">Henüz oyun geçmişi yok.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-timur-600/40 text-left text-xs uppercase tracking-wide text-timur-400">
            <th className="py-2 pr-2">Tarih</th>
            <th className="py-2 pr-2">Süre Kontrolü</th>
            <th className="py-2 pr-2">Sonuç</th>
            <th className="py-2 pr-2">Hamle</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const r = RESULT_LABEL[g.result] ?? RESULT_LABEL[RESULT.DRAW];
            const tc = TIME_CONTROLS[g.time_control];
            const moveCount = Array.isArray(g.moves_json)
              ? g.moves_json.length
              : Array.isArray(g.moves)
                ? g.moves.length
                : 0;
            return (
              <tr key={g.id} className="border-b border-timur-700/30">
                <td className="py-2 pr-2 text-timur-200">
                  {new Date(g.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td className="py-2 pr-2 text-timur-200">
                  {tc ? `${tc.icon} ${tc.name}` : g.time_control}
                </td>
                <td className={`py-2 pr-2 font-semibold ${r.cls}`}>{r.text}</td>
                <td className="py-2 pr-2 text-timur-300">{moveCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
