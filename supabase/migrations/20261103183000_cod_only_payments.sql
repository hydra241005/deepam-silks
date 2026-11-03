create table public.commerce_settings (
  id boolean primary key default true check (id),
  online_payments_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.commerce_settings (id, online_payments_enabled)
values (true, false)
on conflict (id) do nothing;

alter table public.commerce_settings enable row level security;
revoke all on public.commerce_settings from public, anon, authenticated;

create or replace function public.online_payments_enabled()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select online_payments_enabled
    from public.commerce_settings
    where id = true
  ), false);
$$;

revoke all on function public.online_payments_enabled() from public, anon, authenticated;
grant execute on function public.online_payments_enabled() to authenticated, service_role;

create or replace function public.enforce_payment_mode()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.payment_method <> 'cod' and not public.online_payments_enabled() then
    raise exception 'Online payments are disabled';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_payment_mode() from public, anon, authenticated;
grant execute on function public.enforce_payment_mode() to service_role;

create trigger orders_payment_mode_guard
  before insert or update of payment_method on public.orders
  for each row execute function public.enforce_payment_mode();
