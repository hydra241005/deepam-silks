create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.payment_status as enum ('created', 'pending', 'paid', 'failed', 'refunded', 'review');
create type public.fulfillment_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.reservation_status as enum ('held', 'committed', 'released', 'expired');
create type public.payment_event_status as enum ('pending', 'processing', 'processed', 'retry_pending', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text not null check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  pin_code text not null check (pin_code ~ '^[1-9][0-9]{5}$'),
  address_line1 text not null check (char_length(address_line1) between 5 and 240),
  address_line2 text,
  city text not null check (char_length(city) between 2 and 80),
  state text not null check (char_length(state) between 2 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  name text not null,
  category text not null,
  price_minor bigint not null check (price_minor >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  published boolean not null default false,
  primary_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id text primary key,
  product_id text not null references public.products(id) on delete restrict,
  name text not null,
  color_name text not null default '',
  active boolean not null default true,
  unique (product_id, name, color_name)
);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  variant_id text not null references public.product_variants(id) on delete restrict,
  color_name text not null default '',
  quantity integer not null check (quantity > 0 and quantity <= 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, variant_id, color_name)
);

create table public.inventory (
  variant_id text primary key references public.product_variants(id) on delete restrict,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  currency text not null default 'INR' check (currency = 'INR'),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  payment_method text not null check (payment_method in ('upi', 'card', 'netbanking', 'cod')),
  payment_status public.payment_status not null default 'created',
  fulfillment_status public.fulfillment_status not null default 'pending',
  shipping_address jsonb not null,
  idempotency_key uuid not null,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  payment_attempt_id uuid,
  payment_attempt_started_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check (total_minor = subtotal_minor - discount_minor + shipping_minor),
  check (discount_minor <= subtotal_minor),
  check (payment_method <> 'cod' or (razorpay_order_id is null and razorpay_payment_id is null))
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  variant_id text not null references public.product_variants(id) on delete restrict,
  product_name text not null,
  variant_name text not null,
  color_name text not null,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity > 0),
  product_snapshot jsonb not null,
  line_total_minor bigint generated always as (unit_price_minor * quantity) stored,
  unique (order_id, variant_id, color_name)
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id text not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status public.reservation_status not null default 'held',
  expires_at timestamptz not null,
  committed_at timestamptz,
  released_at timestamptz,
  unique (order_id, variant_id)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  provider_order_id text,
  provider_payment_id text unique,
  order_id uuid references public.orders(id) on delete restrict,
  event_type text not null,
  payload jsonb not null,
  status public.payment_event_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  processed_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  variant_id text not null references public.product_variants(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Customer'), 120),
    case
      when new.raw_user_meta_data->>'phone' ~ '^[6-9][0-9]{9}$'
        then new.raw_user_meta_data->>'phone'
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

create index orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index reservations_expiry_idx on public.inventory_reservations(status, expires_at);

create or replace function public.validate_shipping_address(p_address jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p_address) = 'object'
    and char_length(trim(coalesce(p_address->>'fullName', ''))) between 2 and 120
    and (p_address->>'phone') ~ '^[6-9][0-9]{9}$'
    and (p_address->>'email') ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and (p_address->>'pinCode') ~ '^[1-9][0-9]{5}$'
    and char_length(trim(coalesce(p_address->>'addressLine1', ''))) between 5 and 240
    and char_length(trim(coalesce(p_address->>'city', ''))) between 2 and 80
    and char_length(trim(coalesce(p_address->>'state', ''))) between 2 and 80;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.payment_events enable row level security;
alter table public.inventory_ledger enable row level security;

create policy "published products are public" on public.products
  for select using (published = true);
create policy "published variants are public" on public.product_variants
  for select using (active and exists (
    select 1 from public.products p where p.id = product_id and p.published
  ));
create policy "customers read own profile" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "customers update own profile" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id and role = 'customer');
create policy "customers manage own addresses" on public.addresses
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers manage own wishlist" on public.wishlists
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers manage own cart" on public.carts
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers manage own cart items" on public.cart_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers read own orders" on public.orders
  for select using ((select auth.uid()) = user_id);
create policy "customers read own order items" on public.order_items
  for select using (exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
  ));
create policy "admins read catalog" on public.products
  for select using (public.is_admin());
create policy "admins manage catalog" on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read inventory" on public.inventory
  for select using (public.is_admin());
create policy "admins manage inventory" on public.inventory
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read orders" on public.orders
  for select using (public.is_admin());
create policy "admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read order items" on public.order_items
  for select using (public.is_admin());
create policy "admins read reservations" on public.inventory_reservations
  for select using (public.is_admin());
create policy "admins read payment events" on public.payment_events
  for select using (public.is_admin());
create policy "admins read ledger" on public.inventory_ledger
  for select using (public.is_admin());

do $$
declare
  v_public boolean;
begin
  select b.public into v_public
  from storage.buckets b
  where b.id = 'product-images'
  for update;

  if found then
    if not v_public then
      raise exception 'product-images bucket exists but is private; explicit approval is required before changing visibility';
    end if;
  else
    insert into storage.buckets (id, name, public)
    values ('product-images', 'product-images', true);
  end if;
end;
$$;

revoke all on public.profiles, public.addresses, public.carts, public.products,
  public.product_variants, public.wishlists, public.cart_items, public.inventory,
  public.orders, public.order_items, public.inventory_reservations,
  public.payment_events, public.inventory_ledger from anon;
revoke all on public.profiles, public.addresses, public.carts, public.products,
  public.product_variants, public.wishlists, public.cart_items, public.inventory,
  public.orders, public.order_items, public.inventory_reservations,
  public.payment_events, public.inventory_ledger from authenticated;
grant select on public.products, public.product_variants to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items to authenticated;
grant select on public.inventory, public.inventory_reservations, public.payment_events, public.inventory_ledger to authenticated;
grant insert, update, delete on public.products, public.product_variants to authenticated;
grant select, insert, update, delete on public.addresses, public.wishlists, public.carts, public.cart_items to authenticated;

create or replace function public.create_order(
  p_idempotency_key uuid,
  p_payment_method text,
  p_address jsonb,
  p_items jsonb,
  p_promo_code text default null
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_shipping bigint := 0;
  v_item jsonb;
  v_variant public.product_variants;
  v_product public.products;
  v_inventory public.inventory;
  v_quantity integer;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_idempotency_key is null then raise exception 'idempotency key required'; end if;
  if not public.validate_shipping_address(p_address) then raise exception 'invalid shipping address'; end if;
  if p_payment_method not in ('upi', 'card', 'netbanking', 'cod') then
    raise exception 'unsupported payment method';
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain items';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    group by item->>'productId', item->>'variantId', coalesce(item->>'colorName', '')
    having count(*) > 1
  ) then
    raise exception 'duplicate cart variants are not allowed';
  end if;

  select * into v_order from public.orders
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then return v_order; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'productId', '') = ''
       or coalesce(v_item->>'variantId', '') = ''
       or jsonb_typeof(v_item->'quantity') <> 'number'
       or (v_item->>'quantity') !~ '^(?:[1-9]|1[0-9]|20)$' then
      raise exception 'invalid order item';
    end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 20 then raise exception 'invalid quantity'; end if;
    select p.* into v_product from public.products p
      where p.id = v_item->>'productId' and p.published for update;
    if not found then raise exception 'product unavailable'; end if;
    select pv.* into v_variant from public.product_variants pv
      where pv.id = v_item->>'variantId' and pv.product_id = v_product.id and pv.active for update;
    if not found then raise exception 'variant unavailable'; end if;
    select i.* into v_inventory from public.inventory i
      where i.variant_id = v_variant.id for update;
    if not found or v_inventory.available_quantity < v_quantity then
      raise exception 'insufficient inventory';
    end if;
    v_subtotal := v_subtotal + (v_product.price_minor * v_quantity);
  end loop;

  if v_subtotal >= 199900 then v_shipping := 0; else v_shipping := 15000; end if;
  if upper(coalesce(p_promo_code, '')) = 'WELCOME10' then
    v_discount := floor(v_subtotal * 10 / 100);
  elsif upper(coalesce(p_promo_code, '')) = 'FESTIVE15' then
    v_discount := floor(v_subtotal * 15 / 100);
  end if;

  insert into public.orders (
    order_number, user_id, subtotal_minor, discount_minor, shipping_minor,
    total_minor, payment_method, payment_status, shipping_address, idempotency_key
  ) values (
    'DS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    v_user_id, v_subtotal, v_discount, v_shipping, v_subtotal - v_discount + v_shipping,
    p_payment_method,
    case when p_payment_method = 'cod' then 'pending' else 'created' end,
    p_address, p_idempotency_key
  )
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_order;
  if not found then
    select * into v_order from public.orders
      where user_id = v_user_id and idempotency_key = p_idempotency_key;
    return v_order;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select p.* into v_product from public.products p where p.id = v_item->>'productId';
    select pv.* into v_variant from public.product_variants pv where pv.id = v_item->>'variantId';
    v_quantity := (v_item->>'quantity')::integer;
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_name, color_name, unit_price_minor, quantity, product_snapshot
    ) values (
      v_order.id, v_product.id, v_variant.id, v_product.name, v_variant.name,
      coalesce(v_item->>'colorName', ''), v_product.price_minor, v_quantity,
      jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'category', v_product.category,
        'price_minor', v_product.price_minor,
        'primary_image', v_product.primary_image
      )
    );
    insert into public.inventory_reservations (order_id, variant_id, quantity, expires_at)
      values (v_order.id, v_variant.id, v_quantity, now() + interval '15 minutes');
    update public.inventory
      set available_quantity = available_quantity - v_quantity, updated_at = now()
      where variant_id = v_variant.id;
    insert into public.inventory_ledger (variant_id, order_id, delta, reason)
      values (v_variant.id, v_order.id, -v_quantity, 'reservation');
  end loop;
  return v_order;
end;
$$;

revoke all on function public.create_order(uuid, text, jsonb, jsonb, text) from public;
grant execute on function public.create_order(uuid, text, jsonb, jsonb, text) to authenticated;

create or replace function public.release_order_reservations(p_order_id uuid, p_reason text)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reservation record;
  v_count integer := 0;
begin
  if p_reason not in ('payment_failed', 'order_cancelled', 'reservation_expired') then
    raise exception 'invalid reservation release reason';
  end if;
  for v_reservation in
    select * from public.inventory_reservations
    where order_id = p_order_id and status = 'held'
    for update
  loop
    update public.inventory
      set available_quantity = available_quantity + v_reservation.quantity, updated_at = now()
      where variant_id = v_reservation.variant_id;
    if not found then
      raise exception 'inventory record missing for reservation';
    end if;
    insert into public.inventory_ledger (variant_id, order_id, delta, reason)
      values (v_reservation.variant_id, p_order_id, v_reservation.quantity, p_reason);
    update public.inventory_reservations
      set status = case when p_reason = 'reservation_expired' then 'expired' else 'released' end,
          released_at = now()
      where id = v_reservation.id and status = 'held';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.process_razorpay_event(
  p_event_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_event_type text,
  p_amount_minor bigint,
  p_currency text
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders;
  v_event public.payment_events;
  v_was_processed boolean;
begin
  select * into v_event from public.payment_events where id = p_event_id for update;
  if not found then raise exception 'payment event not found'; end if;
  v_was_processed := v_event.status = 'processed';
  if p_provider_order_id is null or p_provider_payment_id is null
     or p_event_type is null or p_amount_minor is null or p_currency is null
     or v_event.provider_order_id is null
     or v_event.provider_order_id <> p_provider_order_id
     or v_event.event_type <> p_event_type then
    raise exception 'payment event identity mismatch';
  end if;
  if v_event.provider_payment_id is null
     or v_event.provider_payment_id <> p_provider_payment_id then
    raise exception 'payment event payment identity mismatch';
  end if;
  select * into v_order from public.orders
    where razorpay_order_id = p_provider_order_id for update;
  if not found then raise exception 'payment order not found'; end if;
  if v_order.payment_method = 'cod' then raise exception 'COD cannot use Razorpay'; end if;
  if p_provider_payment_id is null or p_provider_payment_id = '' then
    raise exception 'payment id required';
  end if;
  if v_order.razorpay_payment_id is not null
     and v_order.razorpay_payment_id <> p_provider_payment_id then
    raise exception 'payment association mismatch';
  end if;
  if p_currency <> v_order.currency or p_amount_minor <> v_order.total_minor then
    raise exception 'payment amount or currency mismatch';
  end if;
  if v_was_processed then
    return v_order;
  end if;
  update public.payment_events
    set status = 'processing', attempt_count = attempt_count + 1,
        last_error = null, next_retry_at = null
    where id = p_event_id;

  if p_event_type = 'payment.captured' then
    if v_order.payment_status in ('created', 'pending') then
      if v_order.fulfillment_status = 'cancelled' then
        update public.orders
          set payment_status = 'review',
              razorpay_payment_id = p_provider_payment_id,
              updated_at = now()
          where id = v_order.id;
        update public.payment_events
          set status = 'processed', order_id = v_order.id, processed_at = now(),
              last_error = 'Late capture on cancelled order requires refund/manual review'
          where id = p_event_id;
        select * into v_order from public.orders where id = v_order.id;
        return v_order;
      end if;
      update public.orders
        set payment_status = 'paid',
            razorpay_payment_id = p_provider_payment_id,
            paid_at = now(),
            updated_at = now()
        where id = v_order.id;
      update public.inventory_reservations
        set status = 'committed', committed_at = now()
        where order_id = v_order.id and status = 'held';
      if (
        select coalesce(sum(r.quantity), 0) from public.inventory_reservations r
        where r.order_id = v_order.id and r.status = 'committed'
      ) <> (
        select coalesce(sum(i.quantity), 0) from public.order_items i where i.order_id = v_order.id
      ) then
        raise exception 'reservation set does not match order items';
      end if;
    elsif v_order.payment_status in ('failed', 'refunded') then
      update public.orders
        set payment_status = 'review',
            razorpay_payment_id = p_provider_payment_id,
            updated_at = now()
        where id = v_order.id;
      update public.payment_events
        set status = 'processed', order_id = v_order.id, processed_at = now(),
            last_error = 'Late capture after reservation release requires refund/manual review'
        where id = p_event_id;
      select * into v_order from public.orders where id = v_order.id;
      return v_order;
    elsif v_order.payment_status <> 'paid' then
      raise exception 'payment cannot transition to paid';
    end if;
  elsif p_event_type = 'payment.failed' then
    if v_order.payment_status in ('created', 'pending') then
      update public.orders
        set payment_status = 'failed', failed_at = now(), updated_at = now()
        where id = v_order.id;
      perform public.release_order_reservations(v_order.id, 'payment_failed');
    elsif v_order.payment_status in ('paid', 'review') then
      update public.payment_events
        set status = 'processed', order_id = v_order.id, processed_at = now(),
            last_error = 'Late failure ignored because payment is already terminal'
        where id = p_event_id;
      select * into v_order from public.orders where id = v_order.id;
      return v_order;
    elsif v_order.payment_status <> 'failed' then
      raise exception 'payment cannot transition to failed';
    end if;
  else
    raise exception 'unsupported payment event';
  end if;

  update public.payment_events
    set status = 'processed', order_id = v_order.id, processed_at = now(),
        last_error = null
    where id = p_event_id;
  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$$;

create or replace function public.mark_payment_event_retry(
  p_event_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.payment_events
    set status = 'retry_pending',
        attempt_count = attempt_count + 1,
        last_error = left(coalesce(nullif(trim(p_error), ''), 'payment transition failed'), 1000),
        next_retry_at = now() + interval '1 minute'
    where id = p_event_id
      and status <> 'processed';
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders
    where id = p_order_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.fulfillment_status not in ('pending', 'processing')
     or v_order.payment_status in ('refunded', 'paid') then
    raise exception 'order cannot be cancelled';
  end if;
  update public.orders set fulfillment_status = 'cancelled', updated_at = now()
    where id = p_order_id;
  perform public.release_order_reservations(p_order_id, 'order_cancelled');
  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end;
$$;

revoke all on function public.release_order_reservations(uuid, text) from public;
revoke all on function public.process_razorpay_event(uuid, text, text, text, bigint, text) from public;
revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;

create or replace function public.confirm_cod_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'cod' then raise exception 'COD order not found'; end if;
  if v_order.payment_status = 'paid' then raise exception 'COD order is already confirmed'; end if;
  if v_order.payment_status <> 'pending' then raise exception 'COD order cannot be confirmed'; end if;
  if v_order.fulfillment_status not in ('pending', 'processing') then
    raise exception 'COD order is not eligible for confirmation';
  end if;
  perform 1
    from public.inventory_reservations
    where order_id = p_order_id
    for update;
  if not exists (
    select 1 from public.order_items where order_id = p_order_id
  ) then
    raise exception 'COD order has no order items';
  end if;
  if exists (
    select 1
    from public.inventory_reservations
    where order_id = p_order_id and status <> 'held'
  ) then
    raise exception 'COD order has non-held inventory reservations';
  end if;
  if exists (
    with item_totals as (
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id
      group by variant_id
    ),
    reservation_totals as (
      select variant_id, sum(quantity)::integer as quantity
      from public.inventory_reservations
      where order_id = p_order_id and status = 'held'
      group by variant_id
    )
    select 1
    from item_totals
    full join reservation_totals using (variant_id)
    where item_totals.quantity is distinct from reservation_totals.quantity
  ) then
    raise exception 'COD reservations do not match order items';
  end if;
  update public.orders
    set payment_status = 'paid', paid_at = now(), updated_at = now()
    where id = p_order_id;
  update public.inventory_reservations
    set status = 'committed', committed_at = now()
    where order_id = p_order_id and status = 'held';
  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end;
$$;
grant execute on function public.release_order_reservations(uuid, text) to service_role;
grant execute on function public.process_razorpay_event(uuid, text, text, text, bigint, text) to service_role;
revoke all on function public.mark_payment_event_retry(uuid, text) from public;
grant execute on function public.mark_payment_event_retry(uuid, text) to service_role;
revoke all on function public.confirm_cod_order(uuid) from public, anon, authenticated;
grant execute on function public.confirm_cod_order(uuid) to service_role;

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
begin
  for v_order_id in
    select order_id from public.inventory_reservations
    where status = 'held' and expires_at <= now()
    group by order_id
  loop
    v_count := v_count + public.release_order_reservations(v_order_id, 'reservation_expired');
    update public.orders
      set payment_status = case when payment_status in ('created', 'pending') then 'failed' else payment_status end,
          updated_at = now()
      where id = v_order_id and fulfillment_status = 'pending';
  end loop;
  return v_count;
end;
$$;

revoke all on function public.release_expired_reservations() from public;
grant execute on function public.release_expired_reservations() to service_role;

create or replace function public.reset_stale_payment_attempts()
returns integer
language sql
security definer
set search_path = pg_catalog, public
as $$
  with reset as (
    update public.orders
      set payment_status = 'created',
          payment_attempt_id = null,
          payment_attempt_started_at = null,
          updated_at = now()
    where payment_status = 'pending'
      and razorpay_order_id is null
      and (
        payment_attempt_started_at is null
        or payment_attempt_started_at < now() - interval '2 minutes'
      )
    returning id
  )
  select count(*)::integer from reset;
$$;

revoke all on function public.reset_stale_payment_attempts() from public;
grant execute on function public.reset_stale_payment_attempts() to service_role;

create policy "published product images are readable" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "admins manage product images" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
