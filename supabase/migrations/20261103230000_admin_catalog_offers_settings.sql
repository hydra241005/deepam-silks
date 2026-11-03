create extension if not exists btree_gist;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(name)) between 2 and 120),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;

insert into public.categories (name, slug)
select initcap(category), lower(regexp_replace(category, '[^a-z0-9]+', '-', 'g'))
from public.products
where trim(category) <> ''
on conflict (slug) do nothing;

update public.products p
set category_id = c.id
from public.categories c
where p.category_id is null
  and c.slug = lower(regexp_replace(p.category, '[^a-z0-9]+', '-', 'g'));

do $$
begin
  create type public.offer_discount_type as enum ('percentage', 'fixed');
exception
  when duplicate_object then null;
end $$;

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  discount_type public.offer_discount_type not null,
  discount_value bigint not null check (discount_value > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (discount_type <> 'percentage' or discount_value between 1 and 100),
  check (discount_type <> 'fixed' or discount_value > 0)
);

create table public.product_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, offer_id)
);

create index offers_active_dates_idx on public.offers (active, starts_at, ends_at);
create index product_discounts_product_idx on public.product_discounts (product_id);

create or replace function public.prevent_overlapping_product_offers()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.product_discounts existing
    join public.offers existing_offer on existing_offer.id = existing.offer_id
    join public.offers incoming_offer on incoming_offer.id = new.offer_id
    where existing.product_id = new.product_id
      and existing.id <> new.id
      and existing_offer.active
      and incoming_offer.active
      and tstzrange(existing_offer.starts_at, existing_offer.ends_at, '[]')
          && tstzrange(incoming_offer.starts_at, incoming_offer.ends_at, '[]')
  ) then
    raise exception 'overlapping product offers are not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists product_discounts_no_overlap on public.product_discounts;
create trigger product_discounts_no_overlap
before insert or update on public.product_discounts
for each row execute function public.prevent_overlapping_product_offers();

create or replace function public.prevent_overlapping_offer_dates()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.active and exists (
    select 1
    from public.product_discounts incoming
    join public.product_discounts existing on existing.product_id = incoming.product_id
    join public.offers existing_offer on existing_offer.id = existing.offer_id
    where incoming.offer_id = new.id
      and existing.offer_id <> new.id
      and existing_offer.active
      and tstzrange(existing_offer.starts_at, existing_offer.ends_at, '[]')
          && tstzrange(new.starts_at, new.ends_at, '[]')
  ) then
    raise exception 'overlapping product offers are not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists offers_no_overlap on public.offers;
create trigger offers_no_overlap
before update on public.offers
for each row execute function public.prevent_overlapping_offer_dates();

create or replace function public.effective_product_price(
  p_product_id text,
  p_at timestamptz default now()
)
returns table (
  regular_price_minor bigint,
  effective_price_minor bigint,
  discount_minor bigint,
  offer_id uuid
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.price_minor,
    greatest(
      0,
      p.price_minor - case
        when o.discount_type = 'percentage'
          then floor(p.price_minor * o.discount_value / 100)
        else o.discount_value
      end
    ),
    least(
      p.price_minor,
      case
        when o.discount_type = 'percentage'
          then floor(p.price_minor * o.discount_value / 100)
        else o.discount_value
      end
    ),
    o.id
  from public.products p
  left join public.product_discounts pd on pd.product_id = p.id
  left join public.offers o
    on o.id = pd.offer_id
   and o.active
   and p_at >= o.starts_at
   and p_at <= o.ends_at
  where p.id = p_product_id
  order by o.created_at desc nulls last
  limit 1
$$;

alter table public.order_items add column if not exists discount_minor bigint not null default 0 check (discount_minor >= 0);
alter table public.order_items add column if not exists offer_id uuid references public.offers(id) on delete set null;

create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Deepam Silks',
  contact_email text not null default '',
  contact_phone text not null default '',
  support_email text not null default '',
  support_phone text not null default '',
  currency text not null default 'INR' check (currency = 'INR'),
  free_delivery_threshold_minor bigint not null default 199900 check (free_delivery_threshold_minor >= 0),
  delivery_fee_minor bigint not null default 15000 check (delivery_fee_minor >= 0),
  announcement text not null default '',
  notifications jsonb not null default '{"newOrder":true,"lowStock":true,"newCustomer":false,"cancellation":true}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, contact_email, contact_phone)
values (true, 'admin@deepamsilks.in', '+91 98450 11223')
on conflict (id) do nothing;

create or replace function public.update_order_fulfillment_status(
  p_order_id uuid,
  p_status public.fulfillment_status
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then raise exception 'administrator access required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.fulfillment_status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'cancelled orders cannot be reopened';
  end if;
  if v_order.fulfillment_status = 'delivered' and p_status <> 'delivered' then
    raise exception 'delivered orders cannot move backwards';
  end if;
  if v_order.fulfillment_status = 'shipped' and p_status in ('pending', 'processing') then
    raise exception 'shipped orders cannot move backwards';
  end if;
  if v_order.fulfillment_status = 'processing' and p_status = 'pending' then
    raise exception 'processing orders cannot move backwards';
  end if;
  update public.orders
  set fulfillment_status = p_status, updated_at = now()
  where id = p_order_id
  returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.update_order_fulfillment_status(uuid, public.fulfillment_status) from public;
grant execute on function public.update_order_fulfillment_status(uuid, public.fulfillment_status) to authenticated;
grant execute on function public.effective_product_price(text, timestamptz) to anon, authenticated;

alter table public.categories enable row level security;
alter table public.offers enable row level security;
alter table public.product_discounts enable row level security;
alter table public.store_settings enable row level security;

create policy "active categories are public" on public.categories
  for select using (active);
create policy "admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "active offers are public" on public.offers
  for select using (active and now() between starts_at and ends_at);
create policy "admins manage offers" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "active product discounts are public" on public.product_discounts
  for select using (exists (
    select 1 from public.offers o
    where o.id = offer_id and o.active and now() between o.starts_at and o.ends_at
  ));
create policy "admins manage product discounts" on public.product_discounts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads settings" on public.store_settings
  for select using (true);
create policy "admins manage settings" on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.categories, public.offers, public.product_discounts, public.store_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.offers, public.product_discounts, public.store_settings to authenticated;
