/**
 * @file Zustand auth store. Single source of truth for the signed-in user.
 * Wraps `authService` so components never import the service directly.
 */

import { create } from 'zustand';
import { authService } from '../services/authService.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';

/**
 * @typedef {object} AuthState
 * @property {object|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 */

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /** Hydrate from an existing session and subscribe to auth changes. */
  async init() {
    try {
      const { user } = await authService.getSession();
      set({ user, isAuthenticated: !!user, isLoading: false });
      // CLOUD mode pushes auth changes (token refresh, multi-tab logout).
      if (isSupabaseConfigured) {
        authService.onAuthChange((profile) => {
          set({ user: profile, isAuthenticated: !!profile });
        });
      }
    } catch (err) {
      logger.error('auth init failed:', err);
      set({ isLoading: false });
    }
  },

  /** Register a new account. @returns {Promise<boolean>} success */
  async register(email, password, username) {
    set({ error: null, isLoading: true });
    const { user, error } = await authService.register(email, password, username);
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
    return true;
  },

  /** Sign in. @returns {Promise<boolean>} success */
  async login(email, password) {
    set({ error: null, isLoading: true });
    const { user, error } = await authService.login(email, password);
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
    return true;
  },

  /** Sign out. */
  async logout() {
    await authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  /** Replace the cached profile (e.g. after a rating update). */
  setUser(user) {
    set({ user, isAuthenticated: !!user });
  },

  /** Refresh the profile from the backend. */
  async refreshProfile() {
    const { user } = get();
    if (!user) return;
    const profile = await authService.getProfile(user.id);
    if (profile) set({ user: profile });
  },

  clearError() {
    set({ error: null });
  },
}));

export default useAuthStore;
