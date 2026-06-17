/**
 * @file RatingDisplay — compact rating chip with an optional +/- delta badge.
 *
 * @param {object} props
 * @param {string} [props.timeControl] time-control key (for the icon/name)
 * @param {number} props.rating
 * @param {number} [props.delta] rating change to show as a badge
 * @param {number} [props.rd] rating deviation (shown as ± when provided)
 * @param {boolean} [props.compact]
 */

import { TIME_CONTROLS } from '../utils/constants.js';

export default function RatingDisplay({ timeControl, rating, delta, rd, compact = false }) {
  const tc = timeControl ? TIME_CONTROLS[timeControl] : null;

  return (
    <div className={`inline-flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
      {tc && (
        <span className="inline-flex items-center gap-1 text-timur-200">
          <span aria-hidden>{tc.icon}</span>
          {!compact && <span className="text-xs uppercase tracking-wide">{tc.name}</span>}
        </span>
      )}
      <span className="font-bold text-gold-300">{Math.round(rating)}</span>
      {typeof rd === 'number' && <span className="text-xs text-timur-400">±{Math.round(rd)}</span>}
      {typeof delta === 'number' && delta !== 0 && (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
            delta > 0 ? 'bg-emerald-700/60 text-emerald-200' : 'bg-rose-700/60 text-rose-200'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      )}
    </div>
  );
}
