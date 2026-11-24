import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reconcileCartStock,
  reconcileStoredCart,
  getVariantColorLabel,
  remainingCartLineQuantity,
  resolveVariantIdForProduct,
  runExclusiveStockUpdate,
  updateCartLineQuantity,
  variantSupportsColor,
} from '../src/lib/cart';
import { PRODUCTS } from '../src/data/products';
import { CartItem, ProductVariant } from '../src/types';

const product = {
  ...PRODUCTS[0],
  id: 'stock-test',
  colors: [{ name: 'Crimson', hex: '#900' }],
  variants: [
    { id: 'stock-test-small', name: 'Small', inStock: true, availableQuantity: 3 },
    { id: 'stock-test-large', name: 'Large', inStock: false, availableQuantity: 0 },
  ],
};

const savedItem = (variantId: string, quantity: number) => ({
  id: `stock-test-Crimson-${variantId}`,
  productId: 'stock-test',
  selectedColor: { name: 'Crimson', hex: '#900' },
  selectedVariant: { id: variantId, name: variantId },
  quantity,
});

const cartLine = (id: string, quantity: number): CartItem => ({
  id,
  productId: product.id,
  product,
  selectedColor: product.colors[0],
  selectedVariant: product.variants[0],
  quantity,
});

test('a new cart line can use available stock while respecting other lines for the same variant', () => {
  const existing = cartLine('existing-color-line', 1);
  assert.equal(remainingCartLineQuantity([], 'new-line', 2, 'stock-test-small'), 2);
  assert.equal(
    remainingCartLineQuantity([existing], 'new-color-line', 2, existing.selectedVariant.id),
    1,
  );
});

test('restored cart resolves legacy variant IDs and clamps quantity to current stock', () => {
  const [item] = reconcileStoredCart([savedItem('small', 8)], [product]);
  assert.equal(item.selectedVariant.id, 'stock-test-small');
  assert.equal(item.quantity, 3);
  assert.equal(item.id, 'stock-test-Crimson-stock-test-small');
});

test('variant colors accept only their canonical color', () => {
  const variant = { ...product.variants[0], colorName: 'Crimson' };
  assert.equal(getVariantColorLabel(variant), 'Crimson');
  assert.equal(variantSupportsColor(variant, 'Crimson'), true);
  assert.equal(variantSupportsColor(variant, 'Emerald'), false);
});

test('restored cart uses the selected variant supported color', () => {
  const colorBoundProduct = {
    ...product,
    colors: [{ name: 'Royal Crimson', hex: '#900' }],
    variants: [{ ...product.variants[0], colorName: 'Royal Crimson' }],
  };
  const [restored] = reconcileStoredCart([
    {
      ...savedItem('stock-test-small', 1),
      selectedColor: { name: 'Unsupported Green', hex: '#090' },
    },
  ], [colorBoundProduct]);

  assert.equal(restored.selectedColor.name, 'Royal Crimson');
  assert.equal(restored.id, 'stock-test-Royal Crimson-stock-test-small');
});

test('restored cart removes unavailable and malformed variants and combines duplicate lines safely', () => {
  const restored = reconcileStoredCart([
    savedItem('small', 2),
    savedItem('stock-test-small', 2),
    savedItem('large', 1),
    savedItem('deleted', 1),
    { ...savedItem('small', 1), quantity: 0 },
  ], [product]);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].quantity, 3);
});

test('cart quantities reconcile when stock drops while the drawer remains open', () => {
  const line = cartLine('open-cart-line', 4);
  const reconciled = reconcileCartStock([line], new Map([['stock-test-small', 2]]));
  assert.equal(reconciled[0].quantity, 2);
  assert.equal(line.quantity, 4);
});

test('incrementing past newly reduced stock keeps the cart within the fresh quantity', async () => {
  const line = cartLine('limited-line', 4);
  const freshCart = reconcileCartStock([line], new Map([['stock-test-small', 2]]));
  const result = await updateCartLineQuantity([line], line.id, 5, async () => ({
    cart: freshCart,
    available: 2,
  }));
  assert.equal(result.status, 'limited');
  assert.equal(result.quantity, 2);
  assert.equal(result.cart[0].quantity, 2);
});

test('rapid increments for the same variant cannot run overlapping stock checks', async () => {
  const line = cartLine('rapid-line', 1);
  const active = new Set<string>();
  let resolveStock!: (result: { cart: CartItem[]; available: number }) => void;
  let stockChecks = 0;
  const first = runExclusiveStockUpdate(active, line.selectedVariant.id, async () => {
    stockChecks++;
    return updateCartLineQuantity([line], line.id, 2, () => new Promise(resolve => {
      resolveStock = resolve;
    }));
  });
  const second = await runExclusiveStockUpdate(active, line.selectedVariant.id, async () => {
    stockChecks++;
    return updateCartLineQuantity([line], line.id, 2, async () => ({
      cart: [line],
      available: 2,
    }));
  });
  assert.equal(second.acquired, false);
  resolveStock({ cart: [line], available: 2 });
  const firstResult = await first;
  assert.equal(firstResult.acquired, true);
  assert.equal(firstResult.value?.quantity, 2);
  assert.equal(stockChecks, 1);
});

test('stock refresh failure rejects an increment without mutating cart state', async () => {
  const line = cartLine('failed-refresh-line', 1);
  const cart = [line];
  await assert.rejects(
    updateCartLineQuantity(cart, line.id, 2, async () => {
      throw new Error('RPC failed');
    }),
    /RPC failed/,
  );
  assert.equal(cart[0].quantity, 1);
});

test('decrementing does not request stock when stock retrieval is unavailable', async () => {
  const line = cartLine('decrement-line', 2);
  let stockChecks = 0;
  const result = await updateCartLineQuantity([line], line.id, 1, async () => {
    stockChecks++;
    throw new Error('RPC unavailable');
  });
  assert.equal(result.cart[0].quantity, 1);
  assert.equal(stockChecks, 0);
});

const publishedVariants = [
  { id: 'database-a-standard', productId: 'product-a', name: 'Standard', colorName: 'Red' },
  { id: 'database-b-standard', productId: 'product-b', name: 'Standard', colorName: 'Red' },
];

test('legacy variant IDs resolve only within the owning product despite collisions', () => {
  const legacy: ProductVariant = { id: 'standard', name: 'Standard', inStock: true };
  assert.equal(
    resolveVariantIdForProduct('product-a', legacy, 'Red', publishedVariants),
    'database-a-standard',
  );
  assert.equal(
    resolveVariantIdForProduct('product-b', legacy, 'Red', publishedVariants),
    'database-b-standard',
  );
});

test('canonical variants owned by a different product are rejected', () => {
  const foreign: ProductVariant = {
    id: 'database-b-standard',
    productId: 'product-b',
    name: 'Standard',
    inStock: true,
    availableQuantity: 3,
  };
  assert.equal(
    resolveVariantIdForProduct('product-a', foreign, 'Red', publishedVariants),
    null,
  );
});

test('canonical variant IDs resolve by exact ID and product ownership', () => {
  const canonical: ProductVariant = {
    id: 'database-a-standard',
    productId: 'product-a',
    name: 'Standard',
    inStock: true,
    availableQuantity: 2,
  };
  assert.equal(
    resolveVariantIdForProduct('product-a', canonical, 'Red', publishedVariants),
    'database-a-standard',
  );
});
