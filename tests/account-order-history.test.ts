import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const backend = readFileSync(new URL('../src/lib/backend.ts', import.meta.url), 'utf8');
const shopContext = readFileSync(new URL('../src/context/ShopContext.tsx', import.meta.url), 'utf8');

test('account refresh loads owned orders and items from the database', () => {
  assert.match(backend, /from\('orders'\)[\s\S]*?\.eq\('user_id', userId\)[\s\S]*?\.limit\(10\)/);
  assert.match(backend, /from\('order_items'\)[\s\S]*?\.in\('order_id', orderIds\)/);
  assert.match(backend, /recentOrders:\s*\(orders \?\? \[\]\)\.map/);
  assert.match(shopContext, /setRecentOrders\(data\.recentOrders\)/);
});
