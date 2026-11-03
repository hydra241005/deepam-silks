alter table public.products
  add column if not exists description text not null default '',
  add column if not exists subcategory text not null default '',
  add column if not exists featured boolean not null default false;

alter table public.categories
  add column if not exists display_order integer not null default 0;

create or replace function public.create_admin_product(
  p_product jsonb,
  p_variants jsonb
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_product public.products;
  v_variant jsonb;
  v_variant_id text;
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'administrator access required';
  end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 then
    raise exception 'at least one product variant is required';
  end if;
  if coalesce(trim(p_product->>'id'), '') = ''
     or coalesce(trim(p_product->>'name'), '') = ''
     or coalesce(trim(p_product->>'category'), '') = ''
     or coalesce((p_product->>'price_minor')::bigint, -1) < 0 then
    raise exception 'invalid product details';
  end if;

  insert into public.products (
    id, name, category, price_minor, currency, published, primary_image,
    description, subcategory, featured
  ) values (
    trim(p_product->>'id'), trim(p_product->>'name'), trim(p_product->>'category'),
    (p_product->>'price_minor')::bigint, 'INR',
    coalesce((p_product->>'published')::boolean, false),
    coalesce(p_product->>'primary_image', ''),
    coalesce(p_product->>'description', ''),
    coalesce(p_product->>'subcategory', ''),
    coalesce((p_product->>'featured')::boolean, false)
  ) returning * into v_product;

  for v_variant in select * from jsonb_array_elements(p_variants) loop
    v_variant_id := trim(v_variant->>'id');
    v_stock := coalesce((v_variant->>'stock')::integer, -1);
    if v_variant_id = '' or coalesce(trim(v_variant->>'name'), '') = '' or v_stock < 0 then
      raise exception 'invalid product variant';
    end if;
    insert into public.product_variants (id, product_id, name, color_name, active)
    values (v_variant_id, v_product.id, trim(v_variant->>'name'), coalesce(v_variant->>'color_name', ''), true);
    insert into public.inventory (variant_id, available_quantity)
    values (v_variant_id, v_stock);
  end loop;
  return v_product;
exception
  when unique_violation then
    raise exception 'product code or variant already exists';
end;
$$;

revoke all on function public.create_admin_product(jsonb, jsonb) from public;
grant execute on function public.create_admin_product(jsonb, jsonb) to authenticated;
