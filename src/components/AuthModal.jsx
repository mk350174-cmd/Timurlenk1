/**
 * @file Login / Register modal. Uses react-hook-form for validation and the
 * auth store for the actual auth calls. Toggles between sign-in and sign-up.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUiStore } from '../store/uiStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { validatePassword } from '../services/authService.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';
import { PASSWORD_POLICY } from '../utils/constants.js';
import { toast } from '../store/toastStore.js';

export default function AuthModal() {
  const open = useUiStore((s) => s.authModalOpen);
  const mode = useUiStore((s) => s.authModalMode);
  const setMode = useUiStore((s) => s.openAuth);
  const close = useUiStore((s) => s.closeAuth);
  const { login, register: registerUser, error, clearError, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const isRegister = mode === 'register';

  // Reset the form whenever the modal opens or switches mode.
  useEffect(() => {
    if (open) {
      reset();
      clearError();
    }
  }, [open, mode, reset, clearError]);

  if (!open) return null;

  const onSubmit = async (values) => {
    const ok = isRegister
      ? await registerUser(values.email, values.password, values.username)
      : await login(values.email, values.password);
    if (ok) {
      toast.success(isRegister ? 'Hesabınız oluşturuldu!' : 'Tekrar hoş geldiniz!');
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="card w-full max-w-md animate-pop p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gold-300">
            {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
          </h2>
          <button type="button" onClick={close} className="text-timur-200 hover:text-white" aria-label="Kapat">
            ✕
          </button>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-lg bg-timur-700/50 px-3 py-2 text-xs text-timur-100">
            ℹ️ Yerel mod: Hesaplar bu cihazda saklanır. Bulut özellikleri için Supabase
            anahtarlarını <code>.env.local</code> dosyasına ekleyin.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          {isRegister && (
            <div>
              <label className="label" htmlFor="username">Kullanıcı Adı</label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                {...register('username', {
                  required: 'Kullanıcı adı gerekli',
                  minLength: { value: 3, message: 'En az 3 karakter' },
                  maxLength: { value: 20, message: 'En fazla 20 karakter' },
                })}
              />
              {errors.username && <p className="mt-1 text-xs text-rose-300">{errors.username.message}</p>}
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              {...register('email', {
                required: 'E-posta gerekli',
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Geçerli bir e-posta girin' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              {...register('password', {
                required: 'Şifre gerekli',
                validate: isRegister ? (v) => validatePassword(v) === null || PASSWORD_POLICY.hint : undefined,
              })}
            />
            {isRegister && <p className="mt-1 text-xs text-timur-300">{PASSWORD_POLICY.hint}</p>}
            {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>}
          </div>

          {error && <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Lütfen bekleyin…' : isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-timur-200">
          {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
          <button
            type="button"
            className="font-semibold text-gold-300 hover:underline"
            onClick={() => setMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Giriş yapın' : 'Kayıt olun'}
          </button>
        </p>
      </div>
    </div>
  );
}
