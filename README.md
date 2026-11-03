<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2cadc58e-d4d9-44e6-ab66-8b32d26f35ab

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Secure commerce integration

Checkout and admin access fail closed until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. The browser uses Supabase Auth and invokes the `create-order` and `create-payment` Edge Functions; it never creates authoritative orders or calculates trusted payment totals.

The Supabase schema and Edge Functions are in [`supabase/`](./supabase/). They are not applied automatically. Configure authentication, database secrets, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only in Supabase/server secrets. `VITE_SUPABASE_ANON_KEY` is the only Supabase key allowed in the browser.

COD is the only enabled payment method for the initial launch. The database migration creates a private `commerce_settings` record with `online_payments_enabled = false`, and both order creation and payment creation reject online methods server-side. To enable Razorpay later, update that setting through a controlled service-role operation and set the `ONLINE_PAYMENTS_ENABLED` Supabase function secret to `true`; Razorpay keys and webhook secrets are not required for COD checkout.

The Razorpay webhook is the payment source of truth. A browser callback only completes the local UI flow; it cannot mark an order paid. Reservation expiry and payment failure release stock through idempotent database functions.
