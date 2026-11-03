import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canTransitionPayment,
  canTransitionReservation,
  isPaymentMethod,
  isValidOrderInput,
  minorUnitsToDisplay,
} from '../src/lib/security';

test('rejects client-supplied prices and invalid quantities', () => {
  assert.equal(isValidOrderInput(null), false);
  assert.equal(isValidOrderInput({}), false);
  assert.equal(isValidOrderInput([null]), false);
  assert.equal(isValidOrderInput([{ productId: 'sar-01' }]), false);
  assert.equal(isValidOrderInput([{
    productId: 'sar-01',
    variantId: 'size-m',
    colorName: 'Crimson',
    quantity: 1,
    price: 1,
  } as never]), false);
  assert.equal(isValidOrderInput([{
    productId: 'sar-01',
    variantId: 'size-m',
    colorName: 'Crimson',
    quantity: 21,
  }]), false);
});

test('accepts only supported payment methods', () => {
  assert.equal(isPaymentMethod('cod'), true);
  assert.equal(isPaymentMethod('bitcoin'), false);
});

test('allows only forward payment transitions', () => {
  assert.equal(canTransitionPayment('pending', 'paid'), true);
  assert.equal(canTransitionPayment('paid', 'pending'), false);
  assert.equal(canTransitionPayment('paid', 'paid'), false);
  assert.equal(canTransitionPayment('review', 'paid'), false);
});

test('makes inventory reservation terminal transitions idempotent', () => {
  assert.equal(canTransitionReservation('held', 'committed'), true);
  assert.equal(canTransitionReservation('held', 'released'), true);
  assert.equal(canTransitionReservation('released', 'committed'), false);
});

test('preserves minor-unit monetary precision', () => {
  assert.equal(minorUnitsToDisplay(1001), 10.01);
  assert.equal(minorUnitsToDisplay(999), 9.99);
});
