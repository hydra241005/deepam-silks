import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRODUCTS } from '../src/data/products';

const seed = readFileSync(new URL(
  '../supabase/seed/catalog.sql',
  import.meta.url,
), 'utf8');

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

test('checkout maps repeated frontend variant IDs to stable database IDs', () => {
  const context = readFileSync(new URL(
    '../src/context/ShopContext.tsx',
    import.meta.url,
  ), 'utf8');
  assert.match(context, /variantId: `\$\{item\.productId\}-\$\{item\.selectedVariant\.id\}`/);
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
