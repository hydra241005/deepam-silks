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
