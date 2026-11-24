import type { Order } from '../types';

export const getOrderPresentation = (
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>,
) => {
  if (order.paymentMethod === 'cod') {
    return {
      statusLabel: 'Order Received — Cash on Delivery',
      toastTitle: 'Order placed successfully',
    };
  }

  if (order.paymentStatus === 'pending') {
    return {
      statusLabel: 'Order Received — Payment Confirmation Pending',
      toastTitle: 'Payment submitted',
    };
  }

  if (order.paymentStatus === 'review') {
    return {
      statusLabel: 'Payment Review Required — We Will Contact You',
      toastTitle: 'Order placed successfully',
    };
  }

  return {
    statusLabel: 'Order Confirmed — Preparing Dispatch',
    toastTitle: 'Order placed successfully',
  };
};
