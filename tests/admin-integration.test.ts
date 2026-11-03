import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

test('admin live pages do not import demo records', () => {
  for (const file of [
    'src/admin/AdminOverview.tsx',
    'src/admin/AdminOrders.tsx',
    'src/admin/AdminProducts.tsx',
    'src/admin/AdminInventory.tsx',
    'src/admin/AdminAnalytics.tsx',
    'src/admin/AdminCustomers.tsx',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /adminDemoData|DEMO_/);
  }
});

test('admin backend reads and mutations require the database-backed admin role', () => {
  const source = read('src/lib/backend.ts');
  assert.match(source, /const requireAdmin = async/);
  assert.match(source, /if \(!session\.user\?\.isAdmin\)/);
  assert.match(source, /export const getAdminOrders/);
  assert.match(source, /export const updateAdminOrderStatus/);
  assert.match(source, /export const updateAdminInventory/);
});

test('admin-only profile and address reads are protected by RLS policy', () => {
  const source = read('supabase/migrations/20261103223000_admin_read_access.sql');
  assert.match(source, /admins read profiles/);
  assert.match(source, /admins read addresses/);
  assert.match(source, /public\.is_admin\(\)/);
});

test('persistent commerce migration defines protected discounts, categories, settings, and transitions', () => {
  const migration = read('supabase/migrations/20261103230000_admin_catalog_offers_settings.sql');
  assert.match(migration, /create table public\.offers/);
  assert.match(migration, /create table public\.product_discounts/);
  assert.match(migration, /prevent_overlapping_product_offers/);
  assert.match(migration, /prevent_overlapping_offer_dates/);
  assert.match(migration, /create table public\.categories/);
  assert.match(migration, /create table public\.store_settings/);
  assert.match(migration, /if not public\.is_admin\(\)/);
  assert.match(migration, /update_order_fulfillment_status/);
});

test('storefront price surfaces use persisted effective pricing when available', () => {
  assert.match(read('src/components/ProductCard.tsx'), /getEffectiveProductPrice/);
  assert.match(read('src/components/ProductDetailPage.tsx'), /getEffectiveProductPrice/);
  assert.match(read('src/lib/backend.ts'), /effective_product_price/);
});

test('effective pricing preserves the regular price when no offer is active', () => {
  const migration = read('supabase/migrations/20261103230200_fix_effective_price_without_offer.sql');
  assert.match(migration, /when o\.id is null then p\.price_minor/);
  assert.match(migration, /when o\.id is null then 0/);
});

test('admin product creation is atomic and requires variants with inventory', () => {
  const migration = read('supabase/migrations/20261103230300_admin_product_creation.sql');
  assert.match(migration, /create or replace function public\.create_admin_product/);
  assert.match(migration, /if not public\.is_admin\(\)/);
  assert.match(migration, /at least one product variant is required/);
  assert.match(migration, /insert into public\.inventory/);
  assert.match(read('src/admin/AdminProducts.tsx'), /Add Product/);
  assert.match(read('src/lib/backend.ts'), /export const createAdminProduct/);
});

test('sale navigation uses persisted active offers', () => {
  assert.match(read('src/context/ShopContext.tsx'), /getActiveOffers/);
  assert.match(read('src/components/Header.tsx'), /activeOffers/);
  const categoryPage = read('src/components/CategoryPage.tsx');
  assert.match(categoryPage, /activeOffers\.map\(offer => \(\{ id: offer\.id, label: offer\.name \}\)\)/);
  assert.match(categoryPage, /selectedOffer\?\.name/);
  assert.match(categoryPage, /selectedOffer\.productIds\.includes\(product\.id\)/);
});
