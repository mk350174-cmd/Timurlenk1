/**
 * @file Minimal toast notification store (Zustand). Used for offline/online
 * transitions, sync results and game outcomes.
 */

import { create } from 'zustand';

let counter = 0;

export const useToastStore = create((set, get) => ({
  /** @type {{ id: number, type: string, message: string, action?: object }[]} */
  toasts: [],

  /**
   * Show a toast.
   * @param {string} message
   * @param {{ type?: 'info'|'success'|'error'|'warn', duration?: number, action?: { label: string, onClick: () => void } }} [opts]
   * @returns {number} toast id
   */
  show(message, opts = {}) {
    const id = (counter += 1);
    const toast = { id, message, type: opts.type ?? 'info', action: opts.action };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    const duration = opts.duration ?? 4000;
    if (duration > 0) setTimeout(() => get().dismiss(id), duration);
    return id;
  },

  /** Remove a toast by id. */
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Imperative helper for non-component code. */
export const toast = {
  info: (m, o) => useToastStore.getState().show(m, { ...o, type: 'info' }),
  success: (m, o) => useToastStore.getState().show(m, { ...o, type: 'success' }),
  error: (m, o) => useToastStore.getState().show(m, { ...o, type: 'error' }),
  warn: (m, o) => useToastStore.getState().show(m, { ...o, type: 'warn' }),
};

export default useToastStore;
