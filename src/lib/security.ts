import type { OrderLineInput, PaymentMethod } from './backend';

const paymentTransitions: Record<string, readonly string[]> = {
  created: ['pending', 'failed'],
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: [],
  refunded: [],
  review: [],
};

const reservationTransitions: Record<string, readonly string[]> = {
  held: ['committed', 'released', 'expired'],
  committed: [],
  released: [],
  expired: [],
};

export const isValidOrderInput = (items: unknown): items is OrderLineInput[] =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every(item => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return false;
    const keys = Object.keys(item).sort().join(',');
    return keys === 'colorName,productId,quantity,variantId' &&
      typeof item.productId === 'string' &&
      typeof item.variantId === 'string' &&
      typeof item.colorName === 'string' &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 20;
  });

export const isPaymentMethod = (value: string): value is PaymentMethod =>
  value === 'upi' || value === 'card' || value === 'netbanking' || value === 'cod';

export const canTransitionPayment = (from: string, to: string) =>
  paymentTransitions[from]?.includes(to) ?? false;

export const canTransitionReservation = (from: string, to: string) =>
  reservationTransitions[from]?.includes(to) ?? false;

export const minorUnitsToDisplay = (minorUnits: number) => minorUnits / 100;
