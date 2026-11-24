create or replace function public.validate_order_item_color()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_variant_color text;
begin
  select pv.color_name
  into v_variant_color
  from public.product_variants pv
  where pv.id = new.variant_id
    and pv.product_id = new.product_id;

  if not found then
    raise exception 'variant unavailable';
  end if;
  if new.color_name is distinct from v_variant_color then
    raise exception 'color does not match variant';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_order_item_color() from public, anon, authenticated, service_role;

drop trigger if exists order_items_validate_variant_color on public.order_items;
create trigger order_items_validate_variant_color
before insert or update on public.order_items
for each row execute function public.validate_order_item_color();
