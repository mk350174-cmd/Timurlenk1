/**
 * @file CommanderCard — the Imperial Legacy gallery card (faithful port of the
 * Stitch `n1` card): full-bleed portrait, dark gradient, and a glass panel with
 * the name, title and ELO chip. Links to the commander's profile.
 *
 * @param {object} props
 * @param {import('../../data/commanders.js').Commander} props.commander
 */

import { Link } from 'react-router-dom';
import Portrait from '../Portrait.jsx';

export default function CommanderCard({ commander }) {
  const featured = commander.featured;
  return (
    <Link
      to={`/commanders/${commander.slug}`}
      className={`group relative block overflow-hidden rounded-xl im-card transition-transform duration-500 hover:-translate-y-2 ${
        featured ? 'sm:col-span-2 sm:row-span-2 aspect-[4/5] sm:aspect-auto' : 'aspect-square'
      }`}
    >
      {/* Portrait fill */}
      <Portrait src={commander.portrait} name={commander.name} fill rounded="" className="transition-transform duration-700 ease-out group-hover:scale-110" />
      {/* Gradient for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-75" />
      {/* Glass panel */}
      <div className="absolute bottom-0 left-0 w-full border-t border-white/10 p-4 backdrop-blur-md sm:p-6" style={{ background: 'rgba(46,41,39,0.32)' }}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className={`im-headline truncate drop-shadow ${featured ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
              {commander.name}
            </h3>
            <p className="im-label mt-0.5 truncate">{commander.title}</p>
          </div>
          <span className="im-chip shrink-0">ELO {commander.rating}</span>
        </div>
      </div>
    </Link>
  );
}
