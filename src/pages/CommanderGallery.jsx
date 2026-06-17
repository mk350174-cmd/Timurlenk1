/**
 * @file CommanderGallery (`/commanders`) — the bot-commander browser. A category
 * toggle switches between the **Tarihî** (Imperial Legacy) gallery of the 10
 * historical bots and the **Mitolojik** (Mythic Tamer) character select of the
 * 40 persona bots. The historical grid supports dynasty filtering + ELO sort and
 * highlights the featured commander as a 2×2 card.
 */

import { useMemo, useState } from 'react';
import { byCategory } from '../data/commanders.js';
import CommanderCard from '../components/commanders/CommanderCard.jsx';
import CharacterSelect from '../components/CharacterSelect.jsx';

export default function CommanderGallery() {
  const [category, setCategory] = useState('historical');
  const [dynasty, setDynasty] = useState('all');
  const [sortDesc, setSortDesc] = useState(true);

  const historical = useMemo(() => byCategory('historical'), []);
  const dynasties = useMemo(
    () => ['all', ...new Set(historical.map((c) => c.era?.dynasty).filter(Boolean))],
    [historical],
  );
  const shown = useMemo(() => {
    const list = historical.filter((c) => dynasty === 'all' || c.era?.dynasty === dynasty);
    return [...list].sort((a, b) => (sortDesc ? b.rating - a.rating : a.rating - b.rating));
  }, [historical, dynasty, sortDesc]);

  return (
    <div className="theme-imperial -mx-4 -my-6 min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-8">
      {/* Top strip */}
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <span className="text-2xl" style={{ color: 'var(--im-gold-soft)' }} aria-hidden>⯨</span>
        <span className="im-headline tracking-[0.3em] text-sm">TIMURLENK v1.1</span>
        <span className="text-xl opacity-60" aria-hidden>⚙</span>
      </div>

      <header className="mx-auto mb-6 max-w-6xl">
        <h1 className="im-display text-3xl sm:text-5xl">Imperial Commanders</h1>
        <p className="mt-2 max-w-2xl text-[var(--im-on-variant)]">
          Tarihin arşivlerinde saklanan en seçkin komutanlar. Birini seç ve ona karşı oyna.
        </p>
      </header>

      {/* Category toggle */}
      <div className="mx-auto mb-6 flex max-w-6xl gap-2">
        {[
          { id: 'historical', label: 'Tarihî' },
          { id: 'mythological', label: 'Mitolojik' },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className="im-btn px-4 py-2 text-sm"
            style={category === c.id ? undefined : { background: 'transparent', color: 'var(--im-on-variant)' }}
            aria-pressed={category === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>

      {category === 'historical' ? (
        <div className="mx-auto max-w-6xl">
          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {dynasties.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDynasty(d)}
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  borderColor: 'var(--im-outline)',
                  color: dynasty === d ? 'var(--im-gold-soft)' : 'var(--im-on-variant)',
                  background: dynasty === d ? 'rgba(146,7,3,0.5)' : 'transparent',
                }}
              >
                {d === 'all' ? 'Tüm hanedanlar' : d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSortDesc((v) => !v)}
              className="ml-auto rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: 'var(--im-outline)', color: 'var(--im-on-variant)' }}
            >
              ELO {sortDesc ? '↓' : '↑'}
            </button>
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((c) => (
              <CommanderCard key={c.id} commander={c} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl">
          <CharacterSelect embedded />
        </div>
      )}
    </div>
  );
}
