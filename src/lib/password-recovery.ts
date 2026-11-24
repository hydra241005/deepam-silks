export const isResetPasswordPath = (pathname: string): boolean =>
  pathname.replace(/\/+$/, '') === '/reset-password';

export const hasPasswordRecoveryCallback = (url: URL): boolean => {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  return hash.get('type') === 'recovery' ||
    url.searchParams.get('type') === 'recovery' ||
    url.searchParams.has('code');
};

export const getPasswordRecoveryRedirect = (
  appUrl: string | undefined,
  isProduction: boolean,
): string => {
  if (!appUrl?.trim()) {
    throw new Error('Password recovery requires VITE_APP_URL to be configured.');
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(appUrl);
  } catch {
    throw new Error('VITE_APP_URL must be a valid application origin.');
  }

  if (!['http:', 'https:'].includes(baseUrl.protocol) ||
      baseUrl.pathname !== '/' ||
      baseUrl.search ||
      baseUrl.hash ||
      baseUrl.username ||
      baseUrl.password) {
    throw new Error('VITE_APP_URL must be an application origin without a path or credentials.');
  }
  if (isProduction && baseUrl.protocol !== 'https:') {
    throw new Error('Password recovery requires an HTTPS VITE_APP_URL in production.');
  }

  return new URL('/reset-password', baseUrl.origin).toString();
};

export const validateNewPassword = (password: string, confirmation: string): string | null => {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password !== confirmation) return 'Passwords do not match.';
  return null;
};
