import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRODUCTS } from '../src/data/products';
import {
  calculateCartPricing,
  calculateDiscountPercent,
  calculatePercentageDiscountMinor,
  getProductPriceDisplay,
  normalizeOfferDiscountValue,
} from '../src/lib/pricing';

const offersSql = readFileSync(new URL(
  '../supabase/migrations/20261104060000_harden_catalog_integrity_and_settings.sql',
  import.meta.url,
), 'utf8');
const offerSchemaSql = readFileSync(new URL(
  '../supabase/migrations/20261103230000_admin_catalog_offers_settings.sql',
  import.meta.url,
), 'utf8');
const orderSql = readFileSync(new URL(
  '../supabase/migrations/20261103230100_create_order_effective_discounts.sql',
  import.meta.url,
), 'utf8');
const commerceSchemaSql = readFileSync(new URL(
  '../supabase/migrations/20261101093000_secure_commerce.sql',
  import.meta.url,
), 'utf8');

test('no product or cart discount leaves the effective price unchanged', () => {
  const product = { ...PRODUCTS[0], price: 100, originalPrice: undefined };
  const display = getProductPriceDisplay(product, {
    regularPriceMinor: 10000,
    effectivePriceMinor: 10000,
    discountMinor: 0,
    offerId: null,
  });
  const cart = calculateCartPricing([{ regularPriceMinor: 10000, discountMinor: 0, quantity: 1 }], 0);

  assert.equal(display.priceMinor, 10000);
  assert.equal(display.compareAtMinor, null);
  assert.equal(cart.discountMinor, 0);
  assert.equal(cart.totalMinor, 25000);
});

test('product-level markdown displays the baked-in selling price and rounded percentage', () => {
  const product = PRODUCTS[0];
  const display = getProductPriceDisplay(product, {
    regularPriceMinor: product.price * 100,
    effectivePriceMinor: product.price * 100,
    discountMinor: 0,
    offerId: null,
  });

  assert.equal(display.priceMinor, product.price * 100);
  assert.equal(display.compareAtMinor, product.originalPrice! * 100);
  assert.equal(display.discountPercent, 29);
});

test('active offer pricing uses the server-calculated minor-unit discount', () => {
  const product = { ...PRODUCTS[0], price: 19.99, originalPrice: undefined };
  const display = getProductPriceDisplay(product, {
    regularPriceMinor: 1999,
    effectivePriceMinor: 1800,
    discountMinor: 199,
    offerId: 'offer-active',
  });

  assert.equal(display.priceMinor, 1800);
  assert.equal(display.compareAtMinor, 1999);
  assert.equal(display.discountPercent, 10);
});

test('expired, inactive and unpublished offers are excluded by effective pricing SQL', () => {
  assert.match(offersSql, /and o\.active/);
  assert.match(offersSql, /p_at >= o\.starts_at/);
  assert.match(offersSql, /p_at <= o\.ends_at/);
  assert.match(offersSql, /and p\.published/);
  assert.match(offersSql, /when o\.id is null then p\.price_minor/);
  assert.match(offersSql, /when o\.id is null then 0/);
});

test('overlapping active offers are rejected and effective pricing has deterministic precedence', () => {
  assert.match(offerSchemaSql, /prevent_overlapping_product_offers/);
  assert.match(offerSchemaSql, /prevent_overlapping_offer_dates/);
  assert.match(offersSql, /order by o\.created_at desc nulls last\s+limit 1/);
  assert.match(offerSchemaSql, /check \(discount_type <> 'percentage' or discount_value between 1 and 100\)/);
  assert.match(offerSchemaSql, /check \(discount_value > 0\)/);
});

test('percentage discounts round in minor units consistently with SQL display math', () => {
  assert.equal(calculateDiscountPercent(1999, 199), 10);
  assert.equal(calculateDiscountPercent(10000, 0), null);
  assert.equal(calculatePercentageDiscountMinor(1999, 10), 199);
  assert.equal(calculatePercentageDiscountMinor(1999, 15), 299);
  assert.match(offersSql, /floor\(p\.price_minor \* o\.discount_value \/ 100\)/);
});

test('cart subtotal, offer discount, promo and shipping match checkout calculation', () => {
  const totals = calculateCartPricing([
    { regularPriceMinor: 10000, discountMinor: 1000, quantity: 2 },
    { regularPriceMinor: 5000, discountMinor: 0, quantity: 1 },
  ], 10);

  assert.equal(totals.subtotalMinor, 25000);
  assert.equal(totals.offerDiscountMinor, 2000);
  assert.equal(totals.promoDiscountMinor, 2500);
  assert.equal(totals.discountMinor, 4500);
  assert.equal(totals.shippingMinor, 15000);
  assert.equal(totals.totalMinor, 35500);
  assert.match(orderSql, /v_discount := v_discount \+ floor\(v_subtotal \* 10 \/ 100\)/);
  assert.match(orderSql, /v_subtotal - v_discount \+ v_shipping/);
});

test('discount totals above subtotal are rejected, matching the database constraint', () => {
  const totals = calculateCartPricing([
    { regularPriceMinor: 10000, discountMinor: 10000, quantity: 1 },
  ], 10);
  assert.equal(totals.valid, false);
  assert.equal(totals.error, 'Combined discounts exceed the subtotal. Remove a promotion to continue.');
  assert.match(commerceSchemaSql, /check \(discount_minor <= subtotal_minor\)/);
  assert.match(commerceSchemaSql, /check \(total_minor = subtotal_minor - discount_minor \+ shipping_minor\)/);
});

test('zero discounts are valid while negative, excessive and non-integer discounts fail closed', () => {
  assert.equal(calculateCartPricing([], 0).valid, true);
  assert.equal(calculateCartPricing([{ regularPriceMinor: 10000, discountMinor: 0, quantity: 1 }], 0).valid, true);
  assert.equal(calculateCartPricing([{ regularPriceMinor: 10000, discountMinor: -1, quantity: 1 }], 0).valid, false);
  assert.equal(calculateCartPricing([{ regularPriceMinor: 10000, discountMinor: 10001, quantity: 1 }], 0).valid, false);
  assert.equal(calculateCartPricing([{ regularPriceMinor: 10000, discountMinor: 1, quantity: 1 }], 10.5).valid, false);
  assert.equal(calculateDiscountPercent(10000, -1), null);
});

test('offer inputs reject zero, invalid percentage and values that round down to zero', () => {
  assert.throws(() => normalizeOfferDiscountValue('percentage', 0), /greater than zero/);
  assert.throws(() => normalizeOfferDiscountValue('percentage', 100.1), /cannot exceed 100/);
  assert.throws(() => normalizeOfferDiscountValue('percentage', 0.4), /rounds to an invalid/);
  assert.throws(() => normalizeOfferDiscountValue('fixed', 0.001), /rounds to an invalid/);
  assert.throws(() => normalizeOfferDiscountValue('fixed', -1), /greater than zero/);
  assert.equal(normalizeOfferDiscountValue('percentage', 10.4), 10);
  assert.equal(normalizeOfferDiscountValue('fixed', 1.25), 125);
});
