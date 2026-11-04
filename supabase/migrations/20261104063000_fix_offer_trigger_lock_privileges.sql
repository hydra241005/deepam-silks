create or replace function public.prevent_overlapping_product_offers()
returns trigger
language plpgsql
security definer
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

create or replace function public.prevent_overlapping_offer_dates()
returns trigger
language plpgsql
security definer
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
