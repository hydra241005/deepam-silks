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
    (case when p_payment_method = 'cod' then 'pending' else 'created' end)::public.payment_status,
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
