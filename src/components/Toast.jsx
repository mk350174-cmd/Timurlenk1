/**
 * @file Toast notification container. Reads from the toast store and renders a
 * stacked, dismissible list in the bottom-right corner.
 */

import { useToastStore } from '../store/toastStore.js';

const STYLES = {
  info: 'border-timur-400/50 bg-timur-700/90',
  success: 'border-emerald-400/50 bg-emerald-700/90',
  error: 'border-rose-400/50 bg-rose-700/90',
  warn: 'border-amber-400/50 bg-amber-700/90',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto animate-fade-in rounded-xl border px-4 py-3 text-sm text-white shadow-xl ${
            STYLES[t.type] ?? STYLES.info
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-white/70 hover:text-white"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action.onClick();
                dismiss(t.id);
              }}
              className="mt-2 rounded-md bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
