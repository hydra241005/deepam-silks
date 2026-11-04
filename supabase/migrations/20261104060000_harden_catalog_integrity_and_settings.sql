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
    case
      when o.id is null then p.price_minor
      else greatest(
        0,
        p.price_minor - case
          when o.discount_type = 'percentage'
            then floor(p.price_minor * o.discount_value / 100)
          else o.discount_value
        end
      )
    end,
    case
      when o.id is null then 0
      else least(
        p.price_minor,
        case
          when o.discount_type = 'percentage'
            then floor(p.price_minor * o.discount_value / 100)
          else o.discount_value
        end
      )
    end,
    o.id
  from public.products p
  left join public.product_discounts pd on pd.product_id = p.id
  left join public.offers o
    on o.id = pd.offer_id
   and o.active
   and p_at >= o.starts_at
   and p_at <= o.ends_at
  where p.id = p_product_id
    and p.published
  order by o.created_at desc nulls last
  limit 1
$$;

create or replace function public.prevent_overlapping_product_offers()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.product_id, 0));
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

create or replace function public.prevent_overlapping_offer_dates()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_product_id text;
begin
  for v_product_id in
    select incoming.product_id
    from public.product_discounts incoming
    where incoming.offer_id = new.id
    order by incoming.product_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_product_id, 0));
  end loop;
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

drop policy if exists "public reads settings" on public.store_settings;
drop policy if exists "admins read settings" on public.store_settings;
create policy "admins read settings" on public.store_settings
  for select using (public.is_admin());

revoke all on public.store_settings from anon, authenticated;
grant select, update on public.store_settings to authenticated;

create or replace view public.storefront_settings as
select
  id,
  store_name,
  contact_email,
  contact_phone,
  support_email,
  support_phone,
  currency,
  free_delivery_threshold_minor,
  delivery_fee_minor,
  announcement,
  updated_at
from public.store_settings;

revoke all on public.storefront_settings from public;
grant select on public.storefront_settings to anon, authenticated;

alter table public.product_variants
  add constraint product_variants_id_product_id_key unique (id, product_id);

alter table public.cart_items
  add constraint cart_items_variant_product_fk
  foreign key (variant_id, product_id)
  references public.product_variants (id, product_id)
  on delete restrict;

alter table public.order_items
  add constraint order_items_variant_product_fk
  foreign key (variant_id, product_id)
  references public.product_variants (id, product_id)
  on delete restrict;
