import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Authentication required.' }, 401);

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'Authentication required.' }, 401);
  if (Deno.env.get('ONLINE_PAYMENTS_ENABLED') !== 'true') {
    return json({ error: 'Online payments are disabled for the initial launch.' }, 503);
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }
  if (!body?.orderId || typeof body.orderId !== 'string') return json({ error: 'Order ID is required.' }, 400);

  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) return json({ error: 'Payment provider is not configured.' }, 503);

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: onlinePaymentsEnabled, error: settingsError } = await serviceClient
    .rpc('online_payments_enabled');
  if (settingsError) return json({ error: 'Payment configuration could not be verified.' }, 503);
  if (onlinePaymentsEnabled !== true) {
    return json({ error: 'Online payments are disabled for the initial launch.' }, 503);
  }
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select('id, order_number, total_minor, currency, payment_method, fulfillment_status, payment_status, razorpay_order_id, user_id, payment_attempt_id, payment_attempt_started_at')
    .eq('id', body.orderId)
    .eq('user_id', user.id)
    .single();
  if (orderError || !order) return json({ error: 'Order not found.' }, 404);
  if (order.payment_method === 'cod') return json({ error: 'COD orders do not use online payment.' }, 409);
  if (!['created', 'pending'].includes(order.payment_status)) {
    return json({ error: 'This order is not eligible for payment.' }, 409);
  }
  if (!['pending', 'processing'].includes(order.fulfillment_status)) {
    return json({ error: 'This order is not eligible for payment.' }, 409);
  }
  if (order.razorpay_order_id) return json({
    keyId,
    orderId: order.razorpay_order_id,
    amount: order.total_minor,
    currency: order.currency,
  });

  const staleBefore = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  if (order.payment_status === 'pending' &&
      (!order.payment_attempt_started_at || order.payment_attempt_started_at < staleBefore)) {
    await serviceClient
      .from('orders')
      .update({
        payment_status: 'created',
        payment_attempt_id: null,
        payment_attempt_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('payment_status', 'pending')
      .is('razorpay_order_id', null);
  }
  const attemptId = crypto.randomUUID();
  const { data: claimedOrder, error: claimError } = await serviceClient
    .from('orders')
    .update({
      payment_status: 'pending',
      payment_attempt_id: attemptId,
      payment_attempt_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('payment_status', 'created')
    .is('razorpay_order_id', null)
    .select('id')
    .maybeSingle();
  if (claimError) return json({ error: 'Payment attempt could not be started.' }, 500);
  if (!claimedOrder) return json({ error: 'Another payment attempt is already being created. Please retry shortly.' }, 409);

  const resetAttempt = async () => {
    await serviceClient
      .from('orders')
      .update({
        payment_status: 'created',
        payment_attempt_id: null,
        payment_attempt_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('payment_attempt_id', attemptId)
      .eq('payment_status', 'pending')
      .is('razorpay_order_id', null);
  };

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: order.total_minor,
          currency: order.currency,
          receipt: order.order_number,
          notes: { order_id: order.id },
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    await resetAttempt();
    return json({ error: 'Payment provider timed out or could not be reached.' }, 502);
  }
  if (!response.ok) {
    await resetAttempt();
    return json({ error: 'Payment provider order creation failed.' }, 502);
  }
  let providerOrder: { id?: unknown; amount?: unknown; currency?: unknown };
  try {
    providerOrder = await response.json();
  } catch {
    await resetAttempt();
    return json({ error: 'Payment provider returned invalid JSON.' }, 502);
  }
  if (
    typeof providerOrder.id !== 'string' ||
    !/^order_[A-Za-z0-9]+$/.test(providerOrder.id) ||
    providerOrder.amount !== order.total_minor ||
    providerOrder.currency !== order.currency
  ) {
    await resetAttempt();
    return json({ error: 'Payment provider response did not match the order.' }, 502);
  }
  const { data: associatedOrder, error: updateError } = await serviceClient
    .from('orders')
    .update({
      razorpay_order_id: providerOrder.id,
      payment_status: 'pending',
      payment_attempt_id: null,
      payment_attempt_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('payment_status', 'pending')
    .eq('payment_attempt_id', attemptId)
    .is('razorpay_order_id', null)
    .select('id')
    .maybeSingle();
  if (updateError || !associatedOrder) {
    const { data: reconciledOrder } = await serviceClient
      .from('orders')
      .select('id, total_minor, currency')
      .eq('razorpay_order_id', providerOrder.id)
      .maybeSingle();
    if (
      reconciledOrder?.id === order.id &&
      reconciledOrder.total_minor === order.total_minor &&
      reconciledOrder.currency === order.currency
    ) {
      return json({
        keyId,
        orderId: providerOrder.id,
        amount: order.total_minor,
        currency: order.currency,
      });
    }
    await resetAttempt();
    return json({ error: 'Payment order could not be safely associated.' }, 500);
  }

  return json({
    keyId,
    orderId: providerOrder.id,
    amount: order.total_minor,
    currency: order.currency,
  });
});
