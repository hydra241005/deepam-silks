/**
 * SignupPage — Deepam Silks
 * Elegant account creation experience matching the luxury saree brand aesthetic.
 * Supabase Auth registration with server-created customer profiles.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

/* ── Password strength helper ── */
const getPasswordStrength = (pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9!@#$%^&*]/.test(pwd)) score++;
  if (score === 1) return { level: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { level: 2, label: 'Good', color: 'bg-amber-500' };
  return { level: 3, label: 'Strong', color: 'bg-emerald-600' };
};

export const SignupPage: React.FC = () => {
  const { navigateToHome, navigateToLogin, register } = useShop();

  /* ── Form state ── */
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const passwordStrength = getPasswordStrength(formData.password);

  /* ── Field change handler ── */
  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  /* ── Validation ── */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit handler ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      setErrors({
        form: result.needsEmailConfirmation
          ? 'Account created. Check your email to confirm your address before signing in.'
          : 'Account created successfully. You can now sign in.',
      });
      if (!result.needsEmailConfirmation) navigateToLogin();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── Left panel — editorial image (desktop only) ── */}
      <div className="hidden lg:block lg:w-5/12 xl:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85"
          alt="Deepam Silks — Artisanal Sarees"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/75 via-neutral-950/50 to-transparent" />

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

          {/* Perks list */}
          <div className="max-w-xs">
            <Sparkles className="w-5 h-5 text-amber-300 mb-4 opacity-80" />
            <p className="font-display text-2xl xl:text-3xl text-white leading-snug font-medium mb-5">
              Join Deepam Silks Privé
            </p>
            <ul className="space-y-3">
              {[
                'Early access to new arrivals & festive collections',
                'Exclusive Privé member discounts & cashback',
                'Save your wishlist & shipping details',
                'Personalised styling concierge support',
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5 opacity-90" />
                  <span className="text-white/75 text-xs leading-relaxed font-light">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20 bg-white overflow-y-auto">

        {/* Mobile back button */}
        <div className="lg:hidden mb-6">
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
          <div className="mb-7">
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
              Create an account
            </h1>
            <p className="text-sm text-neutral-500 font-light">
              Join Deepam Silks and unlock exclusive member benefits.
            </p>
          </div>

          {/* Form-level error/info message */}
          {errors.form && (
            <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-fullname"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="signup-fullname"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                placeholder="Ananya Sharma"
                className={`w-full border px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
                  errors.fullName
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-neutral-300 focus:border-neutral-700 focus:ring-neutral-200'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange('email')}
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

            {/* Phone */}
            <div>
              <label
                htmlFor="signup-phone"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Phone Number
              </label>
              <div className="flex">
                {/* Country code prefix */}
                <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-50 text-sm text-neutral-500 select-none shrink-0">
                  +91
                </span>
                <input
                  id="signup-phone"
                  type="tel"
                  autoComplete="tel-national"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`flex-1 border px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
                    errors.phone
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-neutral-300 focus:border-neutral-700 focus:ring-neutral-200'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 6 characters"
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
              {/* Password strength bar */}
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(n => (
                      <div
                        key={n}
                        className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                          n <= passwordStrength.level ? passwordStrength.color : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    passwordStrength.level === 1 ? 'text-rose-600' :
                    passwordStrength.level === 2 ? 'text-amber-600' :
                    'text-emerald-700'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Re-enter your password"
                  className={`w-full border px-4 py-3 pr-11 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
                    errors.confirmPassword
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                      : 'border-neutral-300 focus:border-neutral-700 focus:ring-neutral-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.confirmPassword}</p>
              )}
              {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1.5 text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 text-white py-3.5 text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-700 active:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account…</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Login CTA */}
          <p className="text-xs text-neutral-600 text-center">
            Already have an account?{' '}
            <button
              onClick={navigateToLogin}
              className="font-semibold text-neutral-900 hover:underline underline-offset-2 transition-colors"
            >
              Sign in here
            </button>
          </p>

        </div>

        {/* Decorative bottom tagline */}
        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] text-center mt-10 lg:text-left lg:mt-auto lg:pt-10 w-full max-w-sm mx-auto lg:mx-0">
          Handcrafted Sarees · Artisanal Heritage · India
        </p>

      </div>
    </div>
  );
};
