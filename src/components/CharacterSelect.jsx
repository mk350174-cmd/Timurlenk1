/**
 * @file CharacterSelect — the Mythic Tamer faction character picker for the 40
 * mythological bots. Six faction tabs (persona groups), a card grid (portrait
 * 60% + glass stat panel 40% + faction badge), and a "Seç ve Oyna" action that
 * starts a bot game with the chosen commander.
 *
 * @param {object} props
 * @param {boolean} [props.embedded] when shown inside the gallery page
 * @param {(commander:object)=>void} [props.onPick] override default navigation
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mythologicalByGroup } from '../data/commanders.js';
import { PERSONA_GROUPS, PERSONA_ORDER } from '../utils/constants.js';
import Portrait from './Portrait.jsx';

export default function CharacterSelect({ embedded = false, onPick }) {
  const navigate = useNavigate();
  const groups = useMemo(() => mythologicalByGroup(), []);
  const [activeKey, setActiveKey] = useState(PERSONA_ORDER[0]);
  const [selectedId, setSelectedId] = useState(null);

  const activeBots = groups.find((g) => g.group.key === activeKey)?.bots ?? [];
  const selected = activeBots.find((b) => b.id === selectedId) ?? null;
  const accent = PERSONA_GROUPS[activeKey].color;

  const pick = (bot) => {
    if (onPick) return onPick(bot);
    return navigate('/play', { state: { commander: bot } });
  };

  return (
    <div className={`theme-mythic ${embedded ? 'rounded-2xl p-4 sm:p-6' : '-mx-4 -my-6 min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-8'}`}>
      <div className="mx-auto max-w-6xl">
        {!embedded && (
          <header className="mb-6 text-center">
            <h1 className="my-display text-3xl sm:text-5xl">Summon Legend</h1>
            <p className="mt-1 text-[var(--my-on-variant)]">Fraksiyonunu seç, efsaneni çağır.</p>
          </header>
        )}

        {/* Faction tabs */}
        <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {PERSONA_ORDER.map((key) => {
            const g = PERSONA_GROUPS[key];
            const active = key === activeKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveKey(key); setSelectedId(null); }}
                className="my-label pb-1 transition"
                style={{
                  color: active ? g.color : 'var(--my-on-variant)',
                  borderBottom: `2px solid ${active ? g.color : 'transparent'}`,
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>
        <p className="mb-5 text-center text-sm" style={{ color: accent }}>{PERSONA_GROUPS[activeKey].playstyle}</p>

        {/* Character grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {activeBots.map((bot) => {
            const isSel = bot.id === selectedId;
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => setSelectedId(bot.id)}
                className="my-card group relative overflow-hidden text-left transition"
                style={{ boxShadow: isSel ? `0 0 0 2px ${accent}, 0 0 24px ${accent}66` : undefined }}
                aria-pressed={isSel}
              >
                {/* Portrait (top ~60%) */}
                <div className="relative aspect-square w-full overflow-hidden">
                  <Portrait src={bot.portrait} name={bot.name} fill rounded="" className="transition-transform duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to top, rgba(12,19,36,0.95), transparent 55%)` }} />
                  <span
                    className="my-label absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}
                  >
                    {PERSONA_GROUPS[bot.personaGroup].name}
                  </span>
                </div>
                {/* Glass stat panel (~40%) */}
                <div className="my-glass p-2.5">
                  <div className="my-name truncate text-sm text-white">{bot.name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="my-stat text-xs" style={{ color: accent }}>ELO {bot.rating}</span>
                    <span className="my-label text-[10px] text-[var(--my-on-variant)]">
                      Ψ {bot.psyche > 0 ? `+${bot.psyche}` : bot.psyche}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Select CTA */}
        <div className="sticky bottom-4 mt-6 flex justify-center">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && pick(selected)}
            className="my-label rounded px-8 py-3 font-bold text-[#0c1324] shadow-lg transition disabled:opacity-40"
            style={{ background: `linear-gradient(90deg, ${accent}, var(--my-amber))` }}
          >
            {selected ? `Seç ve Oyna · ${selected.name}` : 'Bir komutan seç'}
          </button>
        </div>
      </div>
    </div>
  );
}
