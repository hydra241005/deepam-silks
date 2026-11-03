/**
 * LoginPage — Deepam Silks
 * Elegant login experience matching the luxury saree brand aesthetic.
 * FRONTEND ONLY — forms are ready for future backend integration.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { requestPasswordReset } from '../lib/backend';

export const LoginPage: React.FC = () => {
  const { navigateToHome, navigateToSignup, navigateToAdmin, authenticate } = useShop();

  /* ── Form state ── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Error state ── */
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  /* ── Validation ── */
  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit handler — wired up for future backend ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authenticate(email.trim(), password);
      if (user.isAdmin) navigateToAdmin();
      else navigateToHome();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Enter your email address first.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await requestPasswordReset(email.trim());
      setErrors({ form: 'If an account exists for this email, a password reset link has been sent.' });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Password reset could not be requested.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── Left panel — editorial image (desktop only) ── */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1400&q=85"
          alt="Deepam Silks — Heirloom Sarees"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-neutral-950/40 to-transparent" />

        {/* Brand copy on image */}
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14">
          {/* Back to site */}
          <button
            onClick={navigateToHome}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs uppercase tracking-[0.18em] font-medium transition-colors group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Store
          </button>

          {/* Quote */}
          <div className="max-w-xs">
            <Sparkles className="w-5 h-5 text-amber-300 mb-4 opacity-80" />
            <p className="font-display text-2xl xl:text-3xl text-white leading-snug font-medium mb-3">
              Heirloom weaves, curated for&nbsp;you.
            </p>
            <p className="text-white/60 text-sm leading-relaxed font-light">
              Sign in to access your Deepam Silks account, saved wishlist, and exclusive Privé member benefits.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20 bg-white">

        {/* Mobile back button */}
        <div className="lg:hidden mb-8">
          <button
            onClick={navigateToHome}
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 text-xs uppercase tracking-[0.15em] font-medium transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Store
          </button>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">

          {/* Brand header */}
          <div className="mb-8">
            <button
              onClick={navigateToHome}
              className="font-display text-2xl tracking-[0.2em] font-medium text-neutral-950 uppercase block mb-1 hover:text-neutral-700 transition-colors"
            >
              DEEPAM SILKS
            </button>
            <span className="text-[9px] tracking-[0.28em] uppercase text-neutral-400 font-light block mb-6">
              Her Style. Her Story.
            </span>
            <h1 className="font-display text-3xl text-neutral-900 font-medium leading-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-500 font-light">
              Sign in to your Deepam Silks account
            </p>
          </div>

          {/* Form-level error/info message */}
          {errors.form && (
            <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed rounded-none">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                className={`w-full border px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-neutral-300 focus:border-neutral-700 focus:ring-neutral-200'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  className={`w-full border px-4 py-3 pr-11 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
                    errors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-neutral-300 focus:border-neutral-700 focus:ring-neutral-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 text-white py-3.5 text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-700 active:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Sign Up CTA */}
          <p className="text-xs text-neutral-600 text-center">
            Don't have an account?{' '}
            <button
              onClick={navigateToSignup}
              className="font-semibold text-neutral-900 hover:underline underline-offset-2 transition-colors"
            >
              Create one — it's free
            </button>
          </p>

        </div>

        {/* Decorative bottom tagline */}
        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] text-center mt-12 lg:text-left lg:mt-auto lg:pt-10 w-full max-w-sm mx-auto lg:mx-0">
          Handcrafted Sarees · Artisanal Heritage · India
        </p>

      </div>
    </div>
  );
};
