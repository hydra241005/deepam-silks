import type { Product } from '../types';

export interface EffectivePriceSnapshot {
  regularPriceMinor: number;
  effectivePriceMinor: number;
  discountMinor: number;
  offerId: string | null;
}

export interface ProductPriceDisplay {
  priceMinor: number;
  compareAtMinor: number | null;
  discountPercent: number | null;
}

export interface CartPricingLine {
  regularPriceMinor: number;
  discountMinor: number;
  quantity: number;
}

export interface CartPricingTotals {
  valid: boolean;
  error: string | null;
  subtotalMinor: number;
  offerDiscountMinor: number;
  promoDiscountMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
}

export const normalizeOfferDiscountValue = (
  discountType: 'percentage' | 'fixed',
  value: number,
): number => {
  if ((discountType !== 'percentage' && discountType !== 'fixed') ||
      !Number.isFinite(value) || value <= 0 ||
      (discountType === 'percentage' && value > 100)) {
    throw new Error('Discount must be greater than zero and percentage discounts cannot exceed 100.');
  }
  const storedValue = discountType === 'fixed' ? Math.round(value * 100) : Math.round(value);
  if (!Number.isSafeInteger(storedValue) || storedValue <= 0) {
    throw new Error('Discount rounds to an invalid stored value.');
  }
  return storedValue;
};

export const calculateDiscountPercent = (referencePriceMinor: number, discountMinor: number): number | null => {
  if (!Number.isSafeInteger(referencePriceMinor) || !Number.isSafeInteger(discountMinor) ||
      referencePriceMinor <= 0 || discountMinor <= 0 || discountMinor > referencePriceMinor) return null;
  const percent = Math.round((discountMinor / referencePriceMinor) * 100);
  return percent > 0 ? percent : null;
};

export const calculatePercentageDiscountMinor = (amountMinor: number, percent: number): number => {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0 ||
      !Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error('Percentage discount input is invalid.');
  }
  return Math.floor(amountMinor / 100) * percent +
    Math.floor(((amountMinor % 100) * percent) / 100);
};

export const getProductPriceDisplay = (
  product: Product,
  pricing: EffectivePriceSnapshot | null,
): ProductPriceDisplay => {
  const basePriceMinor = Math.round(product.price * 100);
  if (!pricing) {
    return { priceMinor: basePriceMinor, compareAtMinor: null, discountPercent: null };
  }
  if (pricing.discountMinor > 0) {
    return {
      priceMinor: pricing.effectivePriceMinor,
      compareAtMinor: pricing.regularPriceMinor,
      discountPercent: calculateDiscountPercent(pricing.regularPriceMinor, pricing.discountMinor),
    };
  }

  const originalPriceMinor = product.originalPrice === undefined
    ? 0
    : Math.round(product.originalPrice * 100);
  if (Math.round(product.price * 100) === pricing.regularPriceMinor &&
      originalPriceMinor > pricing.regularPriceMinor) {
    return {
      priceMinor: pricing.effectivePriceMinor,
      compareAtMinor: originalPriceMinor,
      discountPercent: calculateDiscountPercent(
        originalPriceMinor,
        originalPriceMinor - pricing.regularPriceMinor,
      ),
    };
  }
  return { priceMinor: pricing.effectivePriceMinor, compareAtMinor: null, discountPercent: null };
};

export const calculateCartPricing = (
  lines: CartPricingLine[],
  promoPercent: number,
): CartPricingTotals => {
  const invalid = (error: string): CartPricingTotals => ({
    valid: false,
    error,
    subtotalMinor: 0,
    offerDiscountMinor: 0,
    promoDiscountMinor: 0,
    discountMinor: 0,
    shippingMinor: 0,
    totalMinor: 0,
  });
  if (!Number.isInteger(promoPercent) || promoPercent < 0 || promoPercent > 100) {
    return invalid('Promotion percentage is invalid.');
  }

  let subtotalMinor = 0;
  let offerDiscountMinor = 0;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.regularPriceMinor) || line.regularPriceMinor < 0 ||
        !Number.isSafeInteger(line.discountMinor) || line.discountMinor < 0 ||
        line.discountMinor > line.regularPriceMinor ||
        !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      return invalid('Cart pricing could not be verified.');
    }
    subtotalMinor += line.regularPriceMinor * line.quantity;
    offerDiscountMinor += line.discountMinor * line.quantity;
    if (!Number.isSafeInteger(subtotalMinor) || !Number.isSafeInteger(offerDiscountMinor)) {
      return invalid('Cart pricing exceeds supported monetary limits.');
    }
  }

  const promoDiscountMinor = calculatePercentageDiscountMinor(subtotalMinor, promoPercent);
  const discountMinor = offerDiscountMinor + promoDiscountMinor;
  if (!Number.isSafeInteger(discountMinor)) return invalid('Cart pricing exceeds supported monetary limits.');

  const valid = discountMinor <= subtotalMinor;
  const shippingMinor = subtotalMinor >= 199900 || subtotalMinor === 0 ? 0 : 15000;
  return {
    valid,
    error: valid ? null : 'Combined discounts exceed the subtotal. Remove a promotion to continue.',
    subtotalMinor,
    offerDiscountMinor,
    promoDiscountMinor,
    discountMinor,
    shippingMinor,
    totalMinor: valid ? subtotalMinor - discountMinor + shippingMinor : 0,
  };
};
