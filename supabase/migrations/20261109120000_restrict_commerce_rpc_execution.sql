revoke all on function public.release_order_reservations(uuid, text) from public, anon, authenticated;
revoke all on function public.process_razorpay_event(uuid, text, text, text, bigint, text) from public, anon, authenticated;
revoke all on function public.mark_payment_event_retry(uuid, text) from public, anon, authenticated;
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
revoke all on function public.reset_stale_payment_attempts() from public, anon, authenticated;

grant execute on function public.release_order_reservations(uuid, text) to service_role;
grant execute on function public.process_razorpay_event(uuid, text, text, text, bigint, text) to service_role;
grant execute on function public.mark_payment_event_retry(uuid, text) to service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.reset_stale_payment_attempts() to service_role;

revoke all on function public.create_order(uuid, text, jsonb, jsonb, text) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.create_admin_product(jsonb, jsonb) from public, anon;
revoke all on function public.update_order_fulfillment_status(uuid, public.fulfillment_status) from public, anon;

grant execute on function public.create_order(uuid, text, jsonb, jsonb, text) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.create_admin_product(jsonb, jsonb) to authenticated;
grant execute on function public.update_order_fulfillment_status(uuid, public.fulfillment_status) to authenticated;
