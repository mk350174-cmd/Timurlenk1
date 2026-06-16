/**
 * @file GameTimer — shows a player's remaining clock as MM:SS, turning red
 * under one minute. The countdown itself is driven by the game store's `tick`
 * (see OnlineGame), so this component is purely presentational.
 *
 * @param {object} props
 * @param {number} props.seconds remaining seconds
 * @param {boolean} props.active whether it is this player's turn
 */
export default function GameTimer({ seconds, active }) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  const low = seconds < 60;

  return (
    <div
      className={`flex items-center justify-center rounded-lg px-4 py-2 font-mono text-2xl font-bold tabular-nums transition-colors ${
        active
          ? low
            ? 'bg-rose-600 text-white'
            : 'bg-gold-500 text-timur-950'
          : 'bg-timur-900/70 text-timur-200'
      }`}
    >
      {m}:{String(s).padStart(2, '0')}
    </div>
  );
}
