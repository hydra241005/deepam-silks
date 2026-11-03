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
      set status = case
        when p_reason = 'reservation_expired' then 'expired'::public.reservation_status
        else 'released'::public.reservation_status
      end,
          released_at = now()
      where id = v_reservation.id and status = 'held';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.release_order_reservations(uuid, text) from public;
grant execute on function public.release_order_reservations(uuid, text) to service_role;
