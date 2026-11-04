create or replace function public.lock_offer_products(
  p_offer_id uuid,
  p_product_ids text[] default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_product_id text;
begin
  for v_product_id in
    select product_id
    from (
      select unnest(coalesce(
        p_product_ids,
        array(
          select pd.product_id
          from public.product_discounts pd
          where pd.offer_id = p_offer_id
        )
      )) as product_id
    ) product_ids
    where product_id is not null
    group by product_id
    order by product_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_product_id, 0));
  end loop;
end;
$$;

revoke all on function public.lock_offer_products(uuid, text[]) from public, anon, authenticated;

create or replace function public.prevent_overlapping_product_offers()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_product_ids text[];
begin
  if tg_op = 'DELETE' then
    v_product_ids := array[old.product_id];
  elsif tg_op = 'UPDATE' then
    v_product_ids := array[old.product_id, new.product_id];
  else
    v_product_ids := array[new.product_id];
  end if;
  perform public.lock_offer_products(coalesce(new.offer_id, old.offer_id), v_product_ids);
  if tg_op = 'DELETE' then
    return old;
  end if;
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
before insert or update or delete on public.product_discounts
for each row execute function public.prevent_overlapping_product_offers();

create or replace function public.prevent_overlapping_offer_dates()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform public.lock_offer_products(coalesce(new.id, old.id));
  if tg_op = 'DELETE' then
    return old;
  end if;
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
before insert or update or delete on public.offers
for each row execute function public.prevent_overlapping_offer_dates();

create or replace view public.storefront_settings
with (security_invoker = true)
as
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

drop policy if exists "admins read settings" on public.store_settings;
drop policy if exists "public reads settings" on public.store_settings;
create policy "storefront settings are readable" on public.store_settings
  for select using (true);

revoke all on public.store_settings from anon, authenticated;
grant select (
  id, store_name, contact_email, contact_phone, support_email, support_phone,
  currency, free_delivery_threshold_minor, delivery_fee_minor, announcement, updated_at
) on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

create or replace function public.get_admin_store_settings()
returns setof public.store_settings
language sql
security definer
set search_path = pg_catalog, public
as $$
  select s.*
  from public.store_settings s
  where public.is_admin()
$$;

revoke all on function public.get_admin_store_settings() from public, anon, authenticated;
grant execute on function public.get_admin_store_settings() to authenticated;
