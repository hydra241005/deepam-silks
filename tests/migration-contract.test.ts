import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const migrationPath = fileURLToPath(new URL(
  '../supabase/migrations/20261101093000_secure_commerce.sql',
  import.meta.url,
));
const migration = readFileSync(migrationPath, 'utf8');
const codOnlyMigration = readFileSync(new URL(
  '../supabase/migrations/20261103183000_cod_only_payments.sql',
  import.meta.url,
), 'utf8');
const rpcPrivilegeMigration = readFileSync(new URL(
  '../supabase/migrations/20261109120000_restrict_commerce_rpc_execution.sql',
  import.meta.url,
), 'utf8');
const colorValidationMigration = readFileSync(new URL(
  '../supabase/migrations/20261124173217_validate_order_item_color.sql',
  import.meta.url,
), 'utf8');

test('migration rejects malformed orders and serializes inventory reservations', () => {
  assert.match(migration, /p_items is null/);
  assert.match(migration, /jsonb_typeof\(p_items\) <> 'array'/);
  assert.match(migration, /jsonb_typeof\(v_item->'quantity'\) <> 'number'/);
  assert.match(migration, /for update/);
  assert.match(migration, /unique \(order_id, variant_id\)/);
});

test('create_order casts COD payment status to the database enum', () => {
  const fixMigration = readFileSync(new URL(
    '../supabase/migrations/20261103220000_fix_create_order_payment_status_enum.sql',
    import.meta.url,
  ), 'utf8');
  assert.match(fixMigration, /create or replace function public\.create_order/);
  assert.match(fixMigration, /\(case when p_payment_method = 'cod' then 'pending' else 'created' end\)::public\.payment_status/);
  assert.match(fixMigration, /returns public\.orders/);
  assert.match(fixMigration, /grant execute on function public\.create_order\(uuid, text, jsonb, jsonb, text\) to authenticated/);
});

test('migration makes webhook retries durable outside the payment transaction', () => {
  assert.match(migration, /create or replace function public\.mark_payment_event_retry/);
  assert.match(migration, /status = 'retry_pending'/);
  assert.match(migration, /attempt_count = attempt_count \+ 1/);
  assert.doesNotMatch(migration, /exception when others then[\s\S]*retry_pending/);
});

test('migration defines terminal late-payment, COD, and cancellation guards', () => {
  assert.match(migration, /payment_status = 'review'/);
  assert.match(migration, /create or replace function public\.confirm_cod_order/);
  assert.match(migration, /revoke all on function public\.confirm_cod_order\(uuid\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.confirm_cod_order\(uuid\) to service_role/);
  assert.match(migration, /v_order\.payment_method <> 'cod'/);
  assert.match(migration, /COD order is already confirmed/);
  assert.match(migration, /COD order is not eligible for confirmation/);
  assert.match(migration, /COD order has no order items/);
  assert.match(migration, /COD order has non-held inventory reservations/);
  assert.match(migration, /COD reservations do not match order items/);
  assert.match(migration, /from public\.inventory_reservations[\s\S]*for update/);
  assert.match(migration, /full join reservation_totals using \(variant_id\)/);
  assert.match(migration, /create or replace function public\.cancel_order/);
  assert.match(migration, /payment_status in \('refunded', 'paid'\)/);
});

test('payment creation permits only non-terminal persisted order states', () => {
  const paymentFunction = readFileSync(new URL(
    '../supabase/functions/create-payment/index.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(paymentFunction, /!\['created', 'pending'\]\.includes\(order\.payment_status\)/);
  assert.match(paymentFunction, /!\['pending', 'processing'\]\.includes\(order\.fulfillment_status\)/);
  assert.doesNotMatch(paymentFunction, /order\.payment_status === 'review'/);
});

test('COD checkout is the only enabled launch payment method', () => {
  const createOrderFunction = readFileSync(new URL(
    '../supabase/functions/create-order/index.ts',
    import.meta.url,
  ), 'utf8');
  const checkout = readFileSync(new URL(
    '../src/components/CheckoutModal.tsx',
    import.meta.url,
  ), 'utf8');
  assert.match(createOrderFunction, /body\.paymentMethod !== 'cod'/);
  assert.match(createOrderFunction, /Online payments are disabled for the initial launch/);
  assert.match(checkout, /useState<'cod'>\('cod'\)/);
  assert.doesNotMatch(checkout, /onChange=\{\(\) => setPaymentMethod/);
});

test('create-order returns safe RPC errors for frontend diagnostics', () => {
  const createOrderFunction = readFileSync(new URL(
    '../supabase/functions/create-order/index.ts',
    import.meta.url,
  ), 'utf8');
  const backend = readFileSync(new URL(
    '../src/lib/backend.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(createOrderFunction, /safeCheckoutError/);
  assert.match(createOrderFunction, /console\.error\('create_order RPC failed'/);
  assert.match(createOrderFunction, /Checkout could not be completed securely/);
  assert.match(backend, /error\.context instanceof Response/);
  assert.match(backend, /error\.context\.clone\(\)\.json/);
});

test('online payment creation is disabled by both server configuration layers', () => {
  const paymentFunction = readFileSync(new URL(
    '../supabase/functions/create-payment/index.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(paymentFunction, /ONLINE_PAYMENTS_ENABLED.*!== 'true'/);
  assert.match(paymentFunction, /rpc\('online_payments_enabled'\)/);
  const webhookFunction = readFileSync(new URL(
    '../supabase/functions/razorpay-webhook/index.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(webhookFunction, /ONLINE_PAYMENTS_ENABLED.*!== 'true'/);
  assert.match(codOnlyMigration, /online_payments_enabled boolean not null default false/);
  assert.match(codOnlyMigration, /Online payments are disabled/);
});

test('COD confirmation remains unauthorized to customers and idempotently guarded', () => {
  assert.match(migration, /revoke all on function public\.confirm_cod_order\(uuid\) from public, anon, authenticated/);
  assert.match(migration, /v_order\.payment_status = 'paid'/);
  assert.match(migration, /COD order is already confirmed/);
  assert.match(migration, /status <> 'held'/);
  assert.match(migration, /full join reservation_totals using \(variant_id\)/);
  assert.match(codOnlyMigration, /revoke all on public\.commerce_settings from public, anon, authenticated/);
});

test('migration scopes privilege changes and handles optional signup phones safely', () => {
  assert.doesNotMatch(migration, /revoke all on all tables in schema public/);
  assert.match(migration, /new\.raw_user_meta_data->>'phone' ~ '\^\[6-9\]\[0-9\]\{9\}\$'/);
  assert.match(migration, /else null/);
  assert.match(migration, /product-images bucket exists but is private/);
  assert.match(migration, /if not v_public then/);
});

test('service-only commerce RPCs are not executable by API roles', () => {
  const serviceOnlyFunctions = [
    'release_order_reservations(uuid, text)',
    'process_razorpay_event(uuid, text, text, text, bigint, text)',
    'mark_payment_event_retry(uuid, text)',
    'release_expired_reservations()',
    'reset_stale_payment_attempts()',
  ];

  for (const signature of serviceOnlyFunctions) {
    assert.ok(rpcPrivilegeMigration.includes(
      `revoke all on function public.${signature} from public, anon, authenticated;`,
    ));
    assert.ok(rpcPrivilegeMigration.includes(
      `grant execute on function public.${signature} to service_role;`,
    ));
  }
});

test('authenticated commerce RPCs explicitly exclude anonymous callers', () => {
  const authenticatedFunctions = [
    'create_order(uuid, text, jsonb, jsonb, text)',
    'cancel_order(uuid)',
    'create_admin_product(jsonb, jsonb)',
    'update_order_fulfillment_status(uuid, public.fulfillment_status)',
  ];

  for (const signature of authenticatedFunctions) {
    assert.ok(rpcPrivilegeMigration.includes(
      `revoke all on function public.${signature} from public, anon;`,
    ));
    assert.ok(rpcPrivilegeMigration.includes(
      `grant execute on function public.${signature} to authenticated;`,
    ));
  }
});

test('order item colors must match the selected product variant', () => {
  const createOrderFunction = readFileSync(new URL(
    '../supabase/functions/create-order/index.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(colorValidationMigration, /create or replace function public\.validate_order_item_color/);
  assert.match(colorValidationMigration, /security invoker/);
  assert.match(colorValidationMigration, /where pv\.id = new\.variant_id[\s\S]*and pv\.product_id = new\.product_id/);
  assert.match(colorValidationMigration, /new\.color_name is distinct from v_variant_color/);
  assert.match(colorValidationMigration, /raise exception 'color does not match variant'/);
  assert.match(colorValidationMigration, /before insert or update on public\.order_items/);
  assert.match(createOrderFunction, /'color does not match variant'/);
});
