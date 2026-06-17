/**
 * @file LiveLeaderboard — tournament standings table with a "canlı" pulse.
 * Works for all formats (swiss/knockout show points; ladder shows rating).
 *
 * @param {object} props
 * @param {{id,name,rating,points?,games?,wins?,rank}[]} props.rows
 * @param {string} props.youId
 * @param {boolean} [props.ladder] show rating column instead of points
 */
export default function LiveLeaderboard({ rows, youId, ladder = false }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-gold-300">Canlı Sıralama</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-300">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" /> canlı
        </span>
      </div>
      <div className="max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-timur-400">
              <th className="py-1 pr-2">#</th>
              <th className="py-1 pr-2">Komutan</th>
              {ladder ? (
                <th className="py-1 pr-2 text-right">Puan</th>
              ) : (
                <>
                  <th className="py-1 pr-2 text-right">P</th>
                  <th className="py-1 pr-2 text-right">O</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isMe = r.id === youId;
              return (
                <tr
                  key={r.id}
                  className={`border-t border-timur-700/30 ${isMe ? 'bg-gold-500/15' : ''}`}
                >
                  <td className="py-1 pr-2 font-bold text-gold-300">{r.rank}</td>
                  <td className="py-1 pr-2 text-white">
                    {isMe ? 'Sen' : r.name}{' '}
                    {!isMe && <span className="text-[10px] text-timur-400">({r.rating})</span>}
                  </td>
                  {ladder ? (
                    <td className="py-1 pr-2 text-right font-semibold text-white">{r.rating}</td>
                  ) : (
                    <>
                      <td className="py-1 pr-2 text-right font-semibold text-white">{r.points}</td>
                      <td className="py-1 pr-2 text-right text-timur-300">{r.games}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
