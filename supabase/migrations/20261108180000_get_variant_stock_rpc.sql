-- Narrowly scoped SECURITY DEFINER function for storefront inventory display.
--
-- Why SECURITY DEFINER:
--   The inventory table has RLS policies that only permit reads by admins.
--   Customers and anonymous users cannot query it directly.
--   This function bypasses RLS internally but enforces its own scope constraints,
--   returning available_quantity only for variants that are:
--     - explicitly requested by the caller
--     - attached to a currently published product
--     - marked as active
--   No other inventory data is accessible through this function.
--
-- Security properties:
--   - Read-only (STABLE and contains only a SELECT).
--   - Input is a text array of variant IDs; only matching rows are returned.
--   - Join to products (published = true) and product_variants (active = true)
--     prevents inventory probing for hidden/unpublished catalogue entries.
--   - Grants execute to anon and authenticated; no elevated role escapes.
--
-- Frontend contract:
--   - Returns rows only for published + active variants in p_variant_ids.
--   - Variant IDs absent from the result have no published inventory record
--     and must be treated as unavailable (available_quantity = 0) by callers.
--   - This is advisory data only. The create_order RPC with FOR UPDATE locking
--     remains the authoritative inventory check at checkout.

create or replace function public.get_variant_stock(p_variant_ids text[])
returns table (variant_id text, available_quantity integer)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_variant_ids is null then
    raise exception using errcode = '22023', message = 'variant IDs are required';
  end if;
  if pg_catalog.cardinality(p_variant_ids) > 100 then
    raise exception using errcode = '22023', message = 'at most 100 variant IDs may be requested';
  end if;
  if exists (
    select 1
    from pg_catalog.unnest(p_variant_ids) as requested(variant_id)
    where requested.variant_id is null
      or pg_catalog.btrim(requested.variant_id) = ''
      or pg_catalog.btrim(requested.variant_id) <> requested.variant_id
  ) then
    raise exception using errcode = '22023', message = 'variant IDs must be non-empty strings';
  end if;

  return query
  select i.variant_id, i.available_quantity
  from public.inventory i
  join public.product_variants pv on pv.id = i.variant_id
  join public.products p          on p.id  = pv.product_id
  where i.variant_id = any(p_variant_ids)
    and pv.active
    and p.published;
end;
$$;

revoke all on function public.get_variant_stock(text[]) from public, anon, authenticated;
grant execute on function public.get_variant_stock(text[]) to anon, authenticated;
