import type { Product } from '../types';

export type PublishedCatalogStatus = 'loading' | 'ready' | 'error';

export type ProductDetailResolution =
  | { status: 'loading' }
  | { status: 'catalog-error' }
  | { status: 'not-found' }
  | { status: 'unavailable' }
  | { status: 'ready'; product: Product };

export const resolveProductDetail = (
  productId: string | null,
  products: Product[],
  catalogStatus: PublishedCatalogStatus,
): ProductDetailResolution => {
  if (!productId?.trim()) return { status: 'not-found' };
  if (catalogStatus === 'loading') return { status: 'loading' };
  if (catalogStatus === 'error') return { status: 'catalog-error' };

  const product = products.find(candidate => candidate.id === productId);
  if (!product) return { status: 'not-found' };
  if (product.variants.length === 0) return { status: 'unavailable' };
  return { status: 'ready', product };
};
