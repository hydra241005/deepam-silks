import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) =>
  left.length === right.length && (() => {
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
    return difference === 0;
  })();

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (Deno.env.get('ONLINE_PAYMENTS_ENABLED') !== 'true') {
    return new Response('Online payments are disabled for the initial launch.', { status: 503 });
  }
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!signature || !secret) return new Response('Webhook verification unavailable', { status: 503 });

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody)));
  if (!/^[0-9a-f]{64}$/i.test(signature)) return new Response('Invalid signature', { status: 400 });
  const received = new Uint8Array(signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  if (!timingSafeEqual(expected, received)) return new Response('Invalid signature', { status: 400 });

  let payload: {
    event: string;
    payload?: {
      payment?: { entity?: Record<string, string | number> };
      order?: { entity?: Record<string, string | number> };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const eventId = request.headers.get('x-razorpay-event-id');
  if (!eventId) return new Response('Missing event id', { status: 400 });

  const payment = payload.payload?.payment?.entity;
  const providerOrderId = payment?.order_id;
  const amount = Number(payment?.amount);
  const currency = payment?.currency;
  if (
    !eventId ||
    !providerOrderId ||
    !payment?.id ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    typeof currency !== 'string' ||
    currency.length !== 3
  ) return new Response('Missing event data', { status: 400 });
  if (!['payment.captured', 'payment.failed'].includes(payload.event)) {
    return new Response('Unsupported event', { status: 400 });
  }
  const { data: insertedEvent, error } = await serviceClient.from('payment_events').insert({
    provider_event_id: eventId,
    provider_order_id: String(providerOrderId),
    provider_payment_id: String(payment.id),
    event_type: payload.event,
    payload,
  }).select('id').maybeSingle();
  let eventIdForProcessing = insertedEvent?.id;
  let persistenceError = error;
  if (error?.code === '23505') {
    const { data: existingEvent, error: existingError } = await serviceClient
      .from('payment_events')
      .select('id, provider_order_id, event_type, provider_payment_id')
      .eq('provider_event_id', eventId)
      .single();
    if (existingError || !existingEvent ||
        existingEvent.provider_order_id !== String(providerOrderId) ||
        existingEvent.event_type !== payload.event ||
        existingEvent.provider_payment_id !== String(payment.id)) {
      return new Response('Event identity conflict', { status: 409 });
    }
    eventIdForProcessing = existingEvent.id;
    persistenceError = null;
  }
  if (persistenceError) return new Response('Event persistence failed', { status: 500 });
  if (!eventIdForProcessing) return new Response('Event persistence failed', { status: 500 });
  const { error: transitionError } = await serviceClient.rpc('process_razorpay_event', {
    p_event_id: eventIdForProcessing,
    p_provider_order_id: String(providerOrderId),
    p_provider_payment_id: String(payment.id),
    p_event_type: payload.event,
    p_amount_minor: amount,
    p_currency: currency,
  });
  if (transitionError) {
    const { error: retryError } = await serviceClient.rpc('mark_payment_event_retry', {
      p_event_id: eventIdForProcessing,
      p_error: transitionError.message,
    });
    if (retryError) return new Response('Payment retry state could not be persisted', { status: 500 });
    return new Response('Payment transition failed', { status: 500 });
  }
  return Response.json({ ok: true });
});
