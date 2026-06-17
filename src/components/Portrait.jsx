/**
 * @file Portrait — renders a commander/bot portrait from its S3 key, falling
 * back to a styled initial when the asset base is unset or the image fails.
 *
 * @param {object} props
 * @param {string} props.src S3 asset key (e.g. "commanders/fatih.webp")
 * @param {string} props.name for alt text + initial fallback
 * @param {string} [props.className] sizing/extra classes
 * @param {string} [props.rounded] rounding class (default rounded-xl)
 * @param {boolean} [props.fill] absolutely fill the parent (for card backgrounds)
 */

import { useState } from 'react';
import { assetUrl } from '../utils/assets.js';

export default function Portrait({ src, name, className = '', rounded = 'rounded-xl', fill = false }) {
  const url = assetUrl(src);
  const [failed, setFailed] = useState(false);
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  const base = fill ? 'absolute inset-0 h-full w-full' : '';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`object-cover ${rounded} ${base} ${className}`}
      />
    );
  }
  return (
    <div
      aria-label={name}
      role="img"
      className={`flex items-center justify-center bg-gradient-to-br from-gold-600/40 to-brown-900/70 font-display font-bold text-gold-200 ${rounded} ${base} ${className}`}
    >
      <span className="text-[2em] leading-none">{initial}</span>
    </div>
  );
}
