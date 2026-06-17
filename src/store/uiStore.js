/**
 * @file Small UI store for app-wide ephemeral UI state (the auth modal).
 * Lets any component open the login/register modal without prop drilling.
 */

import { create } from 'zustand';

export const useUiStore = create((set) => ({
  authModalOpen: false,
  authModalMode: 'login', // 'login' | 'register'

  openAuth(mode = 'login') {
    set({ authModalOpen: true, authModalMode: mode });
  },
  closeAuth() {
    set({ authModalOpen: false });
  },
}));

export default useUiStore;
