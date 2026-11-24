import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRODUCTS } from '../src/data/products';

const seed = readFileSync(new URL(
  '../supabase/seed/catalog.sql',
  import.meta.url,
), 'utf8');
const config = readFileSync(new URL(
  '../supabase/config.toml',
  import.meta.url,
), 'utf8');

test('local database reset points to the catalog seed file', () => {
  assert.match(config, /sql_paths = \["\.\/seed\/catalog\.sql"\]/);
});

test('local catalog seed covers the canonical products and variants', () => {
  const products = PRODUCTS.filter(product => product.variants);
  const variantCount = products.reduce((count, product) => count + product.variants.length, 0);
  assert.equal((seed.match(/^insert into public\.products/gm) ?? []).length, products.length);
  assert.equal((seed.match(/^insert into public\.product_variants/gm) ?? []).length, variantCount);
  assert.equal((seed.match(/^insert into public\.inventory/gm) ?? []).length, variantCount);
  for (const product of products) {
    assert.match(seed, new RegExp(`'${product.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
    assert.match(seed, new RegExp(`${product.price * 100}, 'INR', true`));
    for (const variant of product.variants) {
      assert.match(seed, new RegExp(`'${product.id}-${variant.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
    }
  }
});

test('checkout sends canonical database variant IDs', () => {
  const context = readFileSync(new URL(
    '../src/context/ShopContext.tsx',
    import.meta.url,
  ), 'utf8');
  assert.match(context, /variantId: item\.selectedVariant\.id/);
});

test('checkout color and storefront options use the selected database variant color', () => {
  const backend = readFileSync(new URL('../src/lib/backend.ts', import.meta.url), 'utf8');
  const context = readFileSync(new URL('../src/context/ShopContext.tsx', import.meta.url), 'utf8');
  assert.match(backend, /select\('id, product_id, name, color_name, active'\)/);
  assert.match(backend, /colorName: variant\.color_name/);
  assert.match(context, /colorName: item\.selectedVariant\.colorName \?\? item\.selectedColor\.name/);
});

test('seed satisfies the RPC product, variant, and inventory predicates', () => {
  const migration = readFileSync(new URL(
    '../supabase/migrations/20261101093000_secure_commerce.sql',
    import.meta.url,
  ), 'utf8');
  assert.match(migration, /where p\.id = v_item->>'productId' and p\.published/);
  assert.match(migration, /where pv\.id = v_item->>'variantId' and pv\.product_id = v_product\.id and pv\.active/);
  assert.match(migration, /where i\.variant_id = v_variant\.id for update/);
  assert.match(seed, /published, primary_image\) values[\s\S]*, true,/);
  assert.match(seed, /active\) values/);
  assert.match(seed, /available_quantity\) values/);
});

test('storefront stock RPC is bounded and scoped to published active variants', () => {
  const migration = readFileSync(new URL(
    '../supabase/migrations/20261108180000_get_variant_stock_rpc.sql',
    import.meta.url,
  ), 'utf8');
  const backend = readFileSync(new URL('../src/lib/backend.ts', import.meta.url), 'utf8');
  const productLoader = backend.slice(
    backend.indexOf('export const getPublishedProducts'),
    backend.indexOf('export const saveAdminOffer'),
  );
  assert.match(migration, /cardinality\(p_variant_ids\) > 100/);
  assert.match(migration, /security definer[\s\S]*set search_path = pg_catalog, public/);
  assert.match(migration, /join public\.product_variants pv/);
  assert.match(migration, /join public\.products p/);
  assert.match(migration, /and pv\.active[\s\S]*and p\.published/);
  assert.match(migration, /grant execute on function public\.get_variant_stock\(text\[\]\) to anon, authenticated/);
  assert.match(productLoader, /getVariantStock/);
  assert.doesNotMatch(productLoader, /from\('inventory'\)/);
});
