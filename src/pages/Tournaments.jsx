/**
 * @file Tournaments page — lists the four standing tournaments and runs an
 * active one (Arena Swiss / Knockout / Ladder) with a live leaderboard, the
 * user's per-round game (real, on the board), simulated opponents, spectate
 * broadcasts and end-of-event trophies.
 */

import { useState } from 'react';
import { useTournamentStore } from '../store/tournamentStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { TOURNAMENTS, TYPE_LABEL } from '../data/tournaments.js';
import { TIME_CONTROLS } from '../utils/constants.js';
import { simulateGameResult } from '../utils/tournamentEngine.js';
import LiveLeaderboard from '../components/LiveLeaderboard.jsx';
import TournamentGame from '../components/TournamentGame.jsx';
import SpectateGame from '../components/SpectateGame.jsx';
import { storageService } from '../services/storageService.js';

export default function Tournaments() {
  const { user } = useAuth();
  const store = useTournamentStore();
  const [subView, setSubView] = useState(null); // 'playing' | null
  const [spectate, setSpectate] = useState(null);

  const active = !!store.tournament;
  const isLadder = store.format === 'ladder';

  // ── No active tournament → list + trophy case ────────────────────────────
  if (!active) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold text-white">Turnuvalar</h1>
          <p className="mt-1 text-timur-300">
            Arena, Ladder ve Eleme turnuvalarında 50 komutana karşı şanını dene.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOURNAMENTS.map((t) => {
            const tc = TIME_CONTROLS[t.timeControl];
            return (
              <div key={t.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-xl font-bold text-white">{t.name}</h3>
                  <span className="rounded-full bg-timur-700/60 px-2.5 py-1 text-xs text-gold-300">
                    {TYPE_LABEL[t.type]}
                  </span>
                </div>
                <p className="mt-1 flex-1 text-sm text-timur-300">{t.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-timur-400">
                  <span>{tc ? `${tc.icon} ${tc.name}` : t.timeControl}</span>
                  <span>{t.schedule}</span>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={() => {
                    store.join(t, user);
                    setSubView(null);
                  }}
                >
                  Katıl
                </button>
              </div>
            );
          })}
        </div>

        <TrophyCase />
      </div>
    );
  }

  // ── Playing the user's game ──────────────────────────────────────────────
  if (subView === 'playing' && store.userPairing?.opp) {
    return (
      <TournamentGame
        commander={store.userPairing.opp}
        timeControl={store.tournament.timeControl}
        onComplete={(score) => {
          setSubView(null);
          if (isLadder) store.reportLadderResult(score);
          else store.reportUserResult(score);
        }}
      />
    );
  }

  const rows = store.leaderboard();
  const broadcastPairs = (store.roundPairings || [])
    .filter((p) => p.b && p.a.id !== store.youId && p.b.id !== store.youId && p.a.isBot && p.b.isBot)
    .slice(0, 3);

  // ── Active tournament dashboard ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{store.tournament.name}</h1>
          <p className="text-sm text-timur-300">
            {TYPE_LABEL[store.tournament.type]} ·{' '}
            {isLadder
              ? `Ladder puanın: ${store.ladderRating}`
              : `Tur ${store.round}/${store.totalRounds}`}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (isLadder && store.status !== 'finished') store.leaveLadder();
            store.reset();
            setSubView(null);
          }}
        >
          Turnuvadan Ayrıl
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <LiveLeaderboard rows={rows} youId={store.youId} ladder={isLadder} />

        <div className="space-y-4">
          {/* Finished */}
          {store.status === 'finished' && store.award && (
            <div className="card p-6 text-center">
              <div className="text-5xl">{store.award.medal}</div>
              <h2 className="mt-2 font-display text-2xl font-bold text-gold-300">{store.award.label}</h2>
              <p className="mt-1 text-timur-200">
                {store.tournament.name} · Sıralaman: <b>{store.userRank}.</b>
              </p>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => {
                  store.reset();
                  setSubView(null);
                }}
              >
                Turnuvalara Dön
              </button>
            </div>
          )}

          {/* Your pairing / next action */}
          {store.status === 'awaiting_user_game' && store.userPairing?.opp && (
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-timur-400">
                {isLadder ? 'Sıradaki rakip' : `Tur ${store.round} eşleşmen`}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {store.userPairing.opp.name}{' '}
                <span className="text-sm text-gold-300">({store.userPairing.opp.rating})</span>
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-primary flex-1" onClick={() => setSubView('playing')}>
                  ⚔️ Maça Başla
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => {
                    if (isLadder) {
                      store.reportLadderResult(
                        simulateGameResult({ rating: store.ladderRating }, store.userPairing.opp),
                      );
                    } else {
                      store.autoPlayUser();
                    }
                  }}
                >
                  Otomatik Oyna
                </button>
              </div>
            </div>
          )}

          {/* Between rounds */}
          {store.status === 'active' && !isLadder && (
            <div className="card p-5 text-center">
              <p className="text-timur-200">Tur {store.round} tamamlandı.</p>
              <button type="button" className="btn-primary mt-3" onClick={() => store.startRound()}>
                Sonraki Tur →
              </button>
            </div>
          )}
          {store.status === 'active' && isLadder && (
            <div className="card p-5 text-center">
              <p className="text-timur-200">Hazır olduğunda bir sonraki rakibe meydan oku.</p>
              <button type="button" className="btn-primary mt-3" onClick={() => store.ladderNext()}>
                Sıradaki Rakip →
              </button>
              {store.log.length > 0 && (
                <ul className="mt-3 space-y-1 text-left text-xs text-timur-300">
                  {store.log.map((l, i) => (
                    <li key={i}>• {l}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Broadcast / spectate */}
          {broadcastPairs.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-2 font-display text-lg font-bold text-gold-300">📡 Maç Yayınları</h3>
              <div className="space-y-2">
                {broadcastPairs.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-timur-900/50 px-3 py-2 text-sm">
                    <span className="text-timur-100">
                      {p.a.name} <span className="text-timur-400">vs</span> {p.b.name}
                    </span>
                    <button
                      type="button"
                      className="rounded-md bg-timur-700 px-2 py-1 text-xs font-semibold text-gold-200 hover:bg-timur-600"
                      onClick={() => setSpectate({ white: p.a, black: p.b })}
                    >
                      İzle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {spectate && <SpectateGame white={spectate.white} black={spectate.black} onClose={() => setSpectate(null)} />}
    </div>
  );
}

/** Trophy case: badges earned across tournaments (persisted locally). */
function TrophyCase() {
  const trophies = storageService.getTrophies();
  if (trophies.length === 0) return null;
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-gold-300">Kupa Dolabı</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trophies.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-timur-600/40 bg-timur-900/40 p-3">
            <span className="text-3xl">{t.medal}</span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{t.tournamentName}</div>
              <div className="text-xs text-timur-300">
                {t.label} · {t.placement}.
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
