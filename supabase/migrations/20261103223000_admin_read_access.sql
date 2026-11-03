create policy "admins read profiles" on public.profiles
  for select using (public.is_admin());

create policy "admins read addresses" on public.addresses
  for select using (public.is_admin());
