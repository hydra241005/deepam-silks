import assert from 'node:assert/strict';
import test from 'node:test';
import {
  beginCheckoutOperation,
  checkoutModalReducer,
  createInitialCheckoutModalState,
  invalidateCheckoutOperation,
  isCurrentCheckoutOperation,
} from '../src/lib/checkout-modal';
import { resolveProductDetail } from '../src/lib/product-detail';
import { PRODUCTS } from '../src/data/products';

test('invalid product IDs do not resolve to a fallback product', () => {
  assert.deepEqual(resolveProductDetail('invalid-product-id', PRODUCTS, 'ready'), {
    status: 'not-found',
  });
});

test('unpublished products are not resolved from the public catalog', () => {
  assert.deepEqual(resolveProductDetail(PRODUCTS[0].id, [], 'ready'), {
    status: 'not-found',
  });
});

test('valid published products resolve normally', () => {
  const result = resolveProductDetail(PRODUCTS[0].id, PRODUCTS, 'ready');
  assert.equal(result.status, 'ready');
  if (result.status === 'ready') assert.equal(result.product.id, PRODUCTS[0].id);
});

test('products with no active variants report unavailable', () => {
  const product = { ...PRODUCTS[0], variants: [] };
  assert.deepEqual(resolveProductDetail(product.id, [product], 'ready'), {
    status: 'unavailable',
  });
});

test('closing and reopening checkout starts at step one with a clean form', () => {
  let state = createInitialCheckoutModalState();
  state = checkoutModalReducer(state, { type: 'set-step', step: 2 });
  state = checkoutModalReducer(state, { type: 'set-field', field: 'fullName', value: 'A Customer' });
  state = checkoutModalReducer(state, { type: 'reset' });

  assert.deepEqual(state, createInitialCheckoutModalState());
});

test('closing checkout clears validation errors', () => {
  const invalidState = checkoutModalReducer(createInitialCheckoutModalState(), {
    type: 'set-errors',
    errors: { email: 'Invalid email' },
  });
  const reopened = checkoutModalReducer(invalidState, { type: 'reset' });
  assert.deepEqual(reopened.errors, {});
});

test('closing checkout resets submission state', () => {
  const submitting = checkoutModalReducer(createInitialCheckoutModalState(), {
    type: 'set-submitting',
    isSubmitting: true,
  });
  const reopened = checkoutModalReducer(submitting, { type: 'reset' });
  assert.equal(reopened.isSubmitting, false);
});

test('selecting a saved address replaces checkout fields and clears stale errors', () => {
  const state = checkoutModalReducer(
    checkoutModalReducer(createInitialCheckoutModalState(), {
      type: 'set-errors',
      errors: { email: 'Invalid email' },
    }),
    {
      type: 'set-form-data',
      formData: {
        fullName: 'Test Customer',
        phone: '9876501234',
        email: 'customer@example.test',
        pinCode: '560001',
        addressLine1: '123 Local Test Lane',
        addressLine2: 'Test Block',
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    },
  );

  assert.equal(state.formData.addressLine1, '123 Local Test Lane');
  assert.deepEqual(state.errors, {});
});

test('async checkout responses are ignored after the modal closes', async () => {
  const epoch = { current: 0 };
  const operation = beginCheckoutOperation(epoch);
  let resolveResponse!: () => void;
  const response = new Promise<void>(resolve => { resolveResponse = resolve; })
    .then(() => isCurrentCheckoutOperation(epoch, operation));

  invalidateCheckoutOperation(epoch);
  resolveResponse();
  assert.equal(await response, false);
});
