/**
 * @file CommanderProfile (`/commanders/:slug`) — one reusable Imperial Legacy
 * layout for all 10 historical bots: hero, standardized ELO/PERSONA/PSYCHE
 * chips (with a PSYCHE legend), biography sections, and a "play vs this
 * commander" action that starts a bot game.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { commanderBySlug } from '../data/commanders.js';
import { PERSONA_GROUPS } from '../utils/constants.js';
import Portrait from '../components/Portrait.jsx';

export default function CommanderProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const c = commanderBySlug(slug);

  if (!c) {
    return (
      <div className="theme-imperial -mx-4 -my-6 min-h-[calc(100vh-4rem)] px-4 py-10 text-center">
        <p className="im-headline text-2xl">Komutan bulunamadı.</p>
        <Link to="/commanders" className="im-btn mt-4 inline-flex px-4 py-2">← Galeriye dön</Link>
      </div>
    );
  }

  const persona = PERSONA_GROUPS[c.personaGroup];
  const psyche = typeof c.psyche === 'object' ? c.psyche : { value: c.psyche, label: '' };
  const play = () => navigate('/play', { state: { commander: c } });

  return (
    <div className="theme-imperial -mx-4 -my-6 min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/commanders" className="im-label mb-4 inline-flex hover:underline">← Galeri</Link>

        {/* Hero */}
        <div className="grid gap-6 sm:grid-cols-[280px_minmax(0,1fr)]">
          <div className="im-card overflow-hidden">
            <Portrait src={c.portrait} name={c.name} rounded="" className="aspect-[4/5] w-full" />
          </div>
          <div>
            <p className="im-label">{c.era?.label} · {c.era?.dynasty}</p>
            <h1 className="im-display mt-1 text-4xl sm:text-5xl">{c.name}</h1>
            <p className="mt-1 text-lg italic text-[var(--im-on-variant)]">“{c.epithet ?? c.title}”</p>

            {/* Stat chips */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="ELO" value={c.rating} />
              <Stat label="Persona" value={persona?.name ?? c.personaGroup} hint={persona?.playstyle} />
              <Stat
                label="Psyche"
                value={psyche.value > 0 ? `+${psyche.value}` : psyche.value}
                hint={`${psyche.label || ''} · Ölçek −100…+100 (− içe dönük/savunmacı, + agresif)`}
              />
            </div>

            <button type="button" onClick={play} className="im-btn mt-6 px-5 py-2.5">
              ⚔️ Bu komutanla oyna
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-6">
          {(c.sections ?? []).map((s, i) => (
            <section key={i} className="im-card p-5">
              <h2 className="im-headline text-xl">{s.title}</h2>
              <div className="im-divider my-3" />
              {s.body && <p className="leading-relaxed text-[var(--im-on)]">{s.body}</p>}
              {s.items && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {s.items.map((it, j) => (
                    <div key={j} className="rounded-lg border p-3" style={{ borderColor: 'var(--im-outline)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold" style={{ color: 'var(--im-gold-soft)' }}>{it.title}</span>
                        {it.meta && <span className="im-label">{it.meta}</span>}
                      </div>
                      {it.body && <p className="mt-1 text-sm text-[var(--im-on-variant)]">{it.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="im-card p-3 text-center" title={hint || undefined}>
      <div className="im-label">{label}</div>
      <div className="im-headline mt-1 text-2xl">{value}</div>
    </div>
  );
}
