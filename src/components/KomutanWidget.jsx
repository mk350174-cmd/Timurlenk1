/**
 * @file KomutanWidget — the AI narrator sidebar widget. Shows Komutan's current
 * line with a stylised portrait placeholder (final character artwork will load
 * from AWS S3 per the spec) and a voice on/off toggle.
 *
 * @param {object} props
 * @param {boolean} [props.compact]
 */

import { useEffect, useRef } from 'react';
import { useKomutanStore } from '../store/komutanStore.js';
import { useSettingsStore } from '../store/settingsStore.js';

export default function KomutanWidget({ compact = false }) {
  const current = useKomutanStore((s) => s.current);
  const silence = useKomutanStore((s) => s.silence);
  const voiceOn = useSettingsStore((s) => s.komutanVoice);
  const update = useSettingsStore((s) => s.update);
  const bubbleRef = useRef(null);

  // Re-trigger the pop animation whenever a new line arrives.
  useEffect(() => {
    const el = bubbleRef.current;
    if (el && current) {
      el.classList.remove('animate-pop');
      void el.offsetWidth; // reflow
      el.classList.add('animate-pop');
    }
  }, [current]);

  const toggleVoice = () => {
    if (voiceOn) silence();
    update({ komutanVoice: !voiceOn });
  };

  return (
    <div className="card flex items-start gap-3 p-3">
      {/* Portrait placeholder */}
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-gold-600/30 to-brown-900/40 ${
          compact ? 'h-16 w-14' : 'h-[88px] w-[72px]'
        }`}
        title="Komutan"
      >
        <span className={compact ? 'text-3xl' : 'text-4xl'} aria-hidden>🧔🏻‍♂️</span>
        {current && voiceOn && (
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 animate-ping rounded-full bg-emerald-400" />
        )}
      </div>

      {/* Speech bubble */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-gold-300">Komutan</span>
          <button
            type="button"
            onClick={toggleVoice}
            className="rounded-md px-1.5 py-0.5 text-xs text-timur-200 hover:bg-timur-700/60"
            title={voiceOn ? 'Sesi kapat' : 'Sesi aç'}
            aria-pressed={voiceOn}
          >
            {voiceOn ? '🔊' : '🔈'}
          </button>
        </div>
        <p
          ref={bubbleRef}
          className="min-h-[2.5rem] rounded-lg bg-timur-900/60 px-3 py-2 text-sm italic text-timur-100"
        >
          {current?.text ?? 'Emrini bekliyorum, komutanım.'}
        </p>
      </div>
    </div>
  );
}
