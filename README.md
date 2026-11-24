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

### Production password recovery configuration

Set the public build-time `VITE_APP_URL` to the production application origin (HTTPS, with no path), for example `https://shop.example.com`. Password reset emails redirect to the exact `/reset-password` path. In Supabase **Authentication → URL Configuration**, set the Site URL to the production origin and add `https://shop.example.com/reset-password` to the allowed Redirect URLs. Add each real production domain explicitly; do not use localhost URLs or broad redirect wildcards in production. The hosting platform must serve the SPA entry point for `/reset-password`.

Keep the Supabase email provider enabled. Configure a verified production SMTP sender and its provider credentials in Supabase Auth settings, not in browser environment variables; the local Supabase Mailpit service only captures test email and does not deliver messages. Review email confirmation and password recovery templates, expiration, and rate limits before launch. The production SMTP provider must support the configured sender domain and deliver recovery links reliably.
