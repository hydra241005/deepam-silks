import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const safeCheckoutError = (message: string) => {
  const knownErrors = [
    'authentication required',
    'invalid shipping address',
    'unsupported payment method',
    'order must contain items',
    'duplicate cart variants are not allowed',
    'invalid order item',
    'invalid quantity',
    'product unavailable',
    'variant unavailable',
    'color does not match variant',
    'insufficient inventory',
    'Online payments are disabled',
  ];
  const knownError = knownErrors.find(error => message.includes(error));
  return knownError ?? 'Checkout could not be completed securely.';
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response('Authentication required', { status: 401 });

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return new Response('Authentication required', { status: 401 });

  let body: {
    idempotencyKey: string;
    paymentMethod: string;
    address: Record<string, unknown>;
    items: unknown[];
    promoCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (
    typeof body?.idempotencyKey !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(body.idempotencyKey) ||
    typeof body.paymentMethod !== 'string' ||
    !body.address ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return Response.json({ error: 'Invalid order request.' }, { status: 400 });
  }
  if (body.paymentMethod !== 'cod') {
    return Response.json({ error: 'Online payments are disabled for the initial launch.' }, { status: 503 });
  }
  const { data, error } = await userClient.rpc('create_order', {
    p_idempotency_key: body.idempotencyKey,
    p_payment_method: body.paymentMethod,
    p_address: body.address,
    p_items: body.items,
    p_promo_code: body.promoCode ?? null,
  });
  if (error) {
    console.error('create_order RPC failed', { code: error.code, message: error.message });
    return Response.json({ error: safeCheckoutError(error.message) }, { status: 400 });
  }
  const { data: items, error: itemError } = await userClient
    .from('order_items')
    .select('product_id, variant_id, product_name, variant_name, color_name, unit_price_minor, quantity, product_snapshot')
    .eq('order_id', data.id);
  if (itemError) return Response.json({ error: 'Order items could not be loaded.' }, { status: 500 });
  return Response.json({ order: data, items });
});
