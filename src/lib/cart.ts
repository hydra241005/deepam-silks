import { CartItem, Product, ProductVariant } from '../types';

export const MAX_CART_QUANTITY = 20;

export interface PublishedVariantIdentity {
  id: string;
  productId: string;
  name: string;
  colorName: string;
}

export const getVariantColorLabel = (variant: Pick<ProductVariant, 'colorName'>): string | null =>
  variant.colorName === undefined ? null : variant.colorName || 'Default';

export const variantSupportsColor = (
  variant: Pick<ProductVariant, 'colorName'>,
  colorName: string,
): boolean => {
  const variantColorName = getVariantColorLabel(variant);
  return variantColorName === null || variantColorName === colorName;
};

export const resolveVariantIdForProduct = (
  productId: string,
  variant: ProductVariant,
  colorName: string,
  publishedVariants: PublishedVariantIdentity[],
): string | null => {
  const owned = publishedVariants.filter(item => item.productId === productId);
  if (variant.availableQuantity !== undefined || variant.productId !== undefined) {
    if (variant.productId !== productId) return null;
    return owned.find(item => item.id === variant.id && item.name === variant.name)?.id ?? null;
  }

  const exact = owned.find(item => item.id === variant.id && item.name === variant.name);
  if (exact) return exact.id;
  const prefixed = owned.find(item => item.id === `${productId}-${variant.id}` && item.name === variant.name);
  if (prefixed) return prefixed.id;

  const named = owned.filter(item => item.name === variant.name);
  const colorMatches = named.filter(item => item.colorName === colorName);
  if (colorMatches.length === 1) return colorMatches[0].id;
  return named.length === 1 ? named[0].id : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const reconcileCartStock = (cart: CartItem[], stock: Map<string, number>): CartItem[] => {
  const remaining = new Map<string, number>();
  const reconciled: CartItem[] = [];
  for (const item of cart) {
    const variantId = item.selectedVariant.id;
    if (!stock.has(variantId)) {
      reconciled.push(item);
      continue;
    }
    const capacity = remaining.get(variantId) ?? Math.min(stock.get(variantId) ?? 0, MAX_CART_QUANTITY);
    const quantity = Math.min(item.quantity, capacity);
    if (quantity > 0) {
      reconciled.push(quantity === item.quantity ? item : { ...item, quantity });
      remaining.set(variantId, capacity - quantity);
    } else {
      remaining.set(variantId, capacity);
    }
  }
  return reconciled;
};

export const remainingCartLineQuantity = (
  cart: CartItem[],
  cartItemId: string,
  available: number,
  variantId?: string,
): number => {
  const item = cart.find(cartItem => cartItem.id === cartItemId);
  const targetVariantId = item?.selectedVariant.id ?? variantId;
  if (!targetVariantId || !Number.isInteger(available) || available < 0) return 0;
  const reservedByOtherLines = cart.reduce((total, cartItem) =>
    cartItem.id !== cartItemId && cartItem.selectedVariant.id === targetVariantId
      ? total + cartItem.quantity
      : total, 0);
  return Math.max(0, Math.min(available, MAX_CART_QUANTITY) - reservedByOtherLines);
};

export const updateCartLineQuantity = async (
  cart: CartItem[],
  cartItemId: string,
  requested: number,
  fetchFreshStock: () => Promise<{ cart: CartItem[]; available: number }>,
): Promise<{ cart: CartItem[]; status: 'updated' | 'limited' | 'removed' | 'unchanged'; quantity?: number }> => {
  const item = cart.find(cartItem => cartItem.id === cartItemId);
  if (!item || !Number.isInteger(requested)) return { cart, status: 'unchanged' };
  if (requested <= 0) return { cart: cart.filter(cartItem => cartItem.id !== cartItemId), status: 'removed' };
  if (requested <= item.quantity) {
    return {
      cart: cart.map(cartItem => cartItem.id === cartItemId ? { ...cartItem, quantity: requested } : cartItem),
      status: 'updated',
      quantity: requested,
    };
  }

  const increaseBy = requested - item.quantity;
  const { cart: freshCart, available } = await fetchFreshStock();
  const freshItem = freshCart.find(cartItem => cartItem.id === cartItemId);
  if (!freshItem) return { cart: freshCart, status: 'removed', quantity: 0 };
  const maximum = remainingCartLineQuantity(freshCart, cartItemId, available);
  const quantity = Math.min(freshItem.quantity + increaseBy, maximum);
  if (quantity < 1) return { cart: freshCart, status: 'limited', quantity: 0 };
  return {
    cart: freshCart.map(cartItem => cartItem.id === cartItemId ? { ...cartItem, quantity } : cartItem),
    status: quantity < freshItem.quantity + increaseBy ? 'limited' : 'updated',
    quantity,
  };
};

export const runExclusiveStockUpdate = async <T>(
  activeKeys: Set<string>,
  key: string,
  operation: () => Promise<T>,
): Promise<{ acquired: boolean; value?: T }> => {
  if (activeKeys.has(key)) return { acquired: false };
  activeKeys.add(key);
  try {
    return { acquired: true, value: await operation() };
  } finally {
    activeKeys.delete(key);
  }
};

export const reconcileStoredCart = (saved: unknown, products: Product[]): CartItem[] => {
  if (!Array.isArray(saved)) return [];
  const productsById = new Map(products.map(product => [product.id, product]));
  const restored = new Map<string, CartItem>();

  for (const value of saved) {
    if (!isRecord(value) || typeof value.productId !== 'string' ||
        !isRecord(value.selectedVariant) || typeof value.selectedVariant.id !== 'string' ||
        !isRecord(value.selectedColor) || typeof value.selectedColor.name !== 'string' ||
        typeof value.quantity !== 'number' || !Number.isInteger(value.quantity) || value.quantity < 1) continue;

    const storedVariantId = value.selectedVariant.id;
    const savedColorName = value.selectedColor.name;
    const product = productsById.get(value.productId);
    const variant = product?.variants.find(item => item.id === storedVariantId) ??
      product?.variants.find(item => item.id === `${product.id}-${storedVariantId}`);
    if (!product || !variant) continue;
    const available = variant.availableQuantity ?? 0;
    if (available < 1) continue;

    const variantColorName = getVariantColorLabel(variant);
    const selectedColor = variantColorName === null
      ? product.colors.find(color => color.name === savedColorName) ?? {
          name: savedColorName,
          hex: typeof value.selectedColor.hex === 'string' ? value.selectedColor.hex : '#e5e5e5',
        }
      : product.colors.find(color => color.name === variantColorName);
    if (!selectedColor) continue;
    const id = `${product.id}-${selectedColor.name}-${variant.id}`;
    const quantity = Math.min(value.quantity, available, MAX_CART_QUANTITY);
    const existing = restored.get(id);
    restored.set(id, {
      id,
      productId: product.id,
      product,
      selectedColor,
      selectedVariant: variant,
      quantity: Math.min(available, MAX_CART_QUANTITY, quantity + (existing?.quantity ?? 0)),
    });
  }
  return reconcileCartStock([...restored.values()], new Map(
    products.flatMap(product => product.variants.map(variant => [
      variant.id,
      variant.availableQuantity ?? 0,
    ] as const))
  ));
};
