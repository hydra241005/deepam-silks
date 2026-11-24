import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { updatePassword } from '../lib/backend';
import {
  hasPasswordRecoveryCallback,
  validateNewPassword,
} from '../lib/password-recovery';
import { hasPasswordRecoveryEvent, supabase } from '../lib/supabase';

type RecoveryStatus = 'checking' | 'ready' | 'invalid';

export const ResetPasswordPage: React.FC = () => {
  const { addToast, logout, navigateToLogin } = useShop();
  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setStatus('invalid');
      setError('Password recovery is not configured for this environment.');
      return;
    }

    const client = supabase;
    const hasCallback = hasPasswordRecoveryEvent() ||
      hasPasswordRecoveryCallback(new URL(window.location.href));
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStatus('ready');
        setError('');
      }
    });

    if (!hasCallback) {
      setStatus('invalid');
      setError('This password reset link is invalid or has expired. Request a new link.');
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session) {
        setStatus('invalid');
        setError('This password reset link is invalid or has expired. Request a new link.');
        return;
      }
      setStatus('ready');
      setError('');
    }).catch(() => {
      if (!active) return;
      setStatus('invalid');
      setError('We could not verify this password reset link. Request a new link.');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const returnToLogin = () => {
    window.history.replaceState(null, '', '/');
    navigateToLogin();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status !== 'ready' || isSubmitting) return;

    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmation('');

      let signOutFailed = false;
      try {
        await logout();
      } catch (signOutError) {
        console.error('Password updated, but the recovery session could not be cleared.', signOutError);
        signOutFailed = true;
      }

      window.history.replaceState(null, '', '/');
      navigateToLogin();
      addToast(
        'Password updated',
        signOutFailed
          ? 'Your password changed, but the recovery session could not be cleared. Sign out after signing in.'
          : 'Sign in with your new password.',
        signOutFailed ? 'error' : 'success',
      );
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : 'Your password could not be updated. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12 text-neutral-900">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={returnToLogin}
          className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </button>

        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Deepam Silks</p>
        <h1 className="mb-2 font-display text-3xl font-medium">Set a new password</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Choose a new password for your account.
        </p>

        {status === 'checking' && (
          <div className="flex items-center gap-2 text-sm text-neutral-500" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your reset link…
          </div>
        )}

        {status === 'invalid' && (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
            {error}
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="reset-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em]">
                New password
              </label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={event => {
                  setPassword(event.target.value);
                  setError('');
                }}
                className="w-full border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-700 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-reset-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em]">
                Confirm new password
              </label>
              <input
                id="confirm-reset-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={event => {
                  setConfirmation(event.target.value);
                  setError('');
                }}
                className="w-full border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-700 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-neutral-900 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
