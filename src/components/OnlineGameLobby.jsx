/**
 * @file OnlineGameLobby — entry point for starting a game. Three tabs:
 *   1. Hızlı Eşleştirme — pick a time control, play online or vs the bot.
 *   2. Arkadaş Daveti    — generate a shareable invite link.
 *   3. Turnuva           — view scheduled tournaments (full play in v1.1).
 *
 * The lobby only collects intent; the page (OnlineGame) drives matchmaking,
 * the search overlay and the actual game.
 *
 * @param {object} props
 * @param {(cfg: { mode: string, timeControl: string, playerColor?: string }) => void} props.onStart
 * @param {boolean} props.canOnline whether cloud matchmaking is available
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TIME_CONTROLS, TIME_CONTROL_KEYS } from '../utils/constants.js';
import { TOURNAMENTS, TYPE_LABEL } from '../data/tournaments.js';
import { toast } from '../store/toastStore.js';

const TABS = [
  { id: 'quick', label: 'Hızlı Eşleştirme' },
  { id: 'invite', label: 'Arkadaş Daveti' },
  { id: 'tournament', label: 'Turnuva' },
];

/** Bot difficulty options (label + representative ELO for commander matching). */
const DIFFICULTIES = [
  { id: 'easy', label: 'Kolay', elo: 1000 },
  { id: 'medium', label: 'Orta', elo: 1400 },
  { id: 'hard', label: 'Zor', elo: 1800 },
  { id: 'expert', label: 'Uzman', elo: 2200 },
  { id: 'master', label: 'Usta', elo: 2400 },
];

export default function OnlineGameLobby({ onStart, canOnline }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('quick');
  const [timeControl, setTimeControl] = useState('rapid');
  const [difficulty, setDifficulty] = useState('medium');
  const [invite, setInvite] = useState(null);

  const generateInvite = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const link = `${window.location.origin}/play?invite=${code}`;
    setInvite({ code, link });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invite.link);
      toast.success('Davet bağlantısı kopyalandı!');
    } catch {
      toast.warn('Kopyalanamadı — bağlantıyı elle seçin.');
    }
  };

  return (
    <div className="card mx-auto max-w-2xl p-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-timur-900/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-gold-500 text-timur-950' : 'text-timur-200 hover:bg-timur-700/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Quick match */}
      {tab === 'quick' && (
        <div className="space-y-5">
          <div>
            <p className="label">Süre Kontrolü</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIME_CONTROL_KEYS.map((tc) => {
                const info = TIME_CONTROLS[tc];
                const active = timeControl === tc;
                return (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => setTimeControl(tc)}
                    className={`rounded-xl border p-3 text-center transition ${
                      active
                        ? 'border-gold-400 bg-gold-500/15'
                        : 'border-timur-600/40 bg-timur-900/40 hover:border-timur-500'
                    }`}
                  >
                    <div className="text-2xl">{info.icon}</div>
                    <div className="text-sm font-semibold text-white">{info.name}</div>
                    <div className="text-xs text-timur-300">
                      {Math.floor(info.initial / 60)}+{info.increment}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="label">Bot Zorluğu</p>
            <div className="grid grid-cols-5 gap-2">
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition ${
                      active
                        ? 'border-gold-400 bg-gold-500/15 text-white'
                        : 'border-timur-600/40 bg-timur-900/40 text-timur-200 hover:border-timur-500'
                    }`}
                    title={`~${d.elo} ELO`}
                  >
                    {d.label}
                    <span className="mt-0.5 block text-[10px] font-normal text-timur-400">{d.elo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!canOnline}
              onClick={() => onStart({ mode: 'online', timeControl, playerColor: 'w' })}
              title={canOnline ? '' : 'Çevrimiçi mod için Supabase yapılandırması gerekir'}
            >
              Çevrimiçi Eşleştir
            </button>
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() =>
                onStart({ mode: 'bot', timeControl, difficulty, elo: DIFFICULTIES.find((d) => d.id === difficulty)?.elo, playerColor: 'w' })
              }
            >
              🤖 Komutan'a Karşı Oyna
            </button>
          </div>
          {!canOnline && (
            <p className="text-center text-xs text-timur-300">
              Çevrimiçi eşleştirme şu an kapalı (yerel mod). Bota karşı oynayabilir veya
              Supabase anahtarlarını ekleyebilirsiniz.
            </p>
          )}
        </div>
      )}

      {/* Invite */}
      {tab === 'invite' && (
        <div className="space-y-4 text-center">
          <p className="text-timur-200">Bir arkadaşınızı oyuna davet edin.</p>
          {!invite ? (
            <button type="button" className="btn-primary" onClick={generateInvite}>
              Davet Bağlantısı Oluştur
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-timur-900/60 p-4">
                <div className="text-xs uppercase text-timur-400">Davet Kodu</div>
                <div className="font-mono text-2xl font-bold tracking-widest text-gold-300">
                  {invite.code}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input className="input flex-1 text-xs" readOnly value={invite.link} />
                <button type="button" className="btn-secondary" onClick={copyLink}>
                  Kopyala
                </button>
              </div>
              <p className="text-xs text-timur-400">
                Bağlantı 5 dakika geçerlidir. (Davet kabulü çevrimiçi modda etkindir.)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tournaments */}
      {tab === 'tournament' && (
        <div className="space-y-3">
          {TOURNAMENTS.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-timur-600/40 bg-timur-900/40 p-4"
            >
              <div>
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-xs text-timur-300">
                  {TYPE_LABEL[t.type] ?? t.type} · {t.schedule}
                </div>
              </div>
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => navigate('/tournaments')}
              >
                Katıl
              </button>
            </div>
          ))}
          <p className="text-center text-xs text-timur-400">
            Arena (Swiss), Ladder ve Eleme turnuvaları artık oynanabilir.
          </p>
        </div>
      )}
    </div>
  );
}
