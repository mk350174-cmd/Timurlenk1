/**
 * @file Profile page for the signed-in user: identity + ratings + achievements
 * (via PlayerProfile), recent games, Talim Alanı progress, and board settings.
 */

import { useAuth } from '../hooks/useAuth.js';
import { useSettingsStore } from '../store/settingsStore.js';
import PlayerProfile from '../components/PlayerProfile.jsx';
import GameHistory from '../components/GameHistory.jsx';
import { storageService } from '../services/storageService.js';
import { LEVELS, PUZZLES_PER_LEVEL } from '../data/puzzles.js';

export default function Profile() {
  const { user } = useAuth();
  const whiteBottom = useSettingsStore((s) => s.whiteBottom);
  const showCoordinates = useSettingsStore((s) => s.showCoordinates);
  const sound = useSettingsStore((s) => s.sound);
  const komutanVoice = useSettingsStore((s) => s.komutanVoice);
  const toggle = useSettingsStore((s) => s.toggle);

  if (!user) return null;

  const progress = storageService.getTalimProgress();
  const totalSolved = LEVELS.reduce((n, l) => n + (progress[l.level]?.completed?.length ?? 0), 0);
  const totalGp = LEVELS.reduce((n, l) => n + (progress[l.level]?.gp ?? 0), 0);
  const totalPuzzles = LEVELS.length * PUZZLES_PER_LEVEL;

  return (
    <div className="space-y-6">
      <PlayerProfile profile={user} isCurrentUser />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Talim progress */}
        <section className="card p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-gold-300">Talim Alanı</h3>
          <div className="flex items-center justify-between text-sm text-timur-200">
            <span>Çözülen bulmaca</span>
            <span className="font-bold text-white">
              {totalSolved}/{totalPuzzles}
            </span>
          </div>
          <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-timur-700">
            <div
              className="h-full bg-gold-500"
              style={{ width: `${Math.round((totalSolved / totalPuzzles) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-timur-200">
            <span>Kazanılan GP</span>
            <span className="font-bold text-gold-300">{totalGp} GP</span>
          </div>
        </section>

        {/* Settings */}
        <section className="card p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-gold-300">Ayarlar</h3>
          <SettingRow
            label="Tahtayı beyaz altta göster"
            checked={whiteBottom}
            onChange={() => toggle('whiteBottom')}
          />
          <SettingRow
            label="Koordinatları göster"
            checked={showCoordinates}
            onChange={() => toggle('showCoordinates')}
          />
          <SettingRow
            label="Ses efektleri"
            checked={sound}
            onChange={() => toggle('sound')}
          />
          <SettingRow
            label="Komutan sesi (TTS)"
            checked={komutanVoice}
            onChange={() => toggle('komutanVoice')}
          />
        </section>
      </div>

      {/* History */}
      <section className="card p-5">
        <h3 className="mb-3 font-display text-lg font-bold text-gold-300">Son Oyunlar</h3>
        <GameHistory userId={user.id} />
      </section>
    </div>
  );
}

function SettingRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-2">
      <span className="text-sm text-timur-100">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-gold-500' : 'bg-timur-600'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}
