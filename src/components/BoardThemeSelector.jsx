/**
 * @file BoardThemeSelector — pick one of the 5 board themes. Persists via the
 * settings store (`boardTheme`) and is applied by the board renderers. Theme
 * previews use the S3 texture when available, otherwise an accent-colour swatch.
 *
 * @param {object} props
 * @param {boolean} [props.compact]
 */

import { useState } from 'react';
import { BOARD_THEMES, boardTextureUrl } from '../data/boardThemes.js';
import { useSettingsStore } from '../store/settingsStore.js';

export default function BoardThemeSelector({ compact = false }) {
  const boardTheme = useSettingsStore((s) => s.boardTheme);
  const update = useSettingsStore((s) => s.update);

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
      {BOARD_THEMES.map((theme) => {
        const active = boardTheme === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => update({ boardTheme: theme.id })}
            aria-pressed={active}
            className={`relative overflow-hidden rounded-xl border-2 bg-timur-900/50 text-left transition ${
              active ? 'ring-2 ring-offset-2 ring-offset-timur-900' : 'opacity-90 hover:opacity-100'
            }`}
            style={{ borderColor: active ? theme.accentColor : 'transparent' }}
          >
            <ThemePreview theme={theme} />
            <div className="p-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                <span className="truncate text-sm font-semibold text-white">{theme.title}</span>
              </div>
              {!compact && <p className="mt-0.5 text-[11px] text-timur-300">{theme.subtitle}</p>}
            </div>
            {active && (
              <span
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-timur-950"
                style={{ backgroundColor: theme.accentColor }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Texture thumbnail with an accent-gradient fallback when no S3 image. */
function ThemePreview({ theme }) {
  const url = boardTextureUrl(theme.id);
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      <div className="aspect-[11/10] w-full bg-timur-800">
        <img
          src={url}
          alt={`${theme.title} tahta önizleme`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className="aspect-[11/10] w-full"
      style={{ background: `linear-gradient(135deg, ${theme.accentColor}, #16110d 80%)` }}
      aria-hidden
    />
  );
}
