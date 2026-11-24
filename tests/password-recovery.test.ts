import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  getPasswordRecoveryRedirect,
  hasPasswordRecoveryCallback,
  isResetPasswordPath,
  validateNewPassword,
} from '../src/lib/password-recovery';

test('reset route and callback detection accept Supabase recovery URLs only', () => {
  assert.equal(isResetPasswordPath('/reset-password'), true);
  assert.equal(isResetPasswordPath('/reset-password/'), true);
  assert.equal(isResetPasswordPath('/'), false);
  assert.equal(hasPasswordRecoveryCallback(new URL(
    'https://shop.example.com/reset-password#access_token=token&type=recovery',
  )), true);
  assert.equal(hasPasswordRecoveryCallback(new URL(
    'https://shop.example.com/reset-password?code=one-time-code',
  )), true);
  assert.equal(hasPasswordRecoveryCallback(new URL(
    'https://shop.example.com/reset-password',
  )), false);
});

test('password recovery redirect is explicit and requires HTTPS in production', () => {
  assert.equal(
    getPasswordRecoveryRedirect('https://shop.example.com', true),
    'https://shop.example.com/reset-password',
  );
  assert.throws(() => getPasswordRecoveryRedirect(undefined, true), /VITE_APP_URL/);
  assert.throws(() => getPasswordRecoveryRedirect('http://localhost:3000', true), /HTTPS/);
  assert.throws(() => getPasswordRecoveryRedirect('https://shop.example.com/store', false), /origin/);
});

test('new password validation matches the current minimum and confirmation', () => {
  assert.match(validateNewPassword('12345', '12345') ?? '', /6 characters/);
  assert.equal(validateNewPassword('secure6', 'different'), 'Passwords do not match.');
  assert.equal(validateNewPassword('secure6', 'secure6'), null);
});

test('local Supabase allows the configured reset route on both development hosts', () => {
  const configPath = fileURLToPath(new URL('../supabase/config.toml', import.meta.url));
  const config = readFileSync(configPath, 'utf8');
  assert.match(config, /"http:\/\/127\.0\.0\.1:3000\/reset-password"/);
  assert.match(config, /"http:\/\/localhost:3000\/reset-password"/);
});
