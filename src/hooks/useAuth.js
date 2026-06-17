/**
 * @file `useAuth` — ergonomic accessor over the Zustand auth store.
 * Returns the current user plus bound auth actions.
 */

import { useAuthStore } from '../store/authStore.js';

/**
 * @returns {{
 *   user: object|null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   error: string|null,
 *   login: (email: string, password: string) => Promise<boolean>,
 *   register: (email: string, password: string, username: string) => Promise<boolean>,
 *   logout: () => Promise<void>,
 *   clearError: () => void,
 * }}
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  return { user, isAuthenticated, isLoading, error, login, register, logout, clearError };
}

export default useAuth;
