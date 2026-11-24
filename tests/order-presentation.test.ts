import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderPresentation } from '../src/lib/order-presentation';

test('COD orders are not presented as submitted online payments', () => {
  assert.deepEqual(
    getOrderPresentation({ paymentMethod: 'cod', paymentStatus: 'pending' }),
    {
      statusLabel: 'Order Received — Cash on Delivery',
      toastTitle: 'Order placed successfully',
    },
  );
});

test('pending online payments retain their payment confirmation status', () => {
  assert.deepEqual(
    getOrderPresentation({ paymentMethod: 'upi', paymentStatus: 'pending' }),
    {
      statusLabel: 'Order Received — Payment Confirmation Pending',
      toastTitle: 'Payment submitted',
    },
  );
});

test('orders requiring payment review keep the review status', () => {
  assert.deepEqual(
    getOrderPresentation({ paymentMethod: 'card', paymentStatus: 'review' }),
    {
      statusLabel: 'Payment Review Required — We Will Contact You',
      toastTitle: 'Order placed successfully',
    },
  );
});
